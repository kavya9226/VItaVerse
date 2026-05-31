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

  const params = new URLSearchParams({
    client_id: clientId || "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "read,activity:read_all",
    approval_prompt: "auto",
  });

  const stravaAuthUrl = `https://www.strava.com/oauth/authorize?${params.toString()}`;

  return NextResponse.redirect(stravaAuthUrl);
}
