import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { readDB, Challenge } from "@/lib/db";
import { getValidAccessToken } from "@/lib/strava";

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = token.email as string;
  const { id } = await params;
  const challenges = readDB<Challenge>("challenges");
  const challenge = challenges.find((c) => c.id === id);

  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }

  const accessToken = await getValidAccessToken(email);
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
