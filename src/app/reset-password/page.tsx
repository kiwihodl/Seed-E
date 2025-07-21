"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Button from "@/components/Button";
import DownloadBackup from "@/components/DownloadBackup";

export default function ResetPasswordPage() {
  const [step, setStep] = useState<
    "2fa-setup" | "new-password" | "new-master-key"
  >("2fa-setup");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [qrCodeDataURL, setQrCodeDataURL] = useState("");
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [newMasterKey, setNewMasterKey] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState<boolean | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<{
    hasLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  }>({
    hasLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false,
  });
  const [twoFactorSecret, setTwoFactorSecret] = useState("");
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const validatePassword = useCallback((password: string) => {
    return {
      hasLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  }, []);

  useEffect(() => {
    if (confirmPassword) {
      setPasswordMatch(newPassword === confirmPassword);
    } else {
      setPasswordMatch(null);
    }
  }, [newPassword, confirmPassword]);

  useEffect(() => {
    setPasswordStrength(validatePassword(newPassword));
  }, [newPassword, validatePassword]);

  useEffect(() => {
    const username = localStorage.getItem("username");
    const userType = localStorage.getItem("userType");
    if (!username || !userType) {
      router.push("/login");
    } else {
      generate2FASetup();
    }
  }, [router]);

  const handleNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const isPasswordStrong = Object.values(passwordStrength).every(Boolean);
    if (!isPasswordStrong) {
      setError("Password does not meet all requirements");
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      setIsLoading(false);
      return;
    }

    try {
      const username = localStorage.getItem("username");
      const userType = localStorage.getItem("userType") || "provider";

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newPassword,
          username,
          userType,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await generateNewMasterKey();
      } else {
        setError(data.error || "Failed to set new password");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const generate2FASetup = async () => {
    try {
      const username = localStorage.getItem("username");
      const userType = localStorage.getItem("userType") || "provider";

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
        setTwoFactorSecret(data.secret);
        setStep("2fa-setup");
      } else {
        setError(data.error || "Failed to generate 2FA setup");
      }
    } catch {
      setError("Network error. Please try again.");
    }
  };

  const handle2FASetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const username = localStorage.getItem("username");
      const userType = localStorage.getItem("userType") || "provider";

      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          userType,
          token: twoFactorToken,
          secret: twoFactorSecret,
        }),
      });

      const data = await response.json();

      if (response.ok && data.verified) {
        setStep("new-password");
      } else {
        setError("Invalid 2FA token");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewMasterKey = async () => {
    try {
      const username = localStorage.getItem("username");
      const userType = localStorage.getItem("userType") || "provider";

      const response = await fetch("/api/auth/generate-recovery-key", {
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
        setNewMasterKey(data.recoveryKey);
        localStorage.setItem("recoveryKey", data.recoveryKey);
        setStep("new-master-key");
      } else {
        setError(data.error || "Failed to generate new master key");
      }
    } catch {
      setError("Network error. Please try again.");
    }
  };

  const copyToClipboard = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(newMasterKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 500);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const handleComplete = async () => {
    try {
      const username = localStorage.getItem("username");
      const userType = localStorage.getItem("userType") || "provider";

      const response = await fetch("/api/auth/confirm-recovery-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recoveryKey: newMasterKey,
          username,
          userType,
        }),
      });

      if (!response.ok) {
        console.error("Failed to save recovery key to database");
      }
    } catch (error) {
      console.error("Error saving recovery key:", error);
    }

    localStorage.removeItem("newPassword");

    const userType = localStorage.getItem("userType") || "provider";
    router.push(
      userType === "provider" ? "/provider-dashboard" : "/client-dashboard"
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Reset Your Account
          </h2>
        </div>

        {step === "new-password" && (
          <form className="mt-8 space-y-6" onSubmit={handleNewPassword}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showNewPassword ? (
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>

                {newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="space-y-1">
                      {!passwordStrength.hasLength && (
                        <div className="flex items-center text-xs text-red-600 dark:text-red-400">
                          <svg
                            className="w-3 h-3 mr-1 text-red-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                          At least 8 characters
                        </div>
                      )}
                      {!passwordStrength.hasUppercase && (
                        <div className="flex items-center text-xs text-red-600 dark:text-red-400">
                          <svg
                            className="w-3 h-3 mr-1 text-red-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                          One uppercase letter
                        </div>
                      )}
                      {!passwordStrength.hasLowercase && (
                        <div className="flex items-center text-xs text-red-600 dark:text-red-400">
                          <svg
                            className="w-3 h-3 mr-1 text-red-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                          One lowercase letter
                        </div>
                      )}
                      {!passwordStrength.hasNumber && (
                        <div className="flex items-center text-xs text-red-600 dark:text-red-400">
                          <svg
                            className="w-3 h-3 mr-1 text-red-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                          One number
                        </div>
                      )}
                      {!passwordStrength.hasSpecial && (
                        <div className="flex items-center text-xs text-red-600 dark:text-red-400">
                          <svg
                            className="w-3 h-3 mr-1 text-red-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                          One special character
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>

                {confirmPassword && passwordMatch !== null && (
                  <div
                    className={`mt-2 text-xs ${
                      passwordMatch
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {passwordMatch ? (
                      <div className="flex items-center">
                        <svg
                          className="w-3 h-3 mr-1 text-green-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Passwords match
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <svg
                          className="w-3 h-3 mr-1 text-red-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Passwords do not match
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              loading={isLoading}
              disabled={
                isLoading ||
                !newPassword ||
                !confirmPassword ||
                !passwordMatch ||
                !Object.values(passwordStrength).every(Boolean)
              }
            >
              Set New Password
            </Button>
          </form>
        )}

        {step === "2fa-setup" && (
          <div className="mt-8 space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Set up Two-Factor Authentication
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Scan this QR code with your authenticator app:
              </p>
              {qrCodeDataURL && (
                <div className="flex justify-center mb-4">
                  <Image
                    src={qrCodeDataURL}
                    alt="2FA QR Code"
                    width={200}
                    height={200}
                    className="mx-auto"
                  />
                </div>
              )}
            </div>

            <form onSubmit={handle2FASetup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enter the 6-digit code from your authenticator app
                </label>
                <input
                  type="text"
                  value={twoFactorToken}
                  onChange={(e) => setTwoFactorToken(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>

              {error && (
                <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-800">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                loading={isLoading}
                disabled={isLoading}
              >
                Verify and Continue
              </Button>
            </form>
          </div>
        )}

        {step === "new-master-key" && (
          <div className="mt-8 space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Your New Master Key
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Save this master key securely. You&apos;ll need it if you forget
                your password or 2FA.
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
              <div className="text-center">
                <p className="text-sm font-mono text-yellow-800 dark:text-yellow-200 break-all">
                  {newMasterKey}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <button
                    onClick={(e) => copyToClipboard(e)}
                    disabled={!newMasterKey}
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
                    recoveryKey={newMasterKey}
                    isRecovery={true}
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
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Important:</strong> Write down this master key and
                    store it securely. You won&apos;t be able to see it again.
                  </p>
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={handleComplete}
            >
              Complete Setup
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
