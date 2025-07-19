"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Setup2FAPage() {
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Generate 2FA setup
    generate2FASetup();
  }, []);

  const generate2FASetup = async () => {
    try {
      const response = await fetch("/api/auth/setup-2fa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setQrCode(data.qrCode);
        setSecret(data.secret);
      } else {
        setError("Failed to generate 2FA setup");
      }
    } catch {
      setError("Network error. Please try again.");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify-2fa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret,
          code: verificationCode,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/generate-recovery-key");
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.error || "Invalid verification code");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900">
              <svg
                className="h-6 w-6 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              2FA Setup Complete!
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Redirecting to dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Set Up Two-Factor Authentication
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
            Scan the QR code with your authenticator app
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm dark:shadow-none">
          {qrCode ? (
            <div className="text-center space-y-4">
              <div className="bg-white p-4 rounded-lg inline-block">
                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <p className="mb-2">Or manually enter this secret:</p>
                <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs break-all text-gray-900 dark:text-white">
                  {secret}
                </code>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF9500] mx-auto"></div>
              <p className="mt-2">Generating QR code...</p>
            </div>
          )}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleVerify}>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Verification Code
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#FF9500] focus:border-[#FF9500] transition-colors"
              placeholder="Enter 6-digit code"
              required
              maxLength={6}
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <div className="text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !verificationCode}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-bold rounded-md text-black bg-[#FF9500] hover:bg-[#FF9500]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF9500] disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <div className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-black"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Verifying...
              </div>
            ) : (
              "Verify & Complete Setup"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
