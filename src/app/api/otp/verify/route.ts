import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getUser, updateUser } from "@/lib/db";

const MAX_OTP_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = token.email as string;
    const { phone, otp } = await request.json();

    if (!phone || !otp) {
      return NextResponse.json(
        { error: "Phone and OTP are required" },
        { status: 400 }
      );
    }

    const user = getUser(email);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.otp || !user.otpExpiry) {
      return NextResponse.json(
        { error: "No OTP requested. Please request a new code." },
        { status: 400 }
      );
    }

    if (new Date() > new Date(user.otpExpiry)) {
      updateUser(email, {
        otp: undefined,
        otpExpiry: undefined,
        otpPhone: undefined,
        otpAttempts: undefined,
      });
      return NextResponse.json(
        { error: "OTP has expired. Please request a new code." },
        { status: 400 }
      );
    }

    // Check brute-force attempts
    const attempts = user.otpAttempts || 0;
    if (attempts >= MAX_OTP_ATTEMPTS) {
      updateUser(email, {
        otp: undefined,
        otpExpiry: undefined,
        otpPhone: undefined,
        otpAttempts: undefined,
      });
      return NextResponse.json(
        { error: "Too many attempts, request a new code" },
        { status: 429 }
      );
    }

    // Check phone number matches what was sent
    if (user.otpPhone && user.otpPhone !== phone) {
      return NextResponse.json(
        { error: "Phone number does not match the one the code was sent to" },
        { status: 400 }
      );
    }

    if (user.otp !== otp) {
      updateUser(email, {
        otpAttempts: attempts + 1,
      });
      return NextResponse.json({ error: "Invalid OTP code" }, { status: 400 });
    }

    updateUser(email, {
      phone,
      phoneVerified: true,
      otp: undefined,
      otpExpiry: undefined,
      otpPhone: undefined,
      otpAttempts: undefined,
    });

    return NextResponse.json({ message: "Phone verified" }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
