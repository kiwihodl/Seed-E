import React, { useState } from "react";
import QRScanner from "./QRScanner";

interface ImportKeyModalProps {
  onClose: () => void;
  onImport?: (keyData: any) => void;
}

interface Device {
  name: string;
  type: "hardware" | "software";
  hasQR: boolean;
  hasUSB: boolean;
  hasFile: boolean;
  hasNFC: boolean;
}

const HARDWARE_DEVICES: Device[] = [
  {
    name: "BitBox02",
    type: "hardware",
    hasQR: false,
    hasUSB: true,
    hasFile: false,
    hasNFC: false,
  },
  {
    name: "ColdCard",
    type: "hardware",
    hasQR: true,
    hasUSB: true,
    hasFile: true,
    hasNFC: true,
  },
  {
    name: "Blockstream Jade",
    type: "hardware",
    hasQR: true,
    hasUSB: true,
    hasFile: false,
    hasNFC: false,
  },
  {
    name: "Keystone",
    type: "hardware",
    hasQR: true,
    hasUSB: false,
    hasFile: true,
    hasNFC: false,
  },
  {
    name: "Krux",
    type: "hardware",
    hasQR: true,
    hasUSB: false,
    hasFile: true,
    hasNFC: false,
  },
  {
    name: "Ledger",
    type: "hardware",
    hasQR: false,
    hasUSB: true,
    hasFile: false,
    hasNFC: false,
  },
  {
    name: "Foundation",
    type: "hardware",
    hasQR: true,
    hasUSB: false,
    hasFile: true,
    hasNFC: false,
  },
  {
    name: "TwentyTwo Portal",
    type: "hardware",
    hasQR: true,
    hasUSB: false,
    hasFile: true,
    hasNFC: false,
  },
  {
    name: "SeedSigner",
    type: "hardware",
    hasQR: true,
    hasUSB: false,
    hasFile: false,
    hasNFC: false,
  },
  {
    name: "Spectre Solutions",
    type: "hardware",
    hasQR: true,
    hasUSB: false,
    hasFile: false,
    hasNFC: false,
  },
  {
    name: "Tap Signer",
    type: "hardware",
    hasQR: true,
    hasUSB: false,
    hasFile: false,
    hasNFC: false,
  },
  {
    name: "Trezor",
    type: "hardware",
    hasQR: false,
    hasUSB: true,
    hasFile: false,
    hasNFC: false,
  },
];

const SOFTWARE_DEVICES: Device[] = [
  {
    name: "Blue Wallet",
    type: "software",
    hasQR: true,
    hasUSB: false,
    hasFile: false,
    hasNFC: false,
  },
  {
    name: "Software Wallet",
    type: "software",
    hasQR: false,
    hasUSB: false,
    hasFile: true,
    hasNFC: false,
  },
];

