import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readDB, getUser, updateUser, Challenge } from "@/lib/db";

interface StravaActivity {
  id: number;
  name: string;
  type: string;
  distance: number;
  moving_time: number;
  start_date: string;
}

async function fetchStravaActivities(
  accessToken: string
): Promise<StravaActivity[] | null> {
  try {
    const response = await fetch(
      "https://www.strava.com/api/v3/athlete/activities?per_page=100",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function getValidAccessToken(email: string): Promise<string | null> {
  const user = getUser(email);
  if (!user || !user.stravaAccessToken) return null;

  if (user.stravaTokenExpiry && new Date(user.stravaTokenExpiry) < new Date()) {
    if (!user.stravaRefreshToken) return null;

    try {
      const response = await fetch("https://www.strava.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: process.env.STRAVA_CLIENT_ID,
          client_secret: process.env.STRAVA_CLIENT_SECRET,
          grant_type: "refresh_token",
          refresh_token: user.stravaRefreshToken,
        }),
      });

      if (!response.ok) return null;
      const data = await response.json();

      updateUser(email, {
        stravaAccessToken: data.access_token,
        stravaRefreshToken: data.refresh_token,
        stravaTokenExpiry: new Date(data.expires_at * 1000).toISOString(),
      });

      return data.access_token;
    } catch {
      return null;
    }
  }

  return user.stravaAccessToken;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const challenges = readDB<Challenge>("challenges");
  const challenge = challenges.find((c) => c.id === id);

  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }

  const accessToken = await getValidAccessToken(session.user.email);
  if (!accessToken) {
    return NextResponse.json({
      totalDistance: 0,
      targetDistance: challenge.targetDistance,
      percentage: 0,
      isComplete: false,
      error: "Connect Strava first",
    });
  }

  const activities = await fetchStravaActivities(accessToken);
  if (!activities) {
    return NextResponse.json({
      totalDistance: 0,
      targetDistance: challenge.targetDistance,
      percentage: 0,
      isComplete: false,
      error: "Failed to fetch activities",
    });
  }

  const startDate = new Date(challenge.startDate);
  const endDate = new Date(challenge.endDate);

  const filtered = activities.filter((activity) => {
    const activityDate = new Date(activity.start_date);
    const dateInRange = activityDate >= startDate && activityDate <= endDate;

    if (!dateInRange) return false;

    if (challenge.activityType === "Any") return true;
    return activity.type === challenge.activityType;
  });

  const totalDistance =
    Math.round(
      filtered.reduce((sum, a) => sum + a.distance / 1000, 0) * 100
    ) / 100;

  const percentage = Math.min(
    Math.round((totalDistance / challenge.targetDistance) * 100),
    100
  );

  return NextResponse.json({
    totalDistance,
    targetDistance: challenge.targetDistance,
    percentage,
    isComplete: totalDistance >= challenge.targetDistance,
  });
}
