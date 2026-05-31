"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link
                href="/dashboard"
                className="text-xl font-bold text-primary"
              >
                VitaVerse
              </Link>
              <div className="hidden md:flex items-center gap-6">
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-gray-700 hover:text-primary transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/challenges"
                  className="text-sm font-medium text-gray-700 hover:text-primary transition-colors"
                >
                  Challenges
                </Link>
                <Link
                  href="/dashboard/strava"
                  className="text-sm font-medium text-gray-700 hover:text-primary transition-colors"
                >
                  Strava
                </Link>
                <Link
                  href="/dashboard/verifications"
                  className="text-sm font-medium text-gray-700 hover:text-primary transition-colors"
                >
                  Verifications
                </Link>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {session.user?.name}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Sign Out
              </button>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 px-4 py-3 space-y-2">
            <Link
              href="/dashboard"
              className="block text-sm font-medium text-gray-700 py-1"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/challenges"
              className="block text-sm font-medium text-gray-700 py-1"
            >
              Challenges
            </Link>
            <Link
              href="/dashboard/strava"
              className="block text-sm font-medium text-gray-700 py-1"
            >
              Strava
            </Link>
            <Link
              href="/dashboard/verifications"
              className="block text-sm font-medium text-gray-700 py-1"
            >
              Verifications
            </Link>
            <div className="border-t border-gray-200 pt-2 mt-2">
              <p className="text-sm text-gray-600">{session.user?.name}</p>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="mt-1 text-sm font-medium text-red-600"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
