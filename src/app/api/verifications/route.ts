import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readDB, getUser, Challenge, Verification } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = getUser(session.user.email);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const verifications = readDB<Verification>("verifications");
  const challenges = readDB<Challenge>("challenges");

  const userVerifications = verifications
    .filter((v) => v.userId === user.id)
    .map((v) => {
      const challenge = challenges.find((c) => c.id === v.challengeId);
      return {
        ...v,
        challengeTitle: challenge?.title || "Unknown Challenge",
      };
    });

  return NextResponse.json(userVerifications);
}
