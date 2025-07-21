"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Button from "@/components/Button";

export default function Setup2FAPage() {
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Generate 2FA setup
    generate2FASetup();
  }, []);

  const generate2FASetup = async () => {
    try {
      // Get username from localStorage
      const username = localStorage.getItem("username") || "testuser";

      const response = await fetch("/api/auth/2fa/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setQrCode(data.qrCodeDataURL);
        setSecret(data.secret);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to generate 2FA setup");
      }
    } catch (error) {
      console.error("2FA setup error:", error);
      setError("Network error. Please try again.");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const username = localStorage.getItem("username") || "testuser";
      const userType = localStorage.getItem("userType") || "client";

      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          userType: userType,
          token: verificationCode,
          secret: secret, // Pass the secret for proper validation
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.verified) {
          // Go directly to master key generation
          router.push("/generate-recovery-key");
        } else {
          setError("Invalid verification code. Please try again.");
        }
      } else {
        const data = await response.json();
        setError(data.error || "Invalid verification code");
      }
    } catch (error) {
      console.error("2FA verification error:", error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
                <Image src={qrCode} alt="QR Code" width={192} height={192} />
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

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={loading || !verificationCode}
          >
            Verify & Complete Setup
          </Button>
        </form>
      </div>
    </div>
  );
}
