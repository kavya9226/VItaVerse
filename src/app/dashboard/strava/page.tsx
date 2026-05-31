"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface Activity {
  id: number;
  name: string;
  type: string;
  distance: number;
  duration: number;
  date: string;
}

function getActivityEmoji(type: string): string {
  switch (type) {
    case "Run":
      return "\u{1F3C3}";
    case "Ride":
      return "\u{1F6B4}";
    case "Walk":
      return "\u{1F6B6}";
    case "Swim":
      return "\u{1F3CA}";
    case "Hike":
      return "\u26F0\uFE0F";
    default:
      return "\u{1F3CB}\uFE0F";
  }
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTotalDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

function formatTotalDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return `${hours}h ${mins}m`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}d ${remainingHours}h ${mins}m`;
}

function getActivityBreakdown(activities: Activity[]): string {
  const counts: Record<string, number> = {};
  for (const a of activities) {
    counts[a.type] = (counts[a.type] || 0) + 1;
  }
  const parts = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => `${count} ${count === 1 ? type : type + "s"}`);
  return parts.join(", ");
}

function StravaContent() {
  const searchParams = useSearchParams();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  const justConnected = searchParams.get("connected") === "true";
  const connectionError = searchParams.get("error");

  useEffect(() => {
    async function fetchActivities() {
      try {
        const res = await fetch("/api/strava/activities");
        if (res.status === 401) {
          setConnected(false);
          setLoading(false);
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setActivities(data);
          setConnected(true);
        } else {
          const data = await res.json();
          setError(data.error || "Failed to load activities");
          setConnected(false);
        }
      } catch {
        setError("Failed to load activities");
      } finally {
        setLoading(false);
      }
    }
    fetchActivities();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading Strava data...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Strava Integration</h1>
        <p className="mt-1 text-gray-600">
          Connect your Strava account to track your fitness activities
        </p>
      </div>

      {justConnected && (
        <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
          <p className="text-green-800 font-medium">
            Successfully connected to Strava!
          </p>
        </div>
      )}

      {connectionError && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-red-800 font-medium">
            Failed to connect to Strava: {connectionError}
          </p>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {!connected ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
            <svg
              className="h-8 w-8 text-orange-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Connect to Strava
          </h2>
          <p className="text-gray-600 mb-6">
            Link your Strava account to automatically track your activities and
            progress towards challenges.
          </p>
          <button
            onClick={async () => {
              try {
                const res = await fetch("/api/strava/connect", { method: "POST" });
                if (res.ok) {
                  const data = await res.json();
                  window.location.href = data.url;
                } else {
                  setError("Failed to initiate Strava connection");
                }
              } catch {
                setError("Failed to initiate Strava connection");
              }
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-6 py-3 text-white font-medium hover:bg-orange-700 transition-colors"
          >
            Connect with Strava
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                    clipRule="evenodd"
                  />
                </svg>
                Connected to Strava
              </span>
            </div>
          </div>

          {activities.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No Data</h3>
              <p className="text-gray-500">
                No activity data found for the past 30 days. Start recording
                activities on Strava and they will appear here.
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-sm text-gray-500">Total Activities</p>
                  <p className="text-2xl font-bold text-gray-900">{activities.length}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-sm text-gray-500">Total Distance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatTotalDistance(activities.reduce((sum, a) => sum + a.distance, 0))}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-sm text-gray-500">Total Duration</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatTotalDuration(activities.reduce((sum, a) => sum + a.duration, 0))}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-sm text-gray-500">Activity Types</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {getActivityBreakdown(activities)}
                  </p>
                </div>
              </div>

              <h2 className="text-lg font-semibold text-gray-900 mb-4">Past 30 Days</h2>

              <div className="grid gap-4">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {getActivityEmoji(activity.type)}
                        </span>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {activity.name}
                          </h3>
                          <p className="text-sm text-gray-500">{activity.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {formatDate(activity.date)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-gray-500">Distance: </span>
                        <span className="font-medium text-gray-900">
                          {activity.distance} km
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Duration: </span>
                        <span className="font-medium text-gray-900">
                          {formatDuration(activity.duration)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function StravaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading...</div>
        </div>
      }
    >
      <StravaContent />
    </Suspense>
  );
}
