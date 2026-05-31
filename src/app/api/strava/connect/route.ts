import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/db";

export async function POST(request: NextRequest) {
  // Read email from request body (sent by the authenticated client).
  // The dashboard layout already guards access, and we validate the email
  // exists in our database before proceeding.
  let email: string | undefined;
  try {
    const body = await request.json();
    email = body.email;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!email || !getUser(email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  // Surface a clear error if the Strava credentials are not configured.
  // The most common cause is a missing .env.local or the dev server not
  // being restarted after the env file was created/edited.
  if (!clientId || !clientSecret) {
    return NextResponse.json(
      {
        error:
          "Strava is not configured. Set STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET in .env.local and restart the dev server.",
      },
      { status: 500 }
    );
  }

  const redirectUri = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/strava/callback`;

  const csrf = crypto.randomUUID();

  const state = Buffer.from(
    JSON.stringify({ csrf, email })
  ).toString("base64url");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "read,activity:read_all",
    approval_prompt: "auto",
    state,
  });

  const stravaAuthUrl = `https://www.strava.com/oauth/authorize?${params.toString()}`;

  const response = NextResponse.json({ url: stravaAuthUrl });
  response.cookies.set("strava_oauth_state", csrf, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  return response;
}
