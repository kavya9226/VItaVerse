import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { readDB, writeDB, getUser, Challenge, Verification } from "@/lib/db";
import { getValidAccessToken } from "@/lib/strava";

interface StravaActivity {
  id: number;
  name: string;
  type: string;
  distance: number;
  moving_time: number;
  start_date: string;
}

export async function POST(
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

  const user = getUser(email);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check if already verified
  const verifications = readDB<Verification>("verifications");
  const existing = verifications.find(
    (v) => v.userId === user.id && v.challengeId === id && v.status === "verified"
  );
  if (existing) {
    return NextResponse.json({
      verification: existing,
      message: "Already verified!",
    });
  }

  const accessToken = await getValidAccessToken(email);
  if (!accessToken) {
    return NextResponse.json(
      { error: "Connect Strava first to verify challenge" },
      { status: 400 }
    );
  }

  // Fetch activities
  let activities: StravaActivity[] = [];
  try {
    const response = await fetch(
      "https://www.strava.com/api/v3/athlete/activities?per_page=100",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (response.ok) {
      activities = await response.json();
    }
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch Strava activities" },
      { status: 500 }
    );
  }

  // Filter activities
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

  if (totalDistance < challenge.targetDistance) {
    return NextResponse.json(
      { error: "Challenge not yet completed", totalDistance, targetDistance: challenge.targetDistance },
      { status: 400 }
    );
  }

  // Create verification
  const verification: Verification = {
    id: crypto.randomUUID(),
    userId: user.id,
    challengeId: id,
    token: crypto.randomUUID(),
    status: "verified",
    distanceAchieved: totalDistance,
    completedAt: new Date().toISOString(),
    verifiedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  verifications.push(verification);
  writeDB("verifications", verifications);

  return NextResponse.json({
    verification,
    message: "Challenge verified!",
  });
}
