import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getUser, updateUser } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  // Decode the state parameter to extract CSRF token and user email
  let stateData: { csrf?: string; email?: string } = {};
  if (state) {
    try {
      stateData = JSON.parse(
        Buffer.from(state, "base64url").toString("utf-8")
      );
    } catch {
      return NextResponse.redirect(
        new URL("/dashboard/strava?error=invalid_state", process.env.NEXTAUTH_URL || "http://localhost:3000")
      );
    }
  }

  // Validate CSRF token from state against the cookie
  const storedState = request.cookies.get("strava_oauth_state")?.value;
  if (!stateData.csrf || !storedState || stateData.csrf !== storedState) {
    return NextResponse.redirect(
      new URL("/dashboard/strava?error=invalid_state", process.env.NEXTAUTH_URL || "http://localhost:3000")
    );
  }

  // Determine user email: try token first, fall back to state parameter
  let userEmail: string | undefined;

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (token?.email) {
    userEmail = token.email as string;
  } else if (stateData.email) {
    // Session cookie was lost during cross-origin redirect from Strava.
    // Fall back to the email encoded in the state parameter (already CSRF-validated).
    const user = getUser(stateData.email);
    if (user) {
      userEmail = stateData.email;
    }
  }

  if (!userEmail) {
    return NextResponse.redirect(
      new URL("/login", process.env.NEXTAUTH_URL || "http://localhost:3000")
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/dashboard/strava?error=no_code", process.env.NEXTAUTH_URL || "http://localhost:3000")
    );
  }

  try {
    const tokenResponse = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      return NextResponse.redirect(
        new URL("/dashboard/strava?error=token_exchange_failed", process.env.NEXTAUTH_URL || "http://localhost:3000")
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_at, athlete } = tokenData;

    updateUser(userEmail, {
      stravaAccessToken: access_token,
      stravaRefreshToken: refresh_token,
      stravaTokenExpiry: new Date(expires_at * 1000).toISOString(),
      stravaAthleteId: athlete?.id,
      stravaId: String(athlete?.id || ""),
    });

    const response = NextResponse.redirect(
      new URL("/dashboard/strava?connected=true", process.env.NEXTAUTH_URL || "http://localhost:3000")
    );

    // Delete the state cookie after successful validation
    response.cookies.set("strava_oauth_state", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch {
    return NextResponse.redirect(
      new URL("/dashboard/strava?error=connection_failed", process.env.NEXTAUTH_URL || "http://localhost:3000")
    );
  }
}
