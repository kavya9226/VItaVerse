import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <header className="flex-1 flex flex-col items-center justify-center px-4 py-20 bg-gradient-to-br from-primary/5 via-white to-secondary/5">
        <h1 className="text-5xl font-bold text-gray-900 mb-4 text-center">
          Vita<span className="text-primary">Verse</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-lg text-center mb-8">
          Verify fitness challenges with Strava data, phone verification, and QR
          codes. Set goals, prove completion, earn verification.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/login"
            className="rounded-md bg-primary px-8 py-3 text-white font-medium hover:bg-primary-dark transition-colors text-center"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="rounded-md border-2 border-primary px-8 py-3 text-primary font-medium hover:bg-primary/5 transition-colors text-center"
          >
            Sign Up
          </Link>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-12">
            How It Works
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center p-6">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary/10">
                <svg
                  className="h-7 w-7 text-secondary"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.868-3.868l4.5-4.5a4.5 4.5 0 016.364 6.364l-1.757 1.757"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">
                Strava Integration
              </h3>
              <p className="text-sm text-gray-500">
                Connect your Strava account to automatically track running,
                cycling, and other fitness activities.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <svg
                  className="h-7 w-7 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">
                Challenge Tracking
              </h3>
              <p className="text-sm text-gray-500">
                Set distance goals like 10km or 15km. Track your progress and
                complete challenges to earn verification.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                <svg
                  className="h-7 w-7 text-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">
                QR Verification
              </h3>
              <p className="text-sm text-gray-500">
                Completed challenges generate a QR code. Scan it to verify -
                green means verified, instant proof of achievement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-gray-100 bg-gray-50 text-center">
        <p className="text-sm text-gray-400">
          VitaVerse - Fitness Challenge Verification Platform
        </p>
      </footer>
    </div>
  );
}
