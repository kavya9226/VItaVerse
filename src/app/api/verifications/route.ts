import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { readDB, getUser, Challenge, Verification } from "@/lib/db";

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = token.email as string;
  const user = getUser(email);
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
