import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUser, updateUser } from "@/lib/db";

async function refreshStravaToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_at: number;
} | null> {
  try {
    const response = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = getUser(session.user.email);
  if (!user || !user.stravaAccessToken) {
    return NextResponse.json({ error: "Strava not connected" }, { status: 401 });
  }

  let accessToken = user.stravaAccessToken;

  // Check if token is expired
  if (user.stravaTokenExpiry && new Date(user.stravaTokenExpiry) < new Date()) {
    if (!user.stravaRefreshToken) {
      return NextResponse.json({ error: "Strava token expired, no refresh token" }, { status: 401 });
    }

    const refreshed = await refreshStravaToken(user.stravaRefreshToken);
    if (!refreshed) {
      return NextResponse.json({ error: "Failed to refresh Strava token" }, { status: 401 });
    }

    accessToken = refreshed.access_token;
    updateUser(session.user.email, {
      stravaAccessToken: refreshed.access_token,
      stravaRefreshToken: refreshed.refresh_token,
      stravaTokenExpiry: new Date(refreshed.expires_at * 1000).toISOString(),
    });
  }

  try {
    const response = await fetch("https://www.strava.com/api/v3/athlete/activities?per_page=30", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
    }

    interface StravaActivity {
      id: number;
      name: string;
      type: string;
      distance: number;
      moving_time: number;
      start_date: string;
    }

    const activities: StravaActivity[] = await response.json();

    const mapped = activities.map((activity) => ({
      id: activity.id,
      name: activity.name,
      type: activity.type,
      distance: Math.round((activity.distance / 1000) * 100) / 100,
      duration: Math.round(activity.moving_time / 60),
      date: activity.start_date,
    }));

    return NextResponse.json(mapped);
  } catch {
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}
