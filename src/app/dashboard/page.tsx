"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session } = useSession();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
              {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">
                {session?.user?.name}
              </h3>
              <p className="text-sm text-gray-500">{session?.user?.email}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">Profile</p>
        </div>

        {/* Phone Verification Card */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Phone Verification</h3>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-orange-600 text-xs">
              !
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Verify your phone number to participate in challenges.
          </p>
          <Link
            href="/dashboard/phone"
            className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
          >
            Verify Phone
          </Link>
        </div>

        {/* Strava Connection Card */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Strava Connection</h3>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-orange-600 text-xs">
              !
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Connect your Strava account to track activities.
          </p>
          <Link
            href="/dashboard/strava"
            className="inline-block rounded-md bg-secondary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            Connect Strava
          </Link>
        </div>

        {/* Active Challenges Card */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Active Challenges</h3>
          </div>
          <p className="text-3xl font-bold text-primary mb-1">0</p>
          <p className="text-sm text-gray-500 mb-4">challenges in progress</p>
          <Link
            href="/dashboard/challenges"
            className="text-sm font-medium text-primary hover:text-primary-dark"
          >
            View Challenges &rarr;
          </Link>
        </div>

        {/* Verifications Card */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Verifications</h3>
          </div>
          <p className="text-3xl font-bold text-accent mb-1">0</p>
          <p className="text-sm text-gray-500 mb-4">QR codes earned</p>
          <Link
            href="/dashboard/verifications"
            className="text-sm font-medium text-accent hover:opacity-80"
          >
            View Verifications &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
