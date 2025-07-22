"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import {
  validateUserType,
  getStoredUserInfo,
  clearUserSession,
} from "@/lib/auth";

interface SignatureRequest {
  id: string;
  createdAt: string;
  psbtData: string;
  unlocksAt: string;
  clientUsername: string;
  servicePolicyType: string;
  perSignatureFee: string;
}

interface ServicePolicy {
  id: string;
  policyType: string;
  xpub: string;
  xpubHash: string;
  controlSignature: string;
  initialBackupFee: number;
  perSignatureFee: number;
  monthlyFee?: number;
  minTimeDelay: number;
  lightningAddress: string; // Changed from bolt12Offer
  createdAt: string;
  isPurchased: boolean;
  servicePurchases?: {
    id: string;
    client: {
      username: string;
    };
    createdAt: string;
    isActive: boolean;
  }[];
}

export default function ProviderDashboard() {
  const [requests, setRequests] = useState<SignatureRequest[]>([]);
  const [policies, setPolicies] = useState<ServicePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRequest, setSelectedRequest] =
    useState<SignatureRequest | null>(null);
  const [signedPsbt, setSignedPsbt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAddKey, setShowAddKey] = useState(false);
  const [addKeyForm, setAddKeyForm] = useState({
    policyType: "",
    xpub: "",
    controlSignature: "",
    masterFingerprint: "",
    derivationPath: "",
    initialBackupFee: "",
    perSignatureFee: "",
    monthlyFee: "",
    minTimeDelayDays: "",
    lightningAddress: "", // Changed from bolt12Offer
  });
  const [addingKey, setAddingKey] = useState(false);
  const [username, setUsername] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [timeDelayError, setTimeDelayError] = useState("");
  const [xpubError, setXpubError] = useState("");
  const [xpubDuplicateError, setXpubDuplicateError] = useState("");
  const [lightningAddressError, setLightningAddressError] = useState(""); // Add Lightning address error state
  const [lightningAddressValidating, setLightningAddressValidating] =
    useState(false); // Add validation state
  const [signatureError, setSignatureError] = useState(""); // Add signature error state
  const [signatureValidating, setSignatureValidating] = useState(false); // Add signature validation state
  const [selectedKeyDetails, setSelectedKeyDetails] =
    useState<ServicePolicy | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const router = useRouter();

  // Debounce timer for time delay validation
  const [timeDelayTimer, setTimeDelayTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  // Debounce timer for Lightning address validation
  const [lightningAddressTimer, setLightningAddressTimer] =
    useState<NodeJS.Timeout | null>(null);

  // Debounce timer for signature validation
  const [signatureTimer, setSignatureTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  // Get current theme state from localStorage
  const getCurrentTheme = () => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "light" ? false : true;
  };

  // Update theme state
  const updateTheme = (dark: boolean) => {
    const html = document.documentElement;
    if (dark) {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    setIsDark(dark);
  };

  // Format number with commas
  const formatNumberWithCommas = (value: string) => {
    const numValue = value.replace(/,/g, "");
    if (numValue === "") return "";
    const number = parseInt(numValue);
    if (isNaN(number)) return value;
    return number.toLocaleString();
  };

  // Parse number from comma-formatted string
  const parseNumberFromCommas = (value: string) => {
    return value.replace(/,/g, "");
  };

  // Validate and format number input
  const handleNumberInput = (value: string, field: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, "");

    setAddKeyForm({
      ...addKeyForm,
      [field]: numericValue,
    });
  };

  // Validate time delay with debounce
  const validateTimeDelay = (value: string) => {
    const days = parseInt(value);
    if (days < 7) {
      setTimeDelayError("Time delay must be at least 7 days");
    } else if (days > 365) {
      setTimeDelayError("Time delay cannot exceed 365 days");
    } else {
      setTimeDelayError("");
    }
  };

  const validateXpub = (value: string) => {
    // Basic xpub validation
    if (!value.startsWith("xpub") && !value.startsWith("zpub")) {
      setXpubError("Xpub must start with 'xpub' or 'zpub'");
      return false;
    }
    if (value.length < 100) {
      setXpubError("Xpub appears to be too short");
      return false;
    }
    setXpubError("");
    return true;
  };

  const handleLightningAddressChange = (value: string) => {
    // Clear any existing timer
    if (lightningAddressTimer) {
      clearTimeout(lightningAddressTimer);
    }

    // Update the form
    setAddKeyForm({
      ...addKeyForm,
      lightningAddress: value,
    });

    // Clear error if field is empty
    if (!value) {
      setLightningAddressError("");
      setLightningAddressValidating(false);
      return;
    }

    // Basic format validation
    if (!value.includes("@")) {
      setLightningAddressError(
        "Lightning address must contain '@' (e.g., user@getalby.com)"
      );
      setLightningAddressValidating(false);
      return;
    }

    // Set validating state
    setLightningAddressValidating(true);
    setLightningAddressError("");

    // Debounce the validation - faster for pasting
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/lightning/validate-address", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ lightningAddress: value }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.supportsLnurlVerify) {
            setLightningAddressError("");
          } else {
            setLightningAddressError(
              "This Lightning address doesn't support LNURL verify. Please use a Lightning address from a provider that supports LNURL verify (e.g., Alby, Voltage, etc.)."
            );
          }
        } else {
          setLightningAddressError(
            "Failed to validate Lightning address. Please try again."
          );
        }
      } catch (error) {
        setLightningAddressError(
          "Failed to validate Lightning address. Please try again."
        );
      }
      setLightningAddressValidating(false);
    }, 100); // Reduced from 300ms to 100ms for faster validation

    setLightningAddressTimer(timer);
  };

  const handleXpubChange = (value: string) => {
    // Update the form
    setAddKeyForm({
      ...addKeyForm,
      xpub: value,
    });

    // Clear error if field is empty
    if (!value) {
      setXpubError("");
      setXpubDuplicateError("");
      return;
    }

    // Validate xpub format
    validateXpub(value);

    // Check for duplicates (debounced)
    if (value.length > 10) {
      setTimeout(async () => {
        try {
          const response = await fetch(
            `/api/providers/check-xpub?xpub=${encodeURIComponent(
              value
            )}&providerId=${localStorage.getItem("userId")}`
          );
          if (response.ok) {
            const data = await response.json();
            if (data.isDuplicate) {
              setXpubDuplicateError("This xpub is already registered");
            } else {
              setXpubDuplicateError("");
            }
          }
        } catch (error) {
          console.error("Error checking xpub duplicate:", error);
        }
      }, 500);
    }
  };

  const handleSignatureChange = (value: string) => {
    // Clear any existing timer
    if (signatureTimer) {
      clearTimeout(signatureTimer);
    }

    // Update the form
    setAddKeyForm({
      ...addKeyForm,
      controlSignature: value,
    });

    // Clear error if field is empty
    if (!value) {
      setSignatureError("");
      setSignatureValidating(false);
      return;
    }

    // Basic signature format validation
    if (value.length !== 128) {
      setSignatureError("Signature must be 64 bytes (128 hex characters)");
      setSignatureValidating(false);
      return;
    }

    if (!/^[0-9a-fA-F]{128}$/.test(value)) {
      setSignatureError("Signature must be valid hex format");
      setSignatureValidating(false);
      return;
    }

    // Set validating state
    setSignatureValidating(true);
    setSignatureError("");

    // Debounce the backend validation
    const timer = setTimeout(async () => {
      try {
        // Make sure we have both xpub and signature
        if (!addKeyForm.xpub) {
          setSignatureError("Xpub is required for signature validation");
          setSignatureValidating(false);
          return;
        }

        console.log("🔍 Validating signature:", {
          xpub: addKeyForm.xpub.substring(0, 20) + "...",
          signature: value.substring(0, 20) + "...",
        });

        const response = await fetch("/api/providers/validate-signature", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            xpub: addKeyForm.xpub,
            signature: value,
            message: "Control signature for Seed-E service",
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log("✅ Signature validation result:", data);
          if (data.isValid) {
            console.log("🎯 Clearing signature error - validation successful");
            setSignatureError("");
          } else {
            console.log("❌ Setting signature error:", data.error);
            setSignatureError(data.error || "Signature verification failed");
          }
        } else {
          console.log("❌ Signature validation failed");
          setSignatureError("Failed to validate signature. Please try again.");
        }
      } catch (error) {
        console.error("❌ Signature validation error:", error);
        setSignatureError("Failed to validate signature. Please try again.");
      }
      setSignatureValidating(false);
    }, 300); // Wait 300ms after user stops typing

    setSignatureTimer(timer);
  };

  // Check if form is valid for submission
  const isFormValid = () => {
    const isValid =
      addKeyForm.policyType &&
      addKeyForm.xpub &&
      addKeyForm.controlSignature &&
      addKeyForm.masterFingerprint &&
      addKeyForm.derivationPath &&
      addKeyForm.initialBackupFee &&
      addKeyForm.perSignatureFee &&
      addKeyForm.minTimeDelayDays &&
      addKeyForm.lightningAddress &&
      !xpubError &&
      !xpubDuplicateError &&
      !lightningAddressError &&
      !signatureError &&
      !timeDelayError &&
      !lightningAddressValidating && // Don't allow submission while validating
      !signatureValidating; // Don't allow submission while validating signature

    console.log("🔍 Form validation state:", {
      hasPolicyType: !!addKeyForm.policyType,
      hasXpub: !!addKeyForm.xpub,
      hasSignature: !!addKeyForm.controlSignature,
      hasFees: !!(addKeyForm.initialBackupFee && addKeyForm.perSignatureFee),
      hasTimeDelay: !!addKeyForm.minTimeDelayDays,
      hasLightningAddress: !!addKeyForm.lightningAddress,
      xpubError: !!xpubError,
      xpubDuplicateError: !!xpubDuplicateError,
      lightningAddressError: !!lightningAddressError,
      signatureError: !!signatureError,
      timeDelayError: !!timeDelayError,
      lightningAddressValidating: !!lightningAddressValidating,
      signatureValidating: !!signatureValidating,
      isValid,
    });

    return isValid;
  };

  // Handle time delay change with debounce
  const handleTimeDelayChange = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, "");

    setAddKeyForm({
      ...addKeyForm,
      minTimeDelayDays: numericValue,
    });

    // Clear existing timer
    if (timeDelayTimer) {
      clearTimeout(timeDelayTimer);
    }

    // Set new timer for validation
    const timer = setTimeout(() => {
      validateTimeDelay(numericValue);
    }, 1000);

    setTimeDelayTimer(timer);
  };

  const validateAuthentication = async () => {
    const { username: storedUsername, userType, userId } = getStoredUserInfo();

    if (!storedUsername || !userType || !userId) {
      console.log("No authentication found, redirecting to login");
      clearUserSession();
      router.push("/login");
      return false;
    }

    const isValidProvider = await validateUserType(storedUsername, "provider");
    if (!isValidProvider) {
      console.log(
        "User is not a provider, redirecting to appropriate dashboard"
      );
      clearUserSession();
      router.push("/login");
      return false;
    }

    setUsername(storedUsername);
    return true;
  };

  useEffect(() => {
    const initializeDashboard = async () => {
      const isAuthenticated = await validateAuthentication();
      if (!isAuthenticated) {
        return;
      }
      const currentTheme = getCurrentTheme();
      setIsDark(currentTheme);
      fetchRequests();
      fetchPolicies();
    };

    initializeDashboard();
  }, [router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showSettings &&
        !(event.target as Element).closest(".settings-menu")
      ) {
        setShowSettings(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSettings]);

  useEffect(() => {
    const providerId = localStorage.getItem("userId");
    if (providerId && policies.length === 0 && !loading) {
      fetchPolicies();
    }
  }, [policies.length, loading]);

  const fetchRequests = async () => {
    try {
      const providerId = localStorage.getItem("userId");
      if (!providerId) {
        console.error("No provider ID found");
        return;
      }

      const response = await fetch(
        `/api/signature-requests/provider?providerId=${providerId}`
      );

      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      } else {
        // Don't show error for empty requests - this is normal for new providers
        console.log("No signature requests found (normal for new providers)");
        setRequests([]);
      }
    } catch (error) {
      // Don't show error for network issues when there are no requests
      console.log("Network error fetching requests (normal for new providers)");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPolicies = async () => {
    try {
      const providerId = localStorage.getItem("userId");
      if (!providerId) {
        console.error("No provider ID found");
        return;
      }

      const response = await fetch(
        `/api/providers/policies?providerId=${providerId}`
      );

      if (response.ok) {
        const data = await response.json();
        setPolicies(data.policies);
      } else {
        console.error("Failed to fetch policies");
      }
    } catch {
      console.error("Network error fetching policies");
    }
  };

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingKey(true);
    setError("");

    if (!isFormValid()) {
      setAddingKey(false);
      return;
    }
    validateXpub(addKeyForm.xpub);
    if (xpubError) {
      setAddingKey(false);
      return;
    }
    const providerId = localStorage.getItem("userId");
    if (!providerId) {
      setError("Provider ID not found. Please log in again.");
      setAddingKey(false);
      return;
    }

    try {
      const response = await fetch("/api/providers/policies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          providerId: providerId,
          policyType: addKeyForm.policyType,
          xpub: addKeyForm.xpub.trim(),
          controlSignature: addKeyForm.controlSignature.trim(),
          masterFingerprint: addKeyForm.masterFingerprint.trim(),
          derivationPath: addKeyForm.derivationPath.trim(),
          initialBackupFee: parseInt(
            parseNumberFromCommas(addKeyForm.initialBackupFee)
          ),
          perSignatureFee: parseInt(
            parseNumberFromCommas(addKeyForm.perSignatureFee)
          ),
          monthlyFee: addKeyForm.monthlyFee
            ? parseInt(parseNumberFromCommas(addKeyForm.monthlyFee))
            : null,
          minTimeDelayDays: parseInt(addKeyForm.minTimeDelayDays),
          lightningAddress: addKeyForm.lightningAddress.trim(),
        }),
      });

      if (response.ok) {
        setShowAddKey(false);
        setAddKeyForm({
          policyType: "",
          xpub: "",
          controlSignature: "",
          masterFingerprint: "",
          derivationPath: "",
          initialBackupFee: "",
          perSignatureFee: "",
          monthlyFee: "",
          minTimeDelayDays: "",
          lightningAddress: "",
        });
        setTimeDelayError("");
        setXpubError("");
        setXpubDuplicateError("");
        setLightningAddressError("");
        setLightningAddressValidating(false);
        fetchPolicies();
      } else {
        const data = await response.json();
        if (data.error && data.error.includes("LNURL verify")) {
          setLightningAddressError(data.error);
        } else if (data.error && data.error.includes("signature")) {
          setSignatureError(data.error);
        } else {
          setError(data.error || "Failed to add key");
        }
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setAddingKey(false);
    }
  };

  const handleSignRequest = async () => {
    if (!selectedRequest || !signedPsbt.trim()) {
      setError("Please select a request and provide the signed PSBT");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const providerId = localStorage.getItem("userId");
      if (!providerId) {
        setError("Provider ID not found. Please log in again.");
        return;
      }

      const response = await fetch("/api/signature-requests/sign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signatureRequestId: selectedRequest.id,
          signedPsbtData: signedPsbt.trim(),
          providerId,
        }),
      });

      if (response.ok) {
        setError("");
        setSignedPsbt("");
        setSelectedRequest(null);
        fetchRequests();
        alert("PSBT signed successfully!");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to submit signed PSBT");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("userType");
    localStorage.removeItem("userId");
    localStorage.removeItem("tempPassword");
    sessionStorage.clear();
    router.push("/");
  };

  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isUnlocked = (unlocksAt: string) => {
    return new Date(unlocksAt) <= new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9500] mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {username
                ? `${capitalizeFirstLetter(username)} Provider Dashboard`
                : "Provider Dashboard"}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Manage your signature requests and signing keys
            </p>
          </div>

          {/* Settings Menu */}
          <div className="relative settings-menu">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center space-x-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none transition-colors"
            >
              <div className="w-8 h-8 bg-[#FF9500] text-black rounded-full flex items-center justify-center font-semibold">
                {username ? getInitials(username) : "U"}
              </div>
              <svg
                className="w-4 h-4 text-gray-600 dark:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Settings Dropdown */}
            {showSettings && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="py-1">
                  <div className="px-4 py-2 text-sm text-gray-700 dark:text-white border-b border-gray-200 dark:border-gray-700">
                    <div className="font-medium">
                      {username ? capitalizeFirstLetter(username) : "User"}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      updateTheme(!isDark);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                  >
                    <div className="flex items-center space-x-2">
                      {isDark ? (
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
                            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                      ) : (
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
                            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                          />
                        </svg>
                      )}
                      <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
                    </div>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                  >
                    <div className="flex items-center space-x-2">
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
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      <span>Logout</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Add Key Section */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Signing Keys
            </h2>
            <Button
              onClick={() => setShowAddKey(!showAddKey)}
              variant="primary"
              size="md"
            >
              {showAddKey ? "Cancel" : "Add Key"}
            </Button>
          </div>

          {showAddKey && (
            <form onSubmit={handleAddKey} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Policy Type *
                  </label>
                  <div className="relative">
                    <select
                      value={addKeyForm.policyType}
                      onChange={(e) =>
                        setAddKeyForm({
                          ...addKeyForm,
                          policyType: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#FF9500] focus:border-[#FF9500] appearance-none"
                      required
                    >
                      <option value="">Select a policy type...</option>
                      <option value="P2WSH">P2WSH (Native SegWit)</option>
                      <option value="P2TR">P2TR (Taproot)</option>
                      <option value="P2SH">P2SH (Legacy SegWit)</option>
                    </select>
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg
                        className="w-5 h-5 text-gray-500 dark:text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Initial Backup Fee (sats) *
                  </label>
                  <input
                    type="text"
                    value={formatNumberWithCommas(addKeyForm.initialBackupFee)}
                    onChange={(e) =>
                      handleNumberInput(e.target.value, "initialBackupFee")
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#FF9500] focus:border-[#FF9500]"
                    placeholder="50,000"
                    required
                    onBlur={() =>
                      setAddKeyForm({
                        ...addKeyForm,
                        initialBackupFee: formatNumberWithCommas(
                          addKeyForm.initialBackupFee
                        ),
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Per Signature Fee (sats) *
                  </label>
                  <input
                    type="text"
                    value={formatNumberWithCommas(addKeyForm.perSignatureFee)}
                    onChange={(e) =>
                      handleNumberInput(e.target.value, "perSignatureFee")
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#FF9500] focus:border-[#FF9500]"
                    placeholder="1,000"
                    required
                    onBlur={() =>
                      setAddKeyForm({
                        ...addKeyForm,
                        perSignatureFee: formatNumberWithCommas(
                          addKeyForm.perSignatureFee
                        ),
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Monthly Fee (sats) - Optional
                  </label>
                  <input
                    type="text"
                    value={formatNumberWithCommas(addKeyForm.monthlyFee)}
                    onChange={(e) =>
                      handleNumberInput(e.target.value, "monthlyFee")
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#FF9500] focus:border-[#FF9500]"
                    placeholder="25,000"
                    min="0"
                    onBlur={() =>
                      setAddKeyForm({
                        ...addKeyForm,
                        monthlyFee: formatNumberWithCommas(
                          addKeyForm.monthlyFee
                        ),
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time Delay (days) *
                  </label>
                  <input
                    type="text"
                    value={addKeyForm.minTimeDelayDays}
                    onChange={(e) => handleTimeDelayChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#FF9500] focus:border-[#FF9500]"
                    placeholder="7"
                    required
                    maxLength={3}
                    onBlur={() =>
                      validateTimeDelay(addKeyForm.minTimeDelayDays)
                    }
                  />
                  {timeDelayError && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {timeDelayError}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Extended Public Key (xpub/zpub) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={addKeyForm.xpub}
                    onChange={(e) => handleXpubChange(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#FF9500] focus:border-[#FF9500]"
                    placeholder="xpub..."
                    required
                    readOnly
                    onBlur={() => validateXpub(addKeyForm.xpub)}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        setAddKeyForm({ ...addKeyForm, xpub: text });
                        handleXpubChange(text);
                      } catch (err) {
                        console.error("Failed to read clipboard:", err);
                      }
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    title="Paste from clipboard"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </button>
                </div>
                {xpubError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {xpubError}
                  </p>
                )}
                {xpubDuplicateError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {xpubDuplicateError}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Must start with &apos;xpub&apos; or &apos;zpub&apos;. Click
                  the paste icon to paste from clipboard.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Control Signature (Base64) *
                </label>
                <div className="relative">
                  <textarea
                    value={addKeyForm.controlSignature}
                    onChange={(e) => handleSignatureChange(e.target.value)}
                    className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#FF9500] focus:border-[#FF9500] ${
                      signatureError
                        ? "border-red-500 dark:border-red-400"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    rows={4}
                    placeholder="Paste the control signature here..."
                    required
                    readOnly
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        handleSignatureChange(text);
                      } catch (err) {
                        console.error("Failed to read clipboard:", err);
                      }
                    }}
                    className="absolute right-2 top-2 p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    title="Paste from clipboard"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </button>
                </div>
                {signatureError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {signatureError}
                  </p>
                )}
                {signatureValidating && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Validating signature...
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Click the paste icon to paste from clipboard.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Master Fingerprint *
                  </label>
                  <input
                    type="text"
                    value={addKeyForm.masterFingerprint}
                    onChange={(e) =>
                      setAddKeyForm({
                        ...addKeyForm,
                        masterFingerprint: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#FF9500] focus:border-[#FF9500]"
                    placeholder="97046043"
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    The master fingerprint (e.g., 97046043) for client wallet
                    setup.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Derivation Path *
                  </label>
                  <input
                    type="text"
                    value={addKeyForm.derivationPath}
                    onChange={(e) =>
                      setAddKeyForm({
                        ...addKeyForm,
                        derivationPath: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#FF9500] focus:border-[#FF9500]"
                    placeholder="m/48'/0'/0'/2'"
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    The derivation path (e.g., m/48'/0'/0'/2') for client wallet
                    setup.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lightning Address *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={addKeyForm.lightningAddress}
                    onChange={(e) =>
                      handleLightningAddressChange(e.target.value)
                    }
                    className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#FF9500] focus:border-[#FF9500] ${
                      lightningAddressError
                        ? "border-red-500 dark:border-red-400"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    placeholder="user@getalby.com"
                    required
                    readOnly
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        handleLightningAddressChange(text);
                      } catch (err) {
                        console.error("Failed to read clipboard:", err);
                      }
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    title="Paste from clipboard"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </button>
                </div>
                {lightningAddressError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {lightningAddressError}
                  </p>
                )}
                {lightningAddressValidating && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Validating...
                  </p>
                )}
                {!lightningAddressError &&
                  !lightningAddressValidating &&
                  addKeyForm.lightningAddress && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Recommended providers: Alby (@getalby.com), Voltage
                      (@voltage.com), or any provider that supports LNURL
                      verify. Example: highlyregarded@getalby.com
                    </p>
                  )}
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    setAddKeyForm({
                      policyType: "",
                      xpub: "",
                      controlSignature: "",
                      masterFingerprint: "",
                      derivationPath: "",
                      initialBackupFee: "",
                      perSignatureFee: "",
                      monthlyFee: "",
                      minTimeDelayDays: "",
                      lightningAddress: "",
                    });
                    setTimeDelayError("");
                    setXpubError("");
                    setXpubDuplicateError("");
                    setLightningAddressError("");
                    setSignatureError("");
                    setLightningAddressValidating(false);
                    if (lightningAddressTimer) {
                      clearTimeout(lightningAddressTimer);
                      setLightningAddressTimer(null);
                    }
                  }}
                >
                  Clear Form
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={addingKey}
                  disabled={addingKey || !isFormValid()}
                >
                  Add Key
                </Button>
              </div>
            </form>
          )}

          {/* Existing Keys */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Your Keys ({policies.length})
            </h3>
            {policies.length === 0 ? (
              <p className="text-gray-500 dark:text-white">
                No keys added yet. Add your first signing key above.
              </p>
            ) : (
              <div className="space-y-6">
                {/* Available Services */}
                {policies.filter((policy) => !policy.isPurchased).length >
                  0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Available Services (
                      {policies.filter((policy) => !policy.isPurchased).length})
                    </h4>
                    <div className="space-y-3">
                      {policies
                        .filter((policy) => !policy.isPurchased)
                        .map((policy) => (
                          <div
                            key={policy.id}
                            className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                            onClick={() => {
                              setSelectedKeyDetails(policy);
                              setShowKeyModal(true);
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <p className="text-gray-900 dark:text-white font-medium">
                                    {policy.policyType}
                                  </p>
                                  <svg
                                    className="w-4 h-4 text-gray-400"
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
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                  Initial Fee: {policy.initialBackupFee} sats
                                </p>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                  Per Signature: {policy.perSignatureFee} sats
                                </p>
                                {policy.monthlyFee && (
                                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    Monthly: {policy.monthlyFee} sats
                                  </p>
                                )}
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                  Delay: {Math.floor(policy.minTimeDelay / 24)}{" "}
                                  days
                                </p>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                  Added: {formatDate(policy.createdAt)}
                                </p>
                              </div>
                              <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs">
                                Available
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Purchased Services */}
                {policies.filter((policy) => policy.isPurchased).length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Purchased Services (
                      {policies.filter((policy) => policy.isPurchased).length})
                    </h4>
                    <div className="space-y-3">
                      {policies
                        .filter((policy) => policy.isPurchased)
                        .map((policy) => (
                          <div
                            key={policy.id}
                            className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                            onClick={() => {
                              setSelectedKeyDetails(policy);
                              setShowKeyModal(true);
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <p className="text-gray-900 dark:text-white font-medium">
                                    {policy.policyType}
                                  </p>
                                  <svg
                                    className="w-4 h-4 text-gray-400"
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
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                  Initial Fee: {policy.initialBackupFee} sats
                                </p>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                  Per Signature: {policy.perSignatureFee} sats
                                </p>
                                {policy.monthlyFee && (
                                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    Monthly: {policy.monthlyFee} sats
                                  </p>
                                )}
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                  Delay: {Math.floor(policy.minTimeDelay / 24)}{" "}
                                  days
                                </p>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                  Added: {formatDate(policy.createdAt)}
                                </p>

                                {/* Show client information */}
                                {policy.servicePurchases &&
                                  policy.servicePurchases.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                        Purchased by:
                                      </p>
                                      {policy.servicePurchases.map(
                                        (purchase) => (
                                          <div
                                            key={purchase.id}
                                            className="flex items-center space-x-2"
                                          >
                                            <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                                              {purchase.client.username}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                              {formatDate(purchase.createdAt)}
                                            </span>
                                            {purchase.isActive && (
                                              <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-1 py-0.5 rounded">
                                                Active
                                              </span>
                                            )}
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}
                              </div>
                              <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-xs">
                                Purchased
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Key Details Modal */}
        {showKeyModal && selectedKeyDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Key Details
                </h3>
                <button
                  onClick={() => {
                    setShowKeyModal(false);
                    setSelectedKeyDetails(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Policy Type
                    </label>
                    <input
                      type="text"
                      value={selectedKeyDetails.policyType}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Initial Backup Fee (sats)
                    </label>
                    <input
                      type="text"
                      value={selectedKeyDetails.initialBackupFee.toLocaleString()}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Per Signature Fee (sats)
                    </label>
                    <input
                      type="text"
                      value={selectedKeyDetails.perSignatureFee.toLocaleString()}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  {selectedKeyDetails.monthlyFee && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Monthly Fee (sats)
                      </label>
                      <input
                        type="text"
                        value={selectedKeyDetails.monthlyFee.toLocaleString()}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Time Delay (days)
                    </label>
                    <input
                      type="text"
                      value={Math.floor(selectedKeyDetails.minTimeDelay / 24)}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Created
                    </label>
                    <input
                      type="text"
                      value={formatDate(selectedKeyDetails.createdAt)}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Extended Public Key (xpub)
                  </label>
                  <textarea
                    value={selectedKeyDetails.xpub}
                    readOnly
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Control Signature (Base64)
                  </label>
                  <textarea
                    value={selectedKeyDetails.controlSignature}
                    readOnly
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Lightning Address
                  </label>
                  <textarea
                    value={selectedKeyDetails.lightningAddress}
                    readOnly
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button
                  onClick={() => {
                    setShowKeyModal(false);
                    setSelectedKeyDetails(null);
                  }}
                  variant="secondary"
                  size="md"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Signature Requests List */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Pending Signature Requests ({requests.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {requests.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="mt-2">No pending signature requests</p>
                </div>
              ) : (
                requests.map((request) => (
                  <div
                    key={request.id}
                    className={`px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      selectedRequest?.id === request.id
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : ""
                    }`}
                    onClick={() => setSelectedRequest(request)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Client: {request.clientUsername}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Policy: {request.servicePolicyType}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Fee: {request.perSignatureFee} sats
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Created: {formatDate(request.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isUnlocked(request.unlocksAt)
                              ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                              : "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                          }`}
                        >
                          {isUnlocked(request.unlocksAt)
                            ? "Unlocked"
                            : "Locked"}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Unlocks: {formatDate(request.unlocksAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sign PSBT Form */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Sign PSBT
              </h2>
            </div>
            <div className="px-6 py-4">
              {selectedRequest ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Selected Request
                    </label>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                      <p className="text-sm text-gray-900 dark:text-white">
                        <strong>Client:</strong>{" "}
                        {selectedRequest.clientUsername}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <strong>Policy:</strong>{" "}
                        {selectedRequest.servicePolicyType}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <strong>Fee:</strong> {selectedRequest.perSignatureFee}{" "}
                        sats
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <strong>Status:</strong>{" "}
                        <span
                          className={
                            isUnlocked(selectedRequest.unlocksAt)
                              ? "text-green-600 dark:text-green-400"
                              : "text-yellow-600 dark:text-yellow-400"
                          }
                        >
                          {isUnlocked(selectedRequest.unlocksAt)
                            ? "Unlocked"
                            : "Locked"}
                        </span>
                      </p>
                    </div>
                  </div>

                  {!isUnlocked(selectedRequest.unlocksAt) && (
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
                            This request is still locked. You cannot sign it
                            until {formatDate(selectedRequest.unlocksAt)}.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Signed PSBT (Base64)
                    </label>
                    <textarea
                      value={signedPsbt}
                      onChange={(e) => setSignedPsbt(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      rows={6}
                      placeholder="Paste the signed PSBT here..."
                      disabled={!isUnlocked(selectedRequest.unlocksAt)}
                    />
                  </div>

                  <Button
                    onClick={handleSignRequest}
                    variant="primary"
                    size="md"
                    fullWidth
                    loading={submitting}
                    disabled={
                      !isUnlocked(selectedRequest.unlocksAt) || submitting
                    }
                  >
                    Submit Signed PSBT
                  </Button>
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="mt-2">Select a request to sign</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
