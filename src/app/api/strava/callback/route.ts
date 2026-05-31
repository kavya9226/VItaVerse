import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updateUser } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL || "http://localhost:3000"));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  // Validate state parameter for CSRF protection
  const storedState = request.cookies.get("strava_oauth_state")?.value;
  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(
      new URL("/dashboard/strava?error=invalid_state", process.env.NEXTAUTH_URL || "http://localhost:3000")
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

    updateUser(session.user.email, {
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
