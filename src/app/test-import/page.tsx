"use client";

import React, { useState } from "react";
import ImportKeyModal from "@/components/ImportKeyModal";

export default function TestImportPage() {
  const [showModal, setShowModal] = useState(false);

  const handleImport = (data: any) => {
    console.log("Import data:", data);
    alert(`Imported: ${data.signerName}`);
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Import Modal Test
        </h1>

        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Open Import Modal
        </button>

        {showModal && (
          <ImportKeyModal
            onClose={() => setShowModal(false)}
            onImport={handleImport}
          />
        )}
      </div>
    </div>
  );
}
