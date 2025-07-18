"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface SignatureRequest {
  id: string;
  createdAt: string;
  unsignedPsbt: string;
  unlocksAt: string;
  clientUsername: string;
  servicePolicyType: string;
  perSignatureFee: string;
}

export default function ProviderDashboard() {
  const [requests, setRequests] = useState<SignatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRequest, setSelectedRequest] =
    useState<SignatureRequest | null>(null);
  const [signedPsbt, setSignedPsbt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // For now, redirect to login since we don't have auth state management
    router.push("/login");
  }, [router]);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isUnlocked = (unlocksAt: string) => {
    return new Date(unlocksAt) <= new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading signature requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Provider Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your signature requests and sign PSBTs
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
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
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Signature Requests List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Pending Signature Requests ({requests.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {requests.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="mt-2">No pending signature requests</p>
                </div>
              ) : (
                requests.map((request) => (
                  <div
                    key={request.id}
                    className={`px-6 py-4 cursor-pointer hover:bg-gray-50 ${
                      selectedRequest?.id === request.id ? "bg-blue-50" : ""
                    }`}
                    onClick={() => setSelectedRequest(request)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Client: {request.clientUsername}
                        </p>
                        <p className="text-sm text-gray-500">
                          Policy: {request.servicePolicyType}
                        </p>
                        <p className="text-sm text-gray-500">
                          Fee: {request.perSignatureFee} sats
                        </p>
                        <p className="text-sm text-gray-500">
                          Created: {formatDate(request.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isUnlocked(request.unlocksAt)
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {isUnlocked(request.unlocksAt)
                            ? "Unlocked"
                            : "Locked"}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
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
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Sign PSBT</h2>
            </div>
            <div className="px-6 py-4">
              {selectedRequest ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selected Request
                    </label>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm">
                        <strong>Client:</strong>{" "}
                        {selectedRequest.clientUsername}
                      </p>
                      <p className="text-sm">
                        <strong>Policy:</strong>{" "}
                        {selectedRequest.servicePolicyType}
                      </p>
                      <p className="text-sm">
                        <strong>Fee:</strong> {selectedRequest.perSignatureFee}{" "}
                        sats
                      </p>
                      <p className="text-sm">
                        <strong>Status:</strong>{" "}
                        <span
                          className={
                            isUnlocked(selectedRequest.unlocksAt)
                              ? "text-green-600"
                              : "text-yellow-600"
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
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
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
                          <p className="text-sm text-yellow-800">
                            This request is still locked. You cannot sign it
                            until {formatDate(selectedRequest.unlocksAt)}.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Signed PSBT (Base64)
                    </label>
                    <textarea
                      value={signedPsbt}
                      onChange={(e) => setSignedPsbt(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      rows={6}
                      placeholder="Paste the signed PSBT here..."
                      disabled={!isUnlocked(selectedRequest.unlocksAt)}
                    />
                  </div>

                  <button
                    onClick={handleSignRequest}
                    disabled={
                      !isUnlocked(selectedRequest.unlocksAt) || submitting
                    }
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Submitting..." : "Submit Signed PSBT"}
                  </button>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
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
