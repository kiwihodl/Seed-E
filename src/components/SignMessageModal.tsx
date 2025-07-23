import React, { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import * as bitcoinJS from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";

interface SignMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignatureReceived: (signature: string) => void;
  xpub: string;
  derivationPath: string;
  message?: string;
}

type MediumType = "QR" | "USB" | "NFC";
type StepType = "medium" | "qr" | "signature";

export default function SignMessageModal({
  isOpen,
  onClose,
  onSignatureReceived,
  xpub,
  derivationPath,
  message = "Seed-E",
}: SignMessageModalProps) {
  const [qrData, setQrData] = useState<string>("");
  const [signature, setSignature] = useState<string>("");
  const [step, setStep] = useState<StepType>("medium");
  const [selectedMedium, setSelectedMedium] = useState<MediumType | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [qrFormat, setQrFormat] = useState<number>(0);
  const [qrSize, setQrSize] = useState<number>(200);

  useEffect(() => {
    // Check for dark mode
    const isDark = document.documentElement.classList.contains("dark");
    setIsDarkMode(isDark);
  }, []);

  useEffect(() => {
    if (isOpen && step === "qr" && selectedMedium === "QR") {
      generateSignMessageData();
    }
  }, [isOpen, step, selectedMedium, qrFormat]);

  const generateSignMessageData = async () => {
    try {
      // Create a message signing format compatible with SeedSigner v0.7.0+
      // SeedSigner expects a simple text message that it can sign
      const signMessageData = createSeedSignerMessageFormat(message);
      setQrData(signMessageData);
    } catch (error) {
      console.error("Error generating sign message data:", error);
      // Fallback to simple message
      setQrData(message);
    }
  };

  const createSeedSignerMessageFormat = (msg: string): string => {
    // Try different formats that SeedSigner v0.7.0+ might recognize
    switch (qrFormat) {
      case 0:
        // Format 1: Simple text message (most likely to work)
        return msg;
      case 1:
        // Format 2: Bitcoin Keeper style format with prefix
        return `signmessage:${msg}`;
      case 2:
        // Format 3: JSON with message type
        const messageData = {
          type: "sign_message",
          message: msg,
          network: "bitcoin",
          format: "legacy",
        };
        return JSON.stringify(messageData);
      case 3:
        // Format 4: UR (Uniform Resource) format
        return `ur:bytes/${Buffer.from(msg).toString("hex")}`;
      default:
        return msg;
    }
  };

  const cycleQrFormat = () => {
    setQrFormat((prev) => (prev + 1) % 4);
  };

  const toggleQrSize = () => {
    setQrSize(qrSize === 200 ? 300 : 200);
  };

  const handleMediumSelection = (medium: MediumType) => {
    setSelectedMedium(medium);
    if (medium === "QR") {
      setStep("qr");
    } else {
      // For USB/NFC, we'd implement file transfer or NFC communication
      // For now, just show a message
      alert(`${medium} functionality not yet implemented`);
    }
  };

  const handleSignatureSubmit = () => {
    if (signature.trim()) {
      onSignatureReceived(signature);
      setSignature("");
      setStep("medium");
      setSelectedMedium(null);
      onClose();
    }
  };

  const handleClose = () => {
    setSignature("");
    setStep("medium");
    setSelectedMedium(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Sign Message with SeedSigner
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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

        {step === "medium" && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Choose how to send the message to SeedSigner:
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleMediumSelection("QR")}
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3"
              >
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z"
                  />
                </svg>
                <span className="text-gray-900 dark:text-white font-medium">
                  QR Code
                </span>
              </button>

              <button
                onClick={() => handleMediumSelection("USB")}
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3"
              >
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-gray-900 dark:text-white font-medium">
                  USB
                </span>
              </button>

              <button
                onClick={() => handleMediumSelection("NFC")}
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3"
              >
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span className="text-gray-900 dark:text-white font-medium">
                  NFC
                </span>
              </button>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {step === "qr" && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Scan this QR code with SeedSigner to sign the message:
              </p>

              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 dark:border-gray-600 inline-block">
                <QRCodeCanvas
                  value={qrData}
                  size={qrSize}
                  level="M"
                  fgColor={isDarkMode ? "#ffffff" : "#000000"}
                  bgColor={isDarkMode ? "#1f2937" : "#ffffff"}
                />
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Message: "{message}"
              </p>

              {/* Debug information */}
              <details className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                <summary className="cursor-pointer">Debug Info</summary>
                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-left">
                  <p>
                    <strong>QR Data:</strong> {qrData}
                  </p>
                  <p>
                    <strong>Length:</strong> {qrData.length} characters
                  </p>
                  <p>
                    <strong>Derivation Path:</strong> {derivationPath}
                  </p>
                  <p>
                    <strong>Format:</strong>{" "}
                    {qrFormat === 0
                      ? "Plain text"
                      : qrFormat === 1
                      ? "SignMessage prefix"
                      : qrFormat === 2
                      ? "JSON"
                      : "UR format"}
                  </p>
                </div>
              </details>

              {/* Format cycling button */}
              <button
                onClick={cycleQrFormat}
                className="mt-2 px-3 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Try Different Format (Current:{" "}
                {qrFormat === 0
                  ? "Plain"
                  : qrFormat === 1
                  ? "Prefix"
                  : qrFormat === 2
                  ? "JSON"
                  : "UR"}
                )
              </button>

              {/* QR Size toggle button */}
              <button
                onClick={toggleQrSize}
                className="mt-2 px-3 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Toggle QR Size (Current: {qrSize}px)
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>SeedSigner Instructions:</strong>
              </p>
              <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                <li>On SeedSigner: Tools → Message Sign</li>
                <li>Load message via QR code (scan the code above)</li>
                <li>Select your signing key and derivation path</li>
                <li>Choose address type (P2WSH for multisig)</li>
                <li>Sign the message</li>
                <li>Export signature as QR code or text file</li>
              </ol>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> Make sure to use the same derivation path
                ({derivationPath}) that corresponds to your xpub in the multisig
                setup.
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Troubleshooting:</strong> If SeedSigner doesn't
                recognize the QR code, try increasing the QR code size or check
                the debug info above.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setStep("signature")}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                I've Signed the Message
              </button>
              <button
                onClick={() => setStep("medium")}
                className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {step === "signature" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Paste the signature from SeedSigner:
              </label>
              <textarea
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={6}
                placeholder="Paste the Base64 signature here..."
              />
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Format:</strong> The signature should be in Base64
                format. If SeedSigner exported a text file, copy the signature
                line.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleSignatureSubmit}
                disabled={!signature.trim()}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Submit Signature
              </button>
              <button
                onClick={() => setStep("qr")}
                className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
