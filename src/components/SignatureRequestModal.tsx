"use client";

import { useState, useEffect, useRef } from "react";
import PaymentModal from "@/components/PaymentModal";
import Button from "@/components/Button";

interface PurchasedService {
  id: string;
  serviceId: string;
  providerName: string;
  policyType: string;
  perSignatureFee: number;
  isActive: boolean;
  masterFingerprint?: string;
  derivationPath?: string;
}

interface SignatureRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchasedServices: PurchasedService[];
  clientId: string;
}

interface PaymentData {
  paymentRequest: string;
  paymentHash: string;
  amount: number;
  description: string;
  expiresAt: string;
}

export default function SignatureRequestModal({
  isOpen,
  onClose,
  purchasedServices,
  clientId,
}: SignatureRequestModalProps) {
  const [step, setStep] = useState<"payment" | "upload">("payment");

  // Debug step changes
  useEffect(() => {
    console.log(`🔄 Step changed to: ${step}`);
  }, [step]);
  const [selectedService, setSelectedService] =
    useState<PurchasedService | null>(null);
  const [psbtFile, setPsbtFile] = useState<File | null>(null);
  const [psbtData, setPsbtData] = useState<string>("");
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [psbtValidationStatus, setPsbtValidationStatus] = useState<
    "idle" | "validating" | "valid" | "invalid"
  >("idle");
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePaymentRequest = async (service: PurchasedService) => {
    try {
      console.log("🚀 Starting payment request for service:", service.id);
      setLoading(true);
      // Create payment request for signature fee using provider's actual fee
      const response = await fetch("/api/signature-requests/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId,
          serviceId: service.serviceId,
          amount: service.perSignatureFee, // Use provider's actual fee
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create payment request");
      }

      const paymentData = await response.json();
      console.log("✅ Payment data received:", paymentData);
      setPaymentData(paymentData);
      setShowPaymentModal(true);
      console.log("🎯 Payment modal should now be visible");
    } catch (err) {
      console.error("❌ Payment request failed:", err);
      setError("Failed to create payment request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-select service if only one purchased service
  useEffect(() => {
    console.log("🔍 Auto-select effect triggered:", {
      isOpen,
      purchasedServicesLength: purchasedServices.length,
    });
    if (
      isOpen &&
      purchasedServices.length === 1 &&
      purchasedServices[0].isActive
    ) {
      console.log("✅ Auto-selecting service:", purchasedServices[0].id);
      setSelectedService(purchasedServices[0]);
      // Auto-start payment for single service
      setTimeout(() => {
        console.log("🚀 Auto-triggering payment request");
        handlePaymentRequest(purchasedServices[0]);
      }, 500); // Increased delay to ensure state is set
    }
  }, [isOpen, purchasedServices]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setStep("payment");
      setSelectedService(null);
      setPsbtFile(null);
      setPsbtData("");
      setPaymentData(null);
      setShowPaymentModal(false);
      setError("");
    }
  }, [isOpen]);

  // Auto-verify payment when payment modal is open (same pattern as service purchase)
  useEffect(() => {
    let interval: any;
    let attempts = 0;
    const maxAttempts = 100; // 5 minutes max (100 * 3 seconds)

    if (showPaymentModal && paymentData) {
      console.log(
        "🔄 Starting payment confirmation polling for signature request..."
      );

      interval = setInterval(async () => {
        attempts++;

        if (attempts > maxAttempts) {
          console.log("⏰ Payment confirmation timeout - stopping polling");
          setShowPaymentModal(false);
          setPaymentData(null);
          alert(
            "Payment confirmation timeout. Please try again or contact support."
          );
          return;
        }

        try {
          const response = await fetch(
            "/api/signature-requests/confirm-payment",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                paymentHash: paymentData.paymentHash,
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            console.log("🔍 Payment verification response:", data);

            if (data.confirmed) {
              console.log("✅ Payment confirmed, transitioning to upload step");
              setShowPaymentModal(false);
              // Don't clear paymentData - we need the paymentHash for the create request
              setStep("upload");
              setError("");
              return; // Stop checking once confirmed
            } else {
              console.log("⏳ Payment not yet confirmed");
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
      }, 3000); // Check every 3 seconds like service purchase
    }

    return () => {
      if (interval) {
        console.log("🛑 Stopping payment confirmation polling...");
        clearInterval(interval);
      }
    };
  }, [showPaymentModal, paymentData, clientId, selectedService?.serviceId]);

  const handleRemoveFile = () => {
    setPsbtFile(null);
    setPsbtData("");
    setError("");
    setPsbtValidationStatus("idle");
    // Clear the file input so user can upload the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!file.name.endsWith(".psbt")) {
      setError("Please upload a .psbt file");
      setPsbtValidationStatus("invalid");
      return;
    }

    // Validate file size (max 10KB for PSBTs - they're typically very small)
    if (file.size > 10 * 1024) {
      setError("PSBT file must be less than 10KB");
      setPsbtValidationStatus("invalid");
      return;
    }

    setPsbtFile(file);
    setError("");
    setPsbtValidationStatus("validating");

    // Read file as base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      // Remove data URL prefix if present
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      setPsbtData(base64);

      // Immediately validate the PSBT for signatures
      try {
        const response = await fetch("/api/signature-requests/validate-psbt", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            psbtData: base64,
          }),
        });

        const validationResult = await response.json();

        if (!response.ok) {
          setError(validationResult.error || "Invalid PSBT file");
          setPsbtFile(null);
          setPsbtData("");
          setPsbtValidationStatus("invalid");
        } else {
          setError(""); // Clear any previous errors
          console.log("✅ PSBT validation passed");
          setPsbtValidationStatus("valid");
        }
      } catch (err) {
        console.error("❌ Error validating PSBT:", err);
        setError("Failed to validate PSBT file");
        setPsbtFile(null);
        setPsbtData("");
        setPsbtValidationStatus("invalid");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleSubmitRequest = async () => {
    if (!selectedService || !psbtData) {
      setError("Please select a service and upload a PSBT file");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Submit signature request
      const response = await fetch("/api/signature-requests/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId,
          serviceId: selectedService.serviceId,
          psbtData,
          paymentHash: paymentData?.paymentHash || "mock_payment_hash",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to submit signature request"
        );
      }

      const result = await response.json();
      console.log("✅ Signature request submitted:", result);

      // Show success state
      setSuccess(true);

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error("❌ Error submitting signature request:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to submit signature request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {!showPaymentModal && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Request Signature
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
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

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === "payment"
                      ? "bg-orange-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  1
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${
                    step === "payment"
                      ? "text-orange-600 dark:text-orange-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  Pay Fee
                </span>
              </div>
              <div className="flex-1 mx-4 h-0.5 bg-gray-200 dark:bg-gray-700"></div>
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === "upload"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  2
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${
                    step === "upload"
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  Add PSBT
                </span>
              </div>
            </div>
          </div>

          {step === "payment" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Select Service & Pay Fee
              </h3>
              <div className="space-y-4">
                {purchasedServices.map((service) => (
                  <div
                    key={service.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedService?.id === service.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                    }`}
                    onClick={() => setSelectedService(service)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {service.providerName}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {service.policyType} • {service.perSignatureFee} sats
                          per signature
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-4 h-4 rounded-full border-2 ${
                            selectedService?.id === service.id
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                        >
                          {selectedService?.id === service.id && (
                            <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedService && (
                <div className="mt-6">
                  <Button
                    onClick={() => handlePaymentRequest(selectedService)}
                    variant="primary"
                    size="md"
                    loading={loading}
                    className="w-full"
                  >
                    Pay {selectedService.perSignatureFee} sats & Continue
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === "upload" && selectedService && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Upload PSBT File
              </h3>

              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Selected Service
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Provider:</strong> {selectedService.providerName}
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Policy:</strong> {selectedService.policyType}
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Fee:</strong> {selectedService.perSignatureFee} sats
                  per signature
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  PSBT File
                </label>
                {!psbtFile ? (
                  <div
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const files = e.dataTransfer.files;
                      if (files.length > 0) {
                        const file = files[0];
                        handleFileSelect(file);
                      }
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".psbt"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="psbt-upload"
                    />
                    <label
                      htmlFor="psbt-upload"
                      className="cursor-pointer block"
                    >
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                          Click to upload
                        </span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        PSBT files only, max 10KB
                      </p>
                    </label>
                  </div>
                ) : (
                  <div
                    className={`border rounded-md p-4 ${
                      psbtValidationStatus === "validating"
                        ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                        : psbtValidationStatus === "valid"
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                        : psbtValidationStatus === "invalid"
                        ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                        : "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {psbtValidationStatus === "validating" ? (
                          <svg
                            className="h-5 w-5 text-yellow-500 mr-2 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                        ) : psbtValidationStatus === "valid" ? (
                          <svg
                            className="h-5 w-5 text-green-500 mr-2"
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
                        ) : psbtValidationStatus === "invalid" ? (
                          <svg
                            className="h-5 w-5 text-red-500 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="h-5 w-5 text-gray-400 mr-2"
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
                        )}
                        <div>
                          <p
                            className={`text-sm font-medium ${
                              psbtValidationStatus === "validating"
                                ? "text-yellow-800 dark:text-yellow-200"
                                : psbtValidationStatus === "valid"
                                ? "text-green-800 dark:text-green-200"
                                : psbtValidationStatus === "invalid"
                                ? "text-red-800 dark:text-red-200"
                                : "text-gray-800 dark:text-gray-200"
                            }`}
                          >
                            {psbtFile.name}
                          </p>
                          <p
                            className={`text-xs ${
                              psbtValidationStatus === "validating"
                                ? "text-yellow-600 dark:text-yellow-300"
                                : psbtValidationStatus === "valid"
                                ? "text-green-600 dark:text-green-300"
                                : psbtValidationStatus === "invalid"
                                ? "text-red-600 dark:text-red-300"
                                : "text-gray-600 dark:text-gray-300"
                            }`}
                          >
                            Size: {(psbtFile.size / 1024).toFixed(1)} KB
                            {psbtValidationStatus === "validating" &&
                              " - Validating..."}
                            {psbtValidationStatus === "valid" &&
                              " - Valid PSBT"}
                            {psbtValidationStatus === "invalid" &&
                              " - Invalid PSBT"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile();
                        }}
                        className="text-red-500 hover:text-red-700 dark:hover:text-red-300"
                        title="Remove file"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
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
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mt-4">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      {error}
                    </p>
                  </div>
                )}

                {success ? (
                  <div className="flex items-center justify-center mt-6">
                    <div className="text-center">
                      <svg
                        className="h-12 w-12 text-green-500 mx-auto mb-4"
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
                      <p className="text-lg font-medium text-green-800 dark:text-green-200">
                        Signature Request Submitted!
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-300">
                        Your request has been sent to the provider.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between mt-6">
                    <Button
                      onClick={() => setStep("payment")}
                      variant="secondary"
                      size="md"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleSubmitRequest}
                      variant="primary"
                      size="md"
                      loading={loading}
                      disabled={
                        !psbtFile ||
                        loading ||
                        !!error ||
                        psbtValidationStatus === "validating" ||
                        psbtValidationStatus === "invalid"
                      }
                    >
                      Submit Request
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && paymentData && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            console.log("🛑 User closed payment modal");
            setShowPaymentModal(false);
            setPaymentData(null);
            // Don't close the entire modal - just close payment modal
          }}
          paymentRequest={paymentData.paymentRequest}
          amount={paymentData.amount}
          providerName={selectedService?.providerName || "Signature Request"}
          description={paymentData.description}
          expiresAt={paymentData.expiresAt}
        />
      )}
    </div>
  );
}
