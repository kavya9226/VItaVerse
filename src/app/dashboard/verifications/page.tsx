"use client";

import { useEffect, useState } from "react";

interface VerificationWithTitle {
  id: string;
  userId: string;
  challengeId: string;
  token: string;
  status: string;
  distanceAchieved?: number;
  completedAt?: string;
  createdAt: string;
  challengeTitle: string;
}

export default function VerificationsPage() {
  const [verifications, setVerifications] = useState<VerificationWithTitle[]>(
    []
  );
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVerifications() {
      try {
        const res = await fetch("/api/verifications");
        if (res.ok) {
          const data = await res.json();
          setVerifications(data);

          // Generate QR codes client-side
          const QRCode = (await import("qrcode")).default;
          const qrMap: Record<string, string> = {};
          for (const v of data) {
            const url = `${window.location.origin}/verify/${v.token}`;
            try {
              qrMap[v.id] = await QRCode.toDataURL(url, {
                width: 200,
                margin: 2,
                color: { dark: "#000000", light: "#ffffff" },
              });
            } catch {
              // skip failed QR generation
            }
          }
          setQrCodes(qrMap);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchVerifications();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading verifications...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          My Verifications
        </h1>
        <p className="mt-1 text-gray-600">
          QR codes for your completed challenges
        </p>
      </div>

      {verifications.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg
              className="h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z"
              />
            </svg>
          </div>
          <p className="text-gray-600">
            Complete a challenge to earn your first verification QR code!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {verifications.map((v) => (
            <div
              key={v.id}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {v.challengeTitle}
                </h3>
                {v.completedAt && (
                  <p className="text-sm text-gray-500 mb-1">
                    Completed:{" "}
                    {new Date(v.completedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                )}
                {v.distanceAchieved && (
                  <p className="text-sm text-gray-500 mb-4">
                    Distance: {v.distanceAchieved} km
                  </p>
                )}

                {qrCodes[v.id] ? (
                  <div className="flex flex-col items-center">
                    <img
                      src={qrCodes[v.id]}
                      alt={`QR code for ${v.challengeTitle}`}
                      className="mx-auto rounded-lg"
                      width={200}
                      height={200}
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Scan to verify
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48">
                    <p className="text-gray-400 text-sm">
                      Generating QR code...
                    </p>
                  </div>
                )}

                <div className="mt-3">
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    Verified
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
