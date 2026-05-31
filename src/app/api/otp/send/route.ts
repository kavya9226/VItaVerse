import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getUser, updateUser } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = token.email as string;
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    const user = getUser(email);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    updateUser(email, {
      otp,
      otpExpiry,
      otpPhone: phone,
      otpAttempts: 0,
    });

    console.log(`[OTP] Code for ${phone}: ${otp}`);

    return NextResponse.json({ message: "OTP sent" }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
