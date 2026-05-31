"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Challenge {
  id: string;
  title: string;
  description: string;
  targetDistance: number;
  activityType: string;
  startDate: string;
  endDate: string;
}

interface Progress {
  totalDistance: number;
  targetDistance: number;
  percentage: number;
  isComplete: boolean;
  error?: string;
}

function getActivityEmoji(type: string): string {
  switch (type) {
    case "Run":
      return "\u{1F3C3}";
    case "Ride":
      return "\u{1F6B4}";
    case "Walk":
      return "\u{1F6B6}";
    case "Any":
      return "\u{1F3CB}\uFE0F";
    default:
      return "\u{1F3CB}\uFE0F";
  }
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/challenges");
        if (res.ok) {
          const data = await res.json();
          setChallenges(data);

          // Fetch progress for each challenge
          const progressMap: Record<string, Progress> = {};
          await Promise.all(
            data.map(async (challenge: Challenge) => {
              try {
                const pRes = await fetch(
                  `/api/challenges/${challenge.id}/progress`
                );
                if (pRes.ok) {
                  progressMap[challenge.id] = await pRes.json();
                }
              } catch {
                progressMap[challenge.id] = {
                  totalDistance: 0,
                  targetDistance: challenge.targetDistance,
                  percentage: 0,
                  isComplete: false,
                };
              }
            })
          );
          setProgress(progressMap);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function handleVerify(challengeId: string) {
    setVerifying(challengeId);
    try {
      const res = await fetch(`/api/challenges/${challengeId}/verify`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Challenge verified!");
      } else {
        alert(data.error || "Verification failed");
      }
    } catch {
      alert("Failed to verify challenge");
    } finally {
      setVerifying(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading challenges...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Fitness Challenges
          </h1>
          <p className="mt-1 text-gray-600">
            Complete challenges to earn verification QR codes
          </p>
        </div>
        <Link
          href="/dashboard/challenges/create"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
        >
          Create Challenge
        </Link>
      </div>

      {challenges.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-gray-500 mb-4">No challenges yet.</p>
          <Link
            href="/dashboard/challenges/create"
            className="text-primary font-medium hover:underline"
          >
            Create your first challenge
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {challenges.map((challenge) => {
            const p = progress[challenge.id];
            return (
              <div
                key={challenge.id}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {challenge.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {challenge.description}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-sm">
                    {getActivityEmoji(challenge.activityType)}{" "}
                    {challenge.activityType}
                  </span>
                </div>

                {p && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">
                        {p.totalDistance} km / {p.targetDistance} km
                      </span>
                      <span className="font-medium text-gray-900">
                        {p.percentage}%
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          p.isComplete ? "bg-green-500" : "bg-primary"
                        }`}
                        style={{ width: `${p.percentage}%` }}
                      />
                    </div>
                    {p.error && (
                      <p className="text-xs text-amber-600 mt-1">{p.error}</p>
                    )}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {new Date(challenge.startDate).toLocaleDateString()} -{" "}
                    {new Date(challenge.endDate).toLocaleDateString()}
                  </span>
                  {p?.isComplete ? (
                    <button
                      onClick={() => handleVerify(challenge.id)}
                      disabled={verifying === challenge.id}
                      className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {verifying === challenge.id
                        ? "Verifying..."
                        : "Claim Verification"}
                    </button>
                  ) : (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        p?.isComplete
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {p?.isComplete ? "Completed!" : "In Progress"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
