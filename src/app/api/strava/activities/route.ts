import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUser } from "@/lib/db";
import { getValidAccessToken } from "@/lib/strava";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = getUser(session.user.email);
  if (!user || !user.stravaAccessToken) {
    return NextResponse.json({ error: "Strava not connected" }, { status: 401 });
  }

  const accessToken = await getValidAccessToken(session.user.email);
  if (!accessToken) {
    return NextResponse.json({ error: "Failed to refresh Strava token" }, { status: 401 });
  }

  try {
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
    const response = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?per_page=200&after=${thirtyDaysAgo}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

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
