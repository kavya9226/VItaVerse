import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readDB, writeDB, Challenge } from "@/lib/db";

export async function GET() {
  const challenges = readDB<Challenge>("challenges");
  return NextResponse.json(challenges);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, targetDistance, activityType, startDate, endDate } = body;

    if (!title || !description || !targetDistance || !activityType || !startDate || !endDate) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (targetDistance <= 0) {
      return NextResponse.json({ error: "Target distance must be greater than 0" }, { status: 400 });
    }

    if (new Date(endDate) <= new Date(startDate)) {
      return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
    }

    const challenges = readDB<Challenge>("challenges");

    const newChallenge: Challenge = {
      id: crypto.randomUUID(),
      title,
      description,
      targetDistance: Number(targetDistance),
      activityType,
      startDate,
      endDate,
      createdBy: session.user.email,
      createdAt: new Date().toISOString(),
    };

    challenges.push(newChallenge);
    writeDB("challenges", challenges);

    return NextResponse.json(newChallenge, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
