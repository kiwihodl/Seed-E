"use client";

import { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import Button from "@/components/Button";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentRequest: string;
  amount: number;
  providerName: string;
  description: string;
  expiresAt: string;
}

export default function PaymentModal({
  isOpen,
  onClose,
  paymentRequest,
  amount,
  providerName,
  description,
  expiresAt,
}: PaymentModalProps) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // Calculate time left
  useEffect(() => {
    if (!isOpen) return;

    const updateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeLeft(remaining);
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [isOpen, expiresAt]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(paymentRequest);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Pay {providerName}
          </h3>
          <button
            onClick={onClose}
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
          {/* Amount and Description */}
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {amount.toLocaleString()} sats
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {description}
            </p>
          </div>

          {/* Timer */}
          <div className="text-center">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Time remaining
            </div>
            <div className="text-lg font-mono text-red-600 dark:text-red-400">
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg border">
              <QRCodeCanvas
                value={paymentRequest}
                size={200}
                level="M"
                includeMargin={true}
              />
            </div>
          </div>

          {/* Payment Request */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Lightning Invoice
            </label>
            <div className="relative">
              <textarea
                value={paymentRequest}
                readOnly
                rows={3}
                className="w-full px-3 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm resize-none"
              />
              <button
                onClick={copyToClipboard}
                className="absolute right-2 top-2 p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                title="Copy to clipboard"
              >
                {copied ? (
                  <svg
                    className="w-5 h-5 text-green-500"
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
                    className="w-5 h-5"
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
            {copied && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Copied to clipboard!
              </p>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              How to pay:
            </h4>
            <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>1. Scan the QR code with your Lightning wallet</li>
              <li>2. Or copy the invoice and paste it in your wallet</li>
              <li>3. Confirm the payment in your wallet</li>
              <li>4. Wait for payment confirmation</li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button onClick={onClose} variant="secondary" size="md" fullWidth>
              Close
            </Button>
            <Button
              onClick={copyToClipboard}
              variant="primary"
              size="md"
              fullWidth
            >
              Copy Invoice
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
