import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL || "http://localhost:3000"));
  }

  const clientId = process.env.STRAVA_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/strava/callback`;

  const csrf = crypto.randomUUID();

  // Encode both the CSRF token and user email into the state parameter.
  // This allows the callback to identify the user even if the session cookie
  // is not available after the cross-origin redirect from Strava.
  const state = Buffer.from(
    JSON.stringify({ csrf, email: session.user.email })
  ).toString("base64url");

  const params = new URLSearchParams({
    client_id: clientId || "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "read,activity:read_all",
    approval_prompt: "auto",
    state,
  });

  const stravaAuthUrl = `https://www.strava.com/oauth/authorize?${params.toString()}`;

  const response = NextResponse.redirect(stravaAuthUrl);
  response.cookies.set("strava_oauth_state", csrf, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  return response;
}
