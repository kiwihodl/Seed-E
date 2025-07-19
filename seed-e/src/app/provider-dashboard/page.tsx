"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";

interface SignatureRequest {
  id: string;
  createdAt: string;
  unsignedPsbt: string;
  unlocksAt: string;
  clientUsername: string;
  servicePolicyType: string;
  perSignatureFee: string;
}

interface ServicePolicy {
  id: string;
  policyType: string;
  xpub: string;
  controlSignature: string;
  initialBackupFee: number;
  perSignatureFee: number;
  monthlyFee?: number;
  minTimeDelay: number;
  bolt12Offer: string;
  createdAt: string;
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
    initialBackupFee: "",
    perSignatureFee: "",
    monthlyFee: "",
    minTimeDelayDays: "",
    bolt12Offer: "",
  });
  const [addingKey, setAddingKey] = useState(false);
  const [username, setUsername] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [timeDelayError, setTimeDelayError] = useState("");
  const [xpubError, setXpubError] = useState("");
  const [xpubDuplicateError, setXpubDuplicateError] = useState("");
  const [selectedKeyDetails, setSelectedKeyDetails] =
    useState<ServicePolicy | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const router = useRouter();

  // Debounce timer for time delay validation
  const [timeDelayTimer, setTimeDelayTimer] = useState<NodeJS.Timeout | null>(
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

  // Validate xpub format
  const validateXpub = (value: string) => {
    if (!value) {
      setXpubError("");
      setXpubDuplicateError("");
      return;
    }
    if (!value.startsWith("xpub") && !value.startsWith("zpub")) {
      setXpubError("Extended public key must start with 'xpub' or 'zpub'");
      setXpubDuplicateError("");
    } else {
      setXpubError("");
      // Check for duplicates
      const isDuplicate = policies.some((policy) => policy.xpub === value);
      if (isDuplicate) {
        setXpubDuplicateError("This extended public key is already in use");
      } else {
        setXpubDuplicateError("");
      }
    }
  };

  // Check if form is valid for submission
  const isFormValid = () => {
    return (
      addKeyForm.policyType &&
      addKeyForm.xpub &&
      addKeyForm.controlSignature &&
      addKeyForm.initialBackupFee &&
      addKeyForm.perSignatureFee &&
      addKeyForm.minTimeDelayDays &&
      addKeyForm.bolt12Offer &&
      !xpubError &&
      !xpubDuplicateError &&
      !timeDelayError &&
      parseInt(addKeyForm.minTimeDelayDays) >= 7 &&
      parseInt(addKeyForm.minTimeDelayDays) <= 365
    );
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

  useEffect(() => {
    // Get username from localStorage or session
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }

    // Get current theme from localStorage
    const currentTheme = getCurrentTheme();
    setIsDark(currentTheme);

    // Load signature requests and policies
    fetchRequests();
    fetchPolicies();
  }, []);

  // Handle clicking outside settings menu
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

  const fetchRequests = async () => {
    try {
      const response = await fetch("/api/providers/signature-requests");

      if (response.ok) {
        const data = await response.json();
        setRequests(data.pendingRequests);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch requests");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPolicies = async () => {
    try {
      const response = await fetch("/api/providers/policies");

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

    // Validate xpub format before submission
    validateXpub(addKeyForm.xpub);
    if (xpubError) {
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
          policyType: addKeyForm.policyType,
          xpub: addKeyForm.xpub.trim(),
          controlSignature: addKeyForm.controlSignature.trim(),
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
          bolt12Offer: addKeyForm.bolt12Offer.trim(),
        }),
      });

      if (response.ok) {
        setShowAddKey(false);
        setAddKeyForm({
          policyType: "",
          xpub: "",
          controlSignature: "",
          initialBackupFee: "",
          perSignatureFee: "",
          monthlyFee: "",
          minTimeDelayDays: "",
          bolt12Offer: "",
        });
        setTimeDelayError("");
        setXpubError("");
        setXpubDuplicateError("");
        // Refresh policies
        fetchPolicies();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to add key");
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
      const response = await fetch("/api/providers/signature-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signatureRequestId: selectedRequest.id,
          signedPsbt: signedPsbt.trim(),
        }),
      });

      if (response.ok) {
        setError("");
        setSignedPsbt("");
        setSelectedRequest(null);
        // Refresh the requests list
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
    // Clear any stored authentication data
    localStorage.removeItem("username");
    localStorage.removeItem("userType");
    localStorage.removeItem("tempPassword");
    sessionStorage.clear();

    // Redirect to home page
    router.push("/");
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
              {username ? `${username}'s Dashboard` : "Provider Dashboard"}
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
                    <div className="font-medium">{username}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-300">
                      Provider
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
                    onChange={(e) => {
                      setAddKeyForm({ ...addKeyForm, xpub: e.target.value });
                      validateXpub(e.target.value);
                    }}
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
                        validateXpub(text);
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
                    onChange={(e) =>
                      setAddKeyForm({
                        ...addKeyForm,
                        controlSignature: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#FF9500] focus:border-[#FF9500]"
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
                        setAddKeyForm({
                          ...addKeyForm,
                          controlSignature: text,
                        });
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
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Click the paste icon to paste from clipboard.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  BOLT12 Offer *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={addKeyForm.bolt12Offer}
                    onChange={(e) =>
                      setAddKeyForm({
                        ...addKeyForm,
                        bolt12Offer: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#FF9500] focus:border-[#FF9500]"
                    placeholder="lno1..."
                    required
                    readOnly
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        setAddKeyForm({ ...addKeyForm, bolt12Offer: text });
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
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  BOLT12 offer must be pasted directly.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={async () => {
                    try {
                      // Generate fresh real Bitcoin data
                      const response = await fetch("/api/generate-test-data", {
                        method: "GET",
                      });

                      if (response.ok) {
                        const testData = await response.json();
                        setAddKeyForm({
                          policyType: "P2WSH",
                          xpub: testData.xpub,
                          controlSignature: testData.controlSignature,
                          initialBackupFee: "50000",
                          perSignatureFee: "1000",
                          monthlyFee: "",
                          minTimeDelayDays: "7",
                          bolt12Offer: testData.bolt12Offer,
                        });
                        setTimeDelayError("");
                        setXpubError("");
                        setXpubDuplicateError("");
                      } else {
                        console.error("Failed to generate test data");
                      }
                    } catch (error) {
                      console.error("Error generating test data:", error);
                    }
                  }}
                >
                  Fill Test Data
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    setAddKeyForm({
                      policyType: "",
                      xpub: "",
                      controlSignature: "",
                      initialBackupFee: "",
                      perSignatureFee: "",
                      monthlyFee: "",
                      minTimeDelayDays: "",
                      bolt12Offer: "",
                    });
                    setTimeDelayError("");
                    setXpubError("");
                    setXpubDuplicateError("");
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
              <div className="space-y-3">
                {policies.map((policy) => (
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
                          Delay: {Math.floor(policy.minTimeDelay / 24)} days
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          Added: {formatDate(policy.createdAt)}
                        </p>
                      </div>
                      <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-xs">
                        Active
                      </span>
                    </div>
                  </div>
                ))}
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
                    BOLT12 Offer
                  </label>
                  <textarea
                    value={selectedKeyDetails.bolt12Offer}
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
