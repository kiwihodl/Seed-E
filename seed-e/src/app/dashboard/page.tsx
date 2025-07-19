"use client";

import { useState } from "react";
import SignatureRequestModal from "@/components/SignatureRequestModal";

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock data - in a real app, this would come from an API
  const mockService = {
    id: "1",
    providerName: "BitcoinSigningService",
    policyType: "P2TR",
    xpub: "xpub6C...",
    subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Client Dashboard
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-none p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Your Purchased Service
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Provider
              </label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {mockService.providerName}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Key Policy Type
              </label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {mockService.policyType}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Extended Public Key
              </label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white font-mono break-all">
                {mockService.xpub}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Subscription Expires
              </label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {mockService.subscriptionExpiresAt.toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-none p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Request Signature
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Submit a Partially Signed Bitcoin Transaction (PSBT) to request a
            signature from your provider.
          </p>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Request Signature
          </button>
        </div>
      </div>

      <SignatureRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
