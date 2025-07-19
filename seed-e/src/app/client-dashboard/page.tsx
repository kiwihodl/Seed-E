"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";

interface Service {
  id: string;
  providerName: string;
  policyType: string;
  xpubHash: string;
  initialBackupFee: number;
  perSignatureFee: number;
  monthlyFee?: number;
  minTimeDelay: number;
  createdAt: string;
  isPurchased: boolean;
}

interface PurchasedService {
  id: string;
  serviceId: string;
  providerName: string;
  policyType: string;
  xpubHash: string;
  initialBackupFee: number;
  perSignatureFee: number;
  monthlyFee?: number;
  minTimeDelay: number;
  purchasedAt: string;
  expiresAt?: string;
  isActive: boolean;
  paymentHash?: string;
}

interface SignatureRequest {
  id: string;
  serviceId: string;
  serviceName: string;
  status: "PENDING" | "SIGNED" | "COMPLETED" | "EXPIRED";
  createdAt: string;
  expiresAt: string;
  penaltyDate: string;
  fee: number;
}

export default function ClientDashboard() {
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [purchasedServices, setPurchasedServices] = useState<
    PurchasedService[]
  >([]);
  const [requests, setRequests] = useState<SignatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  // const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const router = useRouter();

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

  useEffect(() => {
    // Get username from localStorage or session
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }

    // Get current theme from localStorage
    const currentTheme = getCurrentTheme();
    setIsDark(currentTheme);

    // Load services and requests
    fetchAvailableServices();
    fetchPurchasedServices();
    fetchRequests();
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

  const fetchAvailableServices = async () => {
    try {
      const response = await fetch("/api/services");

      if (response.ok) {
        const data = await response.json();
        setAvailableServices(data.services);
      } else {
        console.error("Failed to fetch available services");
      }
    } catch {
      console.error("Network error fetching available services");
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchasedServices = async () => {
    try {
      const clientId = localStorage.getItem("userId");
      console.log("🔍 Fetching purchased services for client ID:", clientId);

      if (!clientId) {
        console.log("❌ No client ID found in localStorage");
        return;
      }

      const response = await fetch(
        `/api/clients/purchased-services?clientId=${clientId}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Purchased services data:", data);
        setPurchasedServices(data.purchasedServices);
      } else {
        console.error("Failed to fetch purchased services");
        const errorData = await response.json();
        console.error("Error details:", errorData);
      }
    } catch (error) {
      console.error("Network error fetching purchased services:", error);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await fetch("/api/clients/signature-requests");

      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests);
      } else {
        console.error("Failed to fetch requests");
      }
    } catch {
      console.error("Network error fetching requests");
    }
  };

  const handleLogout = () => {
    // Clear any stored authentication data
    localStorage.removeItem("username");
    localStorage.removeItem("userType");
    localStorage.removeItem("userId");
    localStorage.removeItem("tempPassword");
    sessionStorage.clear();

    // Redirect to home page
    router.push("/");
  };

  const handlePurchaseService = async (service: Service) => {
    try {
      // Get client ID from localStorage or session
      const clientId = localStorage.getItem("userId");
      console.log("🛒 Attempting purchase with client ID:", clientId);

      if (!clientId) {
        alert("Please log in to purchase services");
        return;
      }

      const response = await fetch("/api/services/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceId: service.id,
          clientId: clientId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Purchase initiated:", data);

        // TODO: Show payment modal with Lightning invoice
        alert(
          `Purchase initiated for ${service.providerName}! Lightning invoice: ${data.purchase.invoice.paymentRequest}`
        );

        // Refresh the services lists
        fetchAvailableServices();
        fetchPurchasedServices();

        // Future implementation:
        // 1. Show payment modal with QR code
        // 2. Poll for payment confirmation
        // 3. Activate service after payment
      } else {
        const error = await response.json();
        console.error("❌ Purchase failed:", error);
        alert(`Purchase failed: ${error.error}`);
      }
    } catch (error) {
      console.error("Purchase error:", error);
      alert("Failed to initiate purchase. Please try again.");
    }
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatNumberWithCommas = (value: number) => {
    return value.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200";
      case "SIGNED":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200";
      case "COMPLETED":
        return "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200";
      case "EXPIRED":
        return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200";
      default:
        return "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200";
    }
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
              {username ? `${username}'s Dashboard` : "Client Dashboard"}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Browse signing services and manage your signature requests
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
                      Client
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

        {/* error && (
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
        ) */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Available Services */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Available Services ({availableServices.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {availableServices.length === 0 ? (
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="mt-2">No services available</p>
                </div>
              ) : (
                availableServices.map((service) => (
                  <div
                    key={service.id}
                    className="px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => {
                      setSelectedService(service);
                      setShowServiceModal(true);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {service.providerName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Policy: {service.policyType}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Initial Fee:{" "}
                          {formatNumberWithCommas(service.initialBackupFee)}{" "}
                          sats
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Per Signature:{" "}
                          {formatNumberWithCommas(service.perSignatureFee)} sats
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Delay: {Math.floor(service.minTimeDelay / 24)} days
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                          Available
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Added: {formatDate(service.createdAt)}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePurchaseService(service);
                          }}
                          className="mt-2 px-3 py-1 bg-[#FF9500] text-black text-xs font-medium rounded hover:bg-[#FF9500]/90 transition-colors"
                        >
                          Purchase
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Purchased Services */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Your Purchased Services ({purchasedServices.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {purchasedServices.length === 0 ? (
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
                  <p className="mt-2">No purchased services</p>
                </div>
              ) : (
                purchasedServices.map((service) => (
                  <div key={service.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {service.providerName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Policy: {service.policyType}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Per Signature:{" "}
                          {formatNumberWithCommas(service.perSignatureFee)} sats
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Purchased: {formatDate(service.purchasedAt)}
                        </p>
                        {service.expiresAt && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Expires: {formatDate(service.expiresAt)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            service.isActive
                              ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                              : "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                          }`}
                        >
                          {service.isActive ? "Active" : "Pending Payment"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Signature Requests */}
        <div className="mt-8 bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Your Signature Requests ({requests.length})
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
                <p className="mt-2">No signature requests</p>
              </div>
            ) : (
              requests.map((request) => (
                <div key={request.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {request.serviceName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Fee: {formatNumberWithCommas(request.fee)} sats
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Created: {formatDate(request.createdAt)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Expires: {formatDate(request.expiresAt)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Penalty Date: {formatDate(request.penaltyDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {request.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Service Details Modal */}
        {showServiceModal && selectedService && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Service Details
                </h3>
                <button
                  onClick={() => {
                    setShowServiceModal(false);
                    setSelectedService(null);
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
                      Provider
                    </label>
                    <input
                      type="text"
                      value={selectedService.providerName}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Policy Type
                    </label>
                    <input
                      type="text"
                      value={selectedService.policyType}
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
                      value={formatNumberWithCommas(
                        selectedService.initialBackupFee
                      )}
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
                      value={formatNumberWithCommas(
                        selectedService.perSignatureFee
                      )}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  {selectedService.monthlyFee && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Monthly Fee (sats)
                      </label>
                      <input
                        type="text"
                        value={formatNumberWithCommas(
                          selectedService.monthlyFee
                        )}
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
                      value={Math.floor(selectedService.minTimeDelay / 24)}
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
                      value={formatDate(selectedService.createdAt)}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Extended Public Key Hash (for security)
                  </label>
                  <textarea
                    value={selectedService.xpubHash}
                    readOnly
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    The actual xpub is hashed for security. Only the hash is
                    stored in the database.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  onClick={() => {
                    setShowServiceModal(false);
                    setSelectedService(null);
                  }}
                  variant="secondary"
                  size="md"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    handlePurchaseService(selectedService);
                    setShowServiceModal(false);
                    setSelectedService(null);
                  }}
                  variant="primary"
                  size="md"
                >
                  Purchase Service
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
