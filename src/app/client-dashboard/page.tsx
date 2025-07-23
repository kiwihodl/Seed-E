"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PaymentModal from "@/components/PaymentModal";
import SignatureRequestModal from "@/components/SignatureRequestModal";
import Button from "@/components/Button";
import {
  validateUserType,
  getStoredUserInfo,
  clearUserSession,
} from "@/lib/auth";

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
  xpubKey: string; // Changed from xpubHash to xpubKey
  masterFingerprint?: string;
  derivationPath?: string;
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
  status: "REQUESTED" | "PENDING" | "SIGNED" | "COMPLETED" | "EXPIRED";
  createdAt: string;
  unlocksAt: string;
  signedAt?: string;
  signatureFee: number;
  paymentConfirmed: boolean;
  providerName: string;
  policyType: string;
  psbtHash?: string;
  signedPsbtData?: string;
}

interface PaymentData {
  paymentRequest: string;
  paymentHash: string;
  amount: number;
  description: string;
  expiresAt: string;
}

export default function ClientDashboard() {
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [purchasedServices, setPurchasedServices] = useState<
    PurchasedService[]
  >([]);
  const [requests, setRequests] = useState<SignatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [currentService, setCurrentService] = useState<Service | null>(null);
  const [selectedPurchasedService, setSelectedPurchasedService] =
    useState<PurchasedService | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedAvailableService, setSelectedAvailableService] =
    useState<Service | null>(null);
  const [showAvailableServiceModal, setShowAvailableServiceModal] =
    useState(false);
  const [showSignatureRequestModal, setShowSignatureRequestModal] =
    useState(false);
  const [
    showSignatureRequestDetailsModal,
    setShowSignatureRequestDetailsModal,
  ] = useState(false);
  const [selectedSignatureRequest, setSelectedSignatureRequest] =
    useState<any>(null);
  const [visibleXpubs, setVisibleXpubs] = useState<Set<string>>(new Set());
  const [copiedXpubs, setCopiedXpubs] = useState<Set<string>>(new Set());
  const router = useRouter();
  const getCurrentTheme = () => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "light" ? false : true;
  };

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

  const validateAuthentication = async () => {
    const { username: storedUsername, userType, userId } = getStoredUserInfo();

    if (!storedUsername || !userType || !userId) {
      console.log("No authentication found, redirecting to login");
      clearUserSession();
      router.push("/login");
      return false;
    }

    const isValidClient = await validateUserType(storedUsername, "client");
    if (!isValidClient) {
      console.log("User is not a client, redirecting to appropriate dashboard");
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
      fetchAvailableServices();
      fetchPurchasedServices();
      fetchRequests();
    };

    initializeDashboard();
  }, []);

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
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showServiceModal &&
        !(event.target as Element).closest(".service-modal")
      ) {
        setShowServiceModal(false);
        setSelectedPurchasedService(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showServiceModal]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showAvailableServiceModal &&
        !(event.target as Element).closest(".available-service-modal")
      ) {
        setShowAvailableServiceModal(false);
        setSelectedAvailableService(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAvailableServiceModal]);

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
      if (!clientId) {
        console.log("❌ No client ID found in localStorage");
        return;
      }

      const response = await fetch(
        `/api/clients/purchased-services?clientId=${clientId}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log(
          "📦 Received purchased services data:",
          data.purchasedServices
        );
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
      const clientId = localStorage.getItem("userId");
      if (!clientId) {
        console.error("No client ID found");
        return;
      }

      const response = await fetch(
        `/api/signature-requests/client?clientId=${clientId}`
      );

      if (response.ok) {
        const data = await response.json();
        // The API returns { signatureRequests: [...] }, so extract the array
        setRequests(data.signatureRequests || []);
      } else {
        // Don't show error for empty requests - this is normal for new clients
        console.log("No signature requests found (normal for new clients)");
        setRequests([]);
      }
    } catch (error) {
      // Don't show error for network issues when there are no requests
      console.log("Network error fetching requests (normal for new clients)");
      setRequests([]);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  const handlePurchaseService = async (service: Service) => {
    try {
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
        console.log("✅ Invoice created successfully:", data);

        setPaymentData({
          paymentRequest: data.purchase.invoice.paymentRequest,
          paymentHash: data.purchase.invoice.paymentHash,
          amount: data.purchase.invoice.amount,
          description: data.purchase.invoice.description,
          expiresAt: data.purchase.invoice.expiresAt,
        });
        setCurrentService(service);
        setShowPaymentModal(true);
        fetchAvailableServices();
      } else {
        const error = await response.json();
        console.error("❌ Purchase failed:", error);
        alert(`Purchase failed: ${error.error}`);
      }
    } catch (error) {
      console.error("Purchase error:", error);
      alert("Failed to purchase service. Please try again.");
    }
  };

  const handleViewServiceDetails = (service: Service) => {
    setSelectedAvailableService(service);
    setShowAvailableServiceModal(true);
  };

  const handleClosePaymentModal = async () => {
    if (paymentData) {
      try {
        console.log(
          "🛑 Cancelling pending purchase for hash:",
          paymentData.paymentHash
        );

        const response = await fetch("/api/services/cancel-purchase", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentHash: paymentData.paymentHash,
          }),
        });

        if (response.ok) {
          console.log("✅ Purchase cancelled successfully");
        } else {
          console.error("❌ Failed to cancel purchase:", response.status);
          const errorData = await response.json();
          console.error("Cancel error details:", errorData);
        }
      } catch (error) {
        console.error("❌ Error cancelling purchase:", error);
      }
    }

    setShowPaymentModal(false);
    setPaymentData(null);
    setCurrentService(null);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    let attempts = 0;
    const maxAttempts = 100;

    if (showPaymentModal && paymentData) {
      console.log("🔄 Starting payment confirmation polling...");

      interval = setInterval(async () => {
        attempts++;

        if (attempts > maxAttempts) {
          console.log("⏰ Payment confirmation timeout - stopping polling");
          setShowPaymentModal(false);
          setPaymentData(null);
          setCurrentService(null);
          alert(
            "Payment confirmation timeout. Please try again or contact support."
          );
          return;
        }

        try {
          const response = await fetch("/api/services/confirm-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              paymentHash: paymentData.paymentHash,
            }),
          });

          if (response.ok) {
            const data = await response.json();

            if (data.confirmed) {
              setShowPaymentModal(false);
              setPaymentData(null);
              setCurrentService(null);
              fetchAvailableServices();
              fetchPurchasedServices();
            }
          } else {
            console.error(
              "❌ Payment confirmation API error:",
              response.status
            );
          }
        } catch (error) {
          console.error("❌ Failed to check payment status:", error);
        }
      }, 3000);
    }

    return () => {
      if (interval) {
        console.log("🛑 Stopping payment confirmation polling...");
        clearInterval(interval);
      }
    };
  }, [showPaymentModal, paymentData]);

  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
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
      case "REQUESTED":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200";
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

  const truncateXpub = (xpub: string) => {
    if (xpub.length <= 12) return xpub;
    return `${xpub.substring(0, 8)}...${xpub.substring(xpub.length - 4)}`;
  };

  const toggleXpubVisibility = (serviceId: string) => {
    const newVisibleXpubs = new Set(visibleXpubs);
    if (newVisibleXpubs.has(serviceId)) {
      newVisibleXpubs.delete(serviceId);
    } else {
      newVisibleXpubs.add(serviceId);
    }
    setVisibleXpubs(newVisibleXpubs);
  };

  const copyXpubToClipboard = async (xpub: string, serviceId: string) => {
    try {
      await navigator.clipboard.writeText(xpub);
      setCopiedXpubs((prev) => new Set([...prev, serviceId]));
      setTimeout(() => {
        setCopiedXpubs((prev) => {
          const newSet = new Set(prev);
          newSet.delete(serviceId);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      console.error("Failed to copy xpub:", error);
    }
  };

  const handleViewSignatureRequestDetails = (request: any) => {
    setSelectedSignatureRequest(request);
    setShowSignatureRequestDetailsModal(true);
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
                ? `${capitalizeFirstLetter(username)} Client Dashboard`
                : "Client Dashboard"}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Browse signing services and manage your signature requests
            </p>
          </div>

          {/* Settings Menu */}
          <div className="relative settings-menu">
            <div className="flex items-center space-x-2">
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
            </div>

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
                      handleViewServiceDetails(service);
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
                  <div
                    key={service.id}
                    className="px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => {
                      setSelectedPurchasedService(service);
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
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                          Active
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
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Your Signature Requests ({requests.length})
            </h2>
            <Button
              onClick={() => setShowSignatureRequestModal(true)}
              variant="primary"
              size="sm"
            >
              Request Signature
            </Button>
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
                <p className="mt-1 text-sm">
                  Click "Request Signature" to get started
                </p>
              </div>
            ) : (
              requests.map((request) => (
                <div
                  key={request.id}
                  className="px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleViewSignatureRequestDetails(request)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {request.providerName} - {request.policyType}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Fee: {formatNumberWithCommas(request.signatureFee || 0)}{" "}
                        sats
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Created: {formatDate(request.createdAt)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Unlocks: {formatDate(request.unlocksAt)}
                      </p>
                      {request.signedAt && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Signed: {formatDate(request.signedAt)}
                        </p>
                      )}
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

        {/* Payment Modal */}
        {showPaymentModal && currentService && paymentData && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={handleClosePaymentModal}
            paymentRequest={paymentData.paymentRequest}
            amount={paymentData.amount}
            providerName={currentService.providerName}
            description={paymentData.description}
            expiresAt={paymentData.expiresAt}
          />
        )}

        {/* Signature Request Modal */}
        <SignatureRequestModal
          isOpen={showSignatureRequestModal}
          onClose={async () => {
            setShowSignatureRequestModal(false);
            // Refresh signature requests list when modal closes
            await fetchRequests();
          }}
          purchasedServices={purchasedServices}
          clientId={localStorage.getItem("userId") || ""}
        />

        {/* Service Details Modal */}
        {showServiceModal && selectedPurchasedService && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto service-modal">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Service Details
                </h3>
                <button
                  onClick={() => {
                    setShowServiceModal(false);
                    setSelectedPurchasedService(null);
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
                      value={selectedPurchasedService.providerName}
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
                      value={selectedPurchasedService.policyType}
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
                      value={selectedPurchasedService.initialBackupFee.toLocaleString()}
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
                      value={selectedPurchasedService.perSignatureFee.toLocaleString()}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  {selectedPurchasedService.monthlyFee && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Monthly Fee (sats)
                      </label>
                      <input
                        type="text"
                        value={selectedPurchasedService.monthlyFee.toLocaleString()}
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
                      value={Math.floor(
                        selectedPurchasedService.minTimeDelay / 24
                      )}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Purchased
                    </label>
                    <input
                      type="text"
                      value={formatDate(selectedPurchasedService.purchasedAt)}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Master Fingerprint
                    </label>
                    <input
                      type="text"
                      value={
                        selectedPurchasedService.masterFingerprint ||
                        "Not provided"
                      }
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    {/* Debug info */}
                    <p className="text-xs text-gray-500 mt-1">
                      Debug:{" "}
                      {selectedPurchasedService.masterFingerprint
                        ? "Has data"
                        : "No data"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Derivation Path
                    </label>
                    <input
                      type="text"
                      value={
                        selectedPurchasedService.derivationPath ||
                        "Not provided"
                      }
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  {selectedPurchasedService.expiresAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Expires
                      </label>
                      <input
                        type="text"
                        value={formatDate(selectedPurchasedService.expiresAt)}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <input
                      type="text"
                      value={
                        selectedPurchasedService.isActive
                          ? "Active"
                          : "Inactive"
                      }
                      readOnly
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white ${
                        selectedPurchasedService.isActive
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Extended Public Key (xpub)
                  </label>
                  <div className="relative">
                    <textarea
                      value={
                        visibleXpubs.has(selectedPurchasedService.id)
                          ? selectedPurchasedService.xpubKey
                          : truncateXpub(selectedPurchasedService.xpubKey)
                      }
                      readOnly
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm pr-20"
                    />
                    <div className="absolute top-2 right-2 flex space-x-1">
                      <button
                        onClick={() =>
                          toggleXpubVisibility(selectedPurchasedService.id)
                        }
                        className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        title={
                          visibleXpubs.has(selectedPurchasedService.id)
                            ? "Hide full xpub"
                            : "Show full xpub"
                        }
                      >
                        {visibleXpubs.has(selectedPurchasedService.id) ? (
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
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
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
                      <button
                        onClick={() =>
                          copyXpubToClipboard(
                            selectedPurchasedService.xpubKey,
                            selectedPurchasedService.id
                          )
                        }
                        className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        title="Copy xpub to clipboard"
                      >
                        {copiedXpubs.has(selectedPurchasedService.id) ? (
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
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {selectedPurchasedService.paymentHash && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Payment Hash
                    </label>
                    <textarea
                      value={selectedPurchasedService.paymentHash}
                      readOnly
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Available Service Details Modal */}
        {showAvailableServiceModal && selectedAvailableService && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto available-service-modal">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Service Details
                </h3>
                <button
                  onClick={() => {
                    setShowAvailableServiceModal(false);
                    setSelectedAvailableService(null);
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
                      value={selectedAvailableService.providerName}
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
                      value={selectedAvailableService.policyType}
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
                      value={selectedAvailableService.initialBackupFee.toLocaleString()}
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
                      value={selectedAvailableService.perSignatureFee.toLocaleString()}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  {selectedAvailableService.monthlyFee && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Monthly Fee (sats)
                      </label>
                      <input
                        type="text"
                        value={selectedAvailableService.monthlyFee.toLocaleString()}
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
                      value={Math.floor(
                        selectedAvailableService.minTimeDelay / 24
                      )}
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
                      value={formatDate(selectedAvailableService.createdAt)}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowAvailableServiceModal(false);
                      setSelectedAvailableService(null);
                    }}
                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowAvailableServiceModal(false);
                      setSelectedAvailableService(null);
                      handlePurchaseService(selectedAvailableService);
                    }}
                    className="px-4 py-2 bg-[#FF9500] text-black font-medium rounded hover:bg-[#FF9500]/90 transition-colors"
                  >
                    Purchase Service
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Signature Request Details Modal */}
        {showSignatureRequestDetailsModal && selectedSignatureRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Signature Request Details
                </h3>
                <button
                  onClick={() => {
                    setShowSignatureRequestDetailsModal(false);
                    setSelectedSignatureRequest(null);
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
                      value={selectedSignatureRequest.providerName}
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
                      value={selectedSignatureRequest.policyType}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <input
                      type="text"
                      value={selectedSignatureRequest.status}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Signature Fee (sats)
                    </label>
                    <input
                      type="text"
                      value={formatNumberWithCommas(
                        selectedSignatureRequest.signatureFee || 0
                      )}
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
                      value={formatDate(selectedSignatureRequest.createdAt)}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Unlocks At
                    </label>
                    <input
                      type="text"
                      value={formatDate(selectedSignatureRequest.unlocksAt)}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  {selectedSignatureRequest.signedAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Signed At
                      </label>
                      <input
                        type="text"
                        value={formatDate(selectedSignatureRequest.signedAt)}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  )}

                  {selectedSignatureRequest.psbtHash && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        PSBT Hash
                      </label>
                      <input
                        type="text"
                        value={selectedSignatureRequest.psbtHash}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-xs"
                      />
                    </div>
                  )}
                </div>

                {selectedSignatureRequest.signedPsbtData && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Signed PSBT (Base64)
                    </label>
                    <textarea
                      value={selectedSignatureRequest.signedPsbtData}
                      readOnly
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-xs font-mono"
                    />
                    {selectedSignatureRequest.status === "SIGNED" && (
                      <div className="mt-3">
                        <Button
                          onClick={() => {
                            // Create a blob with the PSBT data and download it
                            const blob = new Blob(
                              [selectedSignatureRequest.signedPsbtData],
                              { type: "application/octet-stream" }
                            );
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `signed-psbt-${selectedSignatureRequest.id}.psbt`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          }}
                          variant="primary"
                          size="sm"
                        >
                          Download Signed PSBT
                        </Button>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Download the signed PSBT to add your signature and
                          broadcast the transaction
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
