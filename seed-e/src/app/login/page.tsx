"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [step, setStep] = useState<"login" | "2fa-setup" | "2fa-verify">(
    "login"
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<"provider" | "client">("provider");
  const [qrCodeDataURL, setQrCodeDataURL] = useState("");
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
          userType,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.needs2FASetup) {
          // Generate 2FA setup
          await generate2FASetup();
        } else if (data.needs2FAVerification) {
          setStep("2fa-verify");
        } else {
          // Login successful, redirect to appropriate dashboard
          router.push(
            userType === "provider" ? "/provider-dashboard" : "/dashboard"
          );
        }
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const generate2FASetup = async () => {
    try {
      const response = await fetch("/api/auth/2fa/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          userType,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setQrCodeDataURL(data.qrCodeDataURL);
        setStep("2fa-setup");
      } else {
        setError(data.error || "Failed to generate 2FA setup");
      }
    } catch {
      setError("Network error. Please try again.");
    }
  };

  const handle2FAVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          userType,
          token: twoFactorToken,
        }),
      });

      const data = await response.json();

      if (response.ok && data.verified) {
        // 2FA verified, redirect to appropriate dashboard
        router.push(
          userType === "provider" ? "/provider-dashboard" : "/dashboard"
        );
      } else {
        setError("Invalid 2FA token");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          userType,
          token: twoFactorToken,
        }),
      });

      const data = await response.json();

      if (response.ok && data.verified) {
        // 2FA setup successful, redirect to appropriate dashboard
        router.push(
          userType === "provider" ? "/provider-dashboard" : "/dashboard"
        );
      } else {
        setError("Invalid 2FA token");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Seed-E
          </h2>
        </div>

        {step === "login" && (
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  User Type
                </label>
                <select
                  value={userType}
                  onChange={(e) =>
                    setUserType(e.target.value as "provider" | "client")
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="provider">Provider</option>
                  <option value="client">Client</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        )}

        {step === "2fa-setup" && (
          <div className="mt-8 space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Set up Two-Factor Authentication
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Scan this QR code with your authenticator app:
              </p>
              {qrCodeDataURL && (
                <img
                  src={qrCodeDataURL}
                  alt="2FA QR Code"
                  className="mx-auto mb-4"
                />
              )}
            </div>

            <form onSubmit={handle2FASetup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Enter the 6-digit code from your authenticator app
                </label>
                <input
                  type="text"
                  value={twoFactorToken}
                  onChange={(e) => setTwoFactorToken(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? "Verifying..." : "Verify and Complete Setup"}
              </button>
            </form>
          </div>
        )}

        {step === "2fa-verify" && (
          <div className="mt-8 space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Two-Factor Authentication
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Enter the 6-digit code from your authenticator app:
              </p>
            </div>

            <form onSubmit={handle2FAVerification} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={twoFactorToken}
                  onChange={(e) => setTwoFactorToken(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? "Verifying..." : "Verify"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
