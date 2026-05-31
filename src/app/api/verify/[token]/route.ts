import { NextRequest, NextResponse } from "next/server";
import { readDB, Verification, Challenge, User } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const verifications = readDB<Verification>("verifications");
  const verification = verifications.find((v) => v.token === token);

  if (!verification || verification.status !== "verified") {
    return NextResponse.json({ valid: false }, { status: 404 });
  }

  const challenges = readDB<Challenge>("challenges");
  const challenge = challenges.find((c) => c.id === verification.challengeId);

  const users = readDB<User>("users");
  const user = users.find((u) => u.id === verification.userId);

  return NextResponse.json({
    valid: true,
    userName: user?.name || "Unknown User",
    challengeTitle: challenge?.title || "Unknown Challenge",
    distanceAchieved: verification.distanceAchieved,
    completedAt: verification.completedAt,
  });
}
