"use client";

import { useState } from "react";
import { KeyPolicyType } from "@prisma/client";

export default function CreateServiceForm() {
  const [providerName, setProviderName] = useState("");
  const [policyType, setPolicyType] = useState<KeyPolicyType>(
    KeyPolicyType.P2TR
  );
  const [xpub, setXpub] = useState("");
  const [initialBackupFee, setInitialBackupFee] = useState("");
  const [perSignatureFee, setPerSignatureFee] = useState("");
  const [monthlyFee, setMonthlyFee] = useState("");
  const [bolt12Offer, setBolt12Offer] = useState("");

  const [status, setStatus] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Submitting...");

    // In a real app, the user would be prompted to sign this message
    // with the private key corresponding to the xpub.
    const messageToSign = `I, ${providerName}, attest that this signature was created by the private key corresponding to xpub: ${xpub} for use with Seed-E.`;
    const controlSignature = btoa(`dummy-signature-for-${messageToSign}`); // Base64 encoded dummy signature

    const response = await fetch("/api/providers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        providerName,
        policyType,
        xpub,
        controlSignature,
        initialBackupFee: Number(initialBackupFee),
        perSignatureFee: Number(perSignatureFee),
        monthlyFee: monthlyFee ? Number(monthlyFee) : undefined,
        bolt12Offer,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      setStatus("Service created successfully!");
      // Optionally clear the form
      setProviderName("");
      setPolicyType(KeyPolicyType.P2TR);
      setXpub("");
      setInitialBackupFee("");
      setPerSignatureFee("");
      setMonthlyFee("");
      setBolt12Offer("");
    } else {
      setStatus(`Error: ${data.error}`);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg mt-8">
      <div className="px-6 py-4 border-b">
        <h2 className="text-2xl font-semibold">Create New Service</h2>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label
            htmlFor="providerName"
            className="block text-sm font-medium text-gray-700"
          >
            Provider Name
          </label>
          <input
            type="text"
            id="providerName"
            value={providerName}
            onChange={(e) => setProviderName(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="xpub"
            className="block text-sm font-medium text-gray-700"
          >
            XPUB
          </label>
          <input
            type="text"
            id="xpub"
            value={xpub}
            onChange={(e) => setXpub(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="policyType"
            className="block text-sm font-medium text-gray-700"
          >
            Key Policy Type
          </label>
          <select
            id="policyType"
            value={policyType}
            onChange={(e) => setPolicyType(e.target.value as KeyPolicyType)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            {Object.values(KeyPolicyType).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="initialBackupFee"
            className="block text-sm font-medium text-gray-700"
          >
            Initial Backup Fee (sats)
          </label>
          <input
            type="number"
            id="initialBackupFee"
            value={initialBackupFee}
            onChange={(e) => setInitialBackupFee(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="perSignatureFee"
            className="block text-sm font-medium text-gray-700"
          >
            Per-Signature Fee (sats)
          </label>
          <input
            type="number"
            id="perSignatureFee"
            value={perSignatureFee}
            onChange={(e) => setPerSignatureFee(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="monthlyFee"
            className="block text-sm font-medium text-gray-700"
          >
            Monthly Fee (sats, optional)
          </label>
          <input
            type="number"
            id="monthlyFee"
            value={monthlyFee}
            onChange={(e) => setMonthlyFee(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="bolt12Offer"
            className="block text-sm font-medium text-gray-700"
          >
            BOLT12 Offer
          </label>
          <input
            type="text"
            id="bolt12Offer"
            value={bolt12Offer}
            onChange={(e) => setBolt12Offer(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create Service
          </button>
        </div>
        {status && (
          <p className="mt-4 text-center text-sm text-gray-600">{status}</p>
        )}
      </form>
    </div>
  );
}
