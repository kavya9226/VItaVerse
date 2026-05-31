import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getUser, updateUser } from "@/lib/db";

const MAX_OTP_ATTEMPTS = 5;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phone, otp } = await request.json();

    if (!phone || !otp) {
      return NextResponse.json(
        { error: "Phone and OTP are required" },
        { status: 400 }
      );
    }

    const user = getUser(session.user.email);
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
      updateUser(session.user.email, {
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
      updateUser(session.user.email, {
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
      updateUser(session.user.email, {
        otpAttempts: attempts + 1,
      });
      return NextResponse.json({ error: "Invalid OTP code" }, { status: 400 });
    }

    updateUser(session.user.email, {
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