const ImportKeyModal: React.FC<ImportKeyModalProps> = ({
  onClose,
  onImport,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<
    "hardware" | "software" | null
  >(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);

  const handleCategorySelect = (category: "hardware" | "software") => {
    setSelectedCategory(category);
    setSelectedDevice(null);
    setSelectedMethod(null);
  };

  const handleDeviceSelect = (device: Device) => {
    setSelectedDevice(device);

    // Count available methods
    const methods = [];
    if (device.hasQR) methods.push("QR");
    if (device.hasUSB) methods.push("USB");
    if (device.hasFile) methods.push("File");
    if (device.hasNFC) methods.push("NFC");

    // If only one method, go directly to it
    if (methods.length === 1) {
      handleImportMethod(device, methods[0]);
    } else {
      setSelectedMethod(null);
    }
  };

  const getPrimaryMethod = (device: Device): string => {
    if (device.hasQR) return "QR";
    if (device.hasUSB) return "USB";
    if (device.hasFile) return "File";
    if (device.hasNFC) return "NFC";
    return "QR";
  };

  const handleImportMethod = (device: Device, method: string) => {
    setSelectedMethod(method);

    if (method === "QR") {
      setShowQRScanner(true);
    } else if (method === "File") {
      setShowFileUpload(true);
    } else {
      // USB, NFC, etc. - show coming soon message
      console.log(`Import method ${method} for ${device.name} coming soon`);
    }
  };

  const handleBackToDevices = () => {
    setSelectedDevice(null);
    setSelectedMethod(null);
    setShowQRScanner(false);
    setShowFileUpload(false);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedDevice(null);
    setSelectedMethod(null);
    setShowQRScanner(false);
    setShowFileUpload(false);
  };

  const handleQRScanComplete = (data: any) => {
    console.log("🔍 QR scan completed with data:", data);
    console.log("🔍 Data type:", data.type);
    console.log("🔍 Data content:", data.data);

    // Process the scanned data
    if (data.type === "xpub") {
      console.log("✅ Valid xpub detected:", data.data);
      // Direct xpub
      if (onImport) {
        const importData = {
          xpub: data.data,
          derivationPath: "", // Placeholder - will be extracted if available
          masterFingerprint: "", // Placeholder - will be extracted if available
        };
        console.log("🔍 Calling onImport with:", importData);
        onImport(importData);
      }
    } else if (data.type === "seedsigner") {
      console.log("✅ SeedSigner format detected:", data);
      // SeedSigner format with fingerprint and derivation path
      if (onImport) {
        const importData = {
          xpub: data.data,
          derivationPath: data.derivationPath || "",
          masterFingerprint: data.masterFingerprint || "",
        };
        console.log("🔍 Calling onImport with SeedSigner data:", importData);
        onImport(importData);
      }
    } else if (data.type === "ur") {
      console.log("🔄 UR encoded data detected:", data.data);
      // UR encoded data - needs processing
      console.log("UR encoded data detected, processing...");
      // TODO: Process UR data using decodeURBytes
      if (onImport) {
        const importData = {
          xpub: data.data,
          derivationPath: "", // Placeholder - will be extracted from UR data
          masterFingerprint: "", // Placeholder - will be extracted from UR data
        };
        console.log("🔍 Calling onImport with UR data:", importData);
        onImport(importData);
      }
    } else if (data.type === "bbqr") {
      console.log("🔄 BBQR encoded data detected:", data.data);
      // BBQR encoded data - needs processing
      console.log("BBQR encoded data detected, processing...");
      // TODO: Process BBQR data using joinQRs
      if (onImport) {
        const importData = {
          xpub: data.data,
          derivationPath: "", // Placeholder - will be extracted from BBQR data
          masterFingerprint: "", // Placeholder - will be extracted from BBQR data
        };
        console.log("🔍 Calling onImport with BBQR data:", importData);
        onImport(importData);
      }
    } else if (data.type === "unknown") {
      console.log("❓ Unknown QR format detected:", data.data);
      console.log("❓ Message:", data.message);

      // For now, let's still try to import it as a potential xpub
      if (onImport) {
        const importData = {
          xpub: data.data,
          derivationPath: "", // Placeholder
          masterFingerprint: "", // Placeholder
        };
        console.log("🔍 Calling onImport with unknown data:", importData);
        onImport(importData);
      }
    } else {
      console.log("❌ Unknown data type:", data);
    }

    // Close QR scanner
    console.log("🔍 Closing QR scanner and modal");
    setShowQRScanner(false);
    setSelectedMethod(null);
  };

  const renderDeviceList = () => {
    const devices =
      selectedCategory === "hardware" ? HARDWARE_DEVICES : SOFTWARE_DEVICES;

    return (
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 gap-3">
          {devices.map((device, index) => (
            <div
              key={index}
              onClick={() => handleDeviceSelect(device)}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 dark:text-gray-300 text-sm">
                    🔑
                  </span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {device.name}
                </span>
              </div>
              <span className="text-gray-400 dark:text-gray-500">→</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMethodSelection = () => {
    if (!selectedDevice) return null;

    const methods = [];
    if (selectedDevice.hasQR) methods.push("QR");
    if (selectedDevice.hasUSB) methods.push("USB");
    if (selectedDevice.hasFile) methods.push("File");
    if (selectedDevice.hasNFC) methods.push("NFC");

    return (
      <div className="px-6 py-4">
        <div className="grid grid-cols-2 gap-3">
          {methods.map((method) => (
            <button
              key={method}
              onClick={() => handleImportMethod(selectedDevice, method)}
              className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-center transition-colors"
            >
              <div className="text-2xl mb-2">
                {method === "QR" && "📱"}
                {method === "USB" && "🔌"}
                {method === "File" && "📁"}
                {method === "NFC" && "📡"}
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {method}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderQRScanner = () => {
    if (!showQRScanner) return null;

    return (
      <div className="px-6 py-4">
        <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
          <QRScanner
            onScanCompleted={handleQRScanComplete}
            hideCamera={false}
          />
        </div>

        <div className="text-center mt-4">
          <button
            onClick={() => setShowQRScanner(false)}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  const renderFileUpload = () => {
    if (!showFileUpload) return null;

    return (
      <div className="px-6 py-4">
        <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
          <QRScanner onScanCompleted={handleQRScanComplete} hideCamera={true} />
        </div>

        <div className="text-center mt-4">
          <button
            onClick={() => setShowFileUpload(false)}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  const renderMainContent = () => {
    if (showQRScanner) {
      return renderQRScanner();
    } else if (showFileUpload) {
      return renderFileUpload();
    } else if (selectedMethod) {
      return renderMethodSelection();
    } else if (selectedDevice) {
      return renderMethodSelection();
    } else if (selectedCategory) {
      return renderDeviceList();
    } else {
      return (
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => handleCategorySelect("hardware")}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-300 text-sm">
                    🔧
                  </span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  Hardware Key
                </span>
              </div>
              <span className="text-gray-400 dark:text-gray-500">→</span>
            </button>

            <button
              onClick={() => handleCategorySelect("software")}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-300 text-sm">
                    💻
                  </span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  Software Key
                </span>
              </div>
              <span className="text-gray-400 dark:text-gray-500">→</span>
            </button>
          </div>
        </div>
      );
    }
  };

  const getHeaderTitle = () => {
    if (showQRScanner) return "Scan QR Code";
    if (showFileUpload) return "Upload File";
    if (selectedDevice) return `Add your ${selectedDevice.name}`;
    if (selectedCategory) return "Import Key";
    return "Import Key";
  };

  const showBackButton = () => {
    return selectedCategory && !showQRScanner && !showFileUpload;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md shadow-xl flex flex-col"
        style={{ maxHeight: "80vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600 flex-shrink-0">
          <div className="flex items-center">
            {showBackButton() && (
              <button
                onClick={handleBackToCategories}
                className="mr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ←
              </button>
            )}
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {getHeaderTitle()}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">{renderMainContent()}</div>
      </div>
    </div>
  );
};

export default ImportKeyModal;
