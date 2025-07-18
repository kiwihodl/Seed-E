"use client";

import { useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  const [user, setUser] = useState<any>(null);
  const [qrCode, setQrCode] = useState("");
  const [token, setToken] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Logging in...");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, userType: "provider" }),
    });

    const data = await response.json();
    if (response.ok) {
      setStatus("Login successful. Checking 2FA status...");
      setUser(data.user);
      if (!data.user.twoFactorSecret) {
        handleGenerate2FA(username);
      } else {
        setStatus("Please enter your 2FA token to complete login.");
      }
    } else {
      setStatus(`Error: ${data.error}`);
    }
  };

  const handleGenerate2FA = async (username: string) => {
    setStatus("Generating 2FA setup...");
    const response = await fetch("/api/auth/2fa/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, userType: "provider" }),
    });
    const data = await response.json();
    if (response.ok) {
      setQrCode(data.qrCodeDataURL);
      setStatus(
        "Please scan the QR code with your authenticator app and enter the token."
      );
    } else {
      setStatus(`Error generating 2FA: ${data.error}`);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Verifying 2FA token...");
    const response = await fetch("/api/auth/2fa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, token, userType: "provider" }),
    });
    const data = await response.json();
    if (response.ok && data.verified) {
      setStatus("2FA setup complete! You can now log in normally.");
      setQrCode("");
      // In a real app, you would now proceed with the session
    } else {
      setStatus("Error: Invalid 2FA token.");
    }
  };

  return (
    <main className="container mx-auto p-8 flex justify-center">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold mb-8 text-center">Provider Login</h1>

        {!user && (
          <form
            onSubmit={handleLogin}
            className="bg-white shadow-md rounded-lg p-8 space-y-6"
          >
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Log In
            </button>
          </form>
        )}

        {qrCode && (
          <div className="bg-white shadow-md rounded-lg p-8 mt-8 text-center">
            <h2 className="text-2xl font-semibold mb-4">Set Up 2FA</h2>
            <p className="mb-4">
              Scan this QR code with your authenticator app.
            </p>
            <img src={qrCode} alt="2FA QR Code" className="mx-auto" />
            <form onSubmit={handleVerify2FA} className="mt-6 space-y-4">
              <label
                htmlFor="token"
                className="block text-sm font-medium text-gray-700"
              >
                Verification Token
              </label>
              <input
                type="text"
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                Verify & Enable
              </button>
            </form>
          </div>
        )}

        {status && (
          <p className="mt-4 text-center text-sm text-gray-600">{status}</p>
        )}
      </div>
    </main>
  );
}
