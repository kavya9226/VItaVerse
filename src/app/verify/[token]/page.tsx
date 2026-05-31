"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface VerificationResult {
  valid: boolean;
  userName?: string;
  challengeTitle?: string;
  distanceAchieved?: number;
  completedAt?: string;
}

export default function VerifyTokenPage() {
  const params = useParams();
  const token = params.token as string;
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVerification() {
      try {
        const res = await fetch(`/api/verify/${token}`);
        if (res.ok) {
          const data = await res.json();
          setResult(data);
        } else {
          setResult({ valid: false });
        }
      } catch {
        setResult({ valid: false });
      } finally {
        setLoading(false);
      }
    }
    if (token) {
      fetchVerification();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-100">
        <div className="text-gray-500 text-xl">Verifying...</div>
      </div>
    );
  }

  if (!result || !result.valid) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-red-500 text-white p-8">
        <div className="animate-pulse mb-6">
          <svg
            className="h-32 w-32"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h1 className="text-5xl font-bold mb-4">INVALID</h1>
        <p className="text-xl text-red-100 text-center">
          This verification is invalid or has expired
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-emerald-500 text-white p-8">
      <div className="animate-pulse mb-6">
        <svg
          className="h-32 w-32"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 12.75l6 6 9-13.5"
          />
        </svg>
      </div>
      <h1 className="text-5xl font-bold mb-6">VERIFIED</h1>
      <div className="text-center space-y-2">
        {result.userName && (
          <p className="text-xl text-emerald-100">
            <span className="font-semibold text-white">{result.userName}</span>
          </p>
        )}
        {result.challengeTitle && (
          <p className="text-lg text-emerald-100">
            Challenge: <span className="font-medium text-white">{result.challengeTitle}</span>
          </p>
        )}
        {result.distanceAchieved && (
          <p className="text-lg text-emerald-100">
            Distance: <span className="font-medium text-white">{result.distanceAchieved} km</span>
          </p>
        )}
        {result.completedAt && (
          <p className="text-lg text-emerald-100">
            Completed:{" "}
            <span className="font-medium text-white">
              {new Date(result.completedAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
