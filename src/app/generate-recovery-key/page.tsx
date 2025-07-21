"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import DownloadBackup from "@/components/DownloadBackup";

export default function GenerateRecoveryKeyPage() {
  const [recoveryKey, setRecoveryKey] = useState("");
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Generate recovery key
    generateRecoveryKey();
  }, []);

  const generateRecoveryKey = async () => {
    try {
      const response = await fetch("/api/auth/generate-recovery-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecoveryKey(data.recoveryKey);
      } else {
        setError("Failed to generate recovery key");
      }
    } catch {
      setError("Network error. Please try again.");
    }
  };

  const handleContinue = async () => {
    if (!hasConfirmed) {
      setError("You must confirm that you have saved the recovery key");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const username = localStorage.getItem("username");
      const userType = localStorage.getItem("userType");

      const response = await fetch("/api/auth/confirm-recovery-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recoveryKey,
          username,
          userType,
        }),
      });

      if (response.ok) {
        localStorage.setItem("recoveryKey", recoveryKey);

        const userType = localStorage.getItem("userType");
        if (userType === "client") {
          router.push("/client-dashboard");
        } else {
          router.push("/provider-dashboard");
        }
      } else {
        const data = await response.json();
        setError(data.error || "Failed to confirm recovery key");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(recoveryKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 500);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Secure Your Master Key
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
            This will be the only way to reset your 2FA or password
          </p>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300 font-medium">
            You are responsible, there is no support.
          </p>
          <p className="mt-1 text-center text-sm text-gray-600 dark:text-gray-300 font-medium">
            If you can not secure this key, you should not be providing a backup
            key service.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm dark:shadow-none">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Master Recovery Key
              </label>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md border border-gray-200 dark:border-gray-600">
                <code className="text-gray-900 dark:text-white text-sm break-all font-mono">
                  {recoveryKey || "Generating..."}
                </code>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <button
                  onClick={(e) => copyToClipboard(e)}
                  disabled={!recoveryKey}
                  className="text-sm text-[#FF9500] hover:text-[#FF9500]/80 disabled:text-gray-400 dark:disabled:text-gray-500 flex items-center gap-2 relative z-10"
                >
                  {copied ? (
                    <>
                      <svg
                        className="w-4 h-4 text-green-500"
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
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Copy to clipboard
                    </>
                  )}
                </button>
                <DownloadBackup
                  recoveryKey={recoveryKey}
                  className="text-sm text-[#FF9500] hover:text-[#FF9500]/80 disabled:text-gray-400 dark:disabled:text-gray-500 flex items-center gap-2 relative z-10"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download Backup
                </DownloadBackup>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Important:</strong> Save this recovery key securely.
                    You will not be able to see it again, and it&apos;s the only
                    way to recover your account if you lose access to your 2FA
                    device.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="confirm-save"
                type="checkbox"
                checked={hasConfirmed}
                onChange={(e) => setHasConfirmed(e.target.checked)}
                className="h-4 w-4 text-[#FF9500] focus:ring-[#FF9500] border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
              />
              <label
                htmlFor="confirm-save"
                className="ml-2 text-sm text-gray-700 dark:text-gray-300"
              >
                I have securely saved my recovery key
              </label>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          </div>
        )}

        <Button
          onClick={handleContinue}
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={loading || !hasConfirmed || !recoveryKey}
        >
          Continue to Dashboard
        </Button>
      </div>
    </div>
  );
}
