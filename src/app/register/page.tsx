"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";

// Validate password strength - moved outside component to prevent recreation
const validatePassword = (password: string) => {
  const errors: string[] = [];
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push(
      'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)'
    );
  }
  return errors;
};

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    providerName: "",
    password: "",
    confirmPassword: "",
  });
  const [validationErrors, setValidationErrors] = useState({
    providerName: "",
    password: "",
    confirmPassword: "",
  });
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  // Debounce timer for username checking
  const [usernameTimer, setUsernameTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  // Check username availability
  const checkUsernameAvailability = useCallback(async (username: string) => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setIsCheckingUsername(true);
    try {
      const response = await fetch(
        `/api/providers/check-username?name=${encodeURIComponent(username)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      setUsernameAvailable(data.available);
    } catch {
      setUsernameAvailable(null);
    } finally {
      setIsCheckingUsername(false);
    }
  }, []);

  // Handle username change with debounce
  const handleUsernameChange = useCallback(
    (value: string) => {
      setFormData((prev) => ({ ...prev, providerName: value }));

      // Clear existing timer
      if (usernameTimer) {
        clearTimeout(usernameTimer);
      }

      // Set new timer for username checking
      const timer = setTimeout(() => {
        checkUsernameAvailability(value);
      }, 500);

      setUsernameTimer(timer);
    },
    [usernameTimer, checkUsernameAvailability]
  );

  // Validate form on mount and when formData changes
  useEffect(() => {
    const errors = {
      providerName: "",
      password: "",
      confirmPassword: "",
    };

    // Validate provider name
    if (formData.providerName.length > 0 && formData.providerName.length < 3) {
      errors.providerName = "Provider name must be at least 3 characters long";
    }

    // Validate password
    if (formData.password.length > 0) {
      const passwordErrors = validatePassword(formData.password);
      if (passwordErrors.length > 0) {
        errors.password = passwordErrors.join(", ");
      }
    }

    // Validate confirm password
    if (
      formData.confirmPassword.length > 0 &&
      formData.password !== formData.confirmPassword
    ) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);
  }, [formData]);

  const isFormValid = () => {
    return (
      formData.providerName.trim() &&
      formData.password &&
      formData.confirmPassword &&
      !validationErrors.providerName &&
      !validationErrors.password &&
      !validationErrors.confirmPassword &&
      usernameAvailable === true &&
      !isCheckingUsername
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isFormValid()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/providers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          providerName: formData.providerName,
          password: formData.password,
        }),
      });

      const data = await response.json();
      // console.log("Registration response:", response.status, data);

      if (response.ok) {
        // console.log("Registration successful, redirecting to 2FA setup...");
        // Store username for 2FA setup
        if (typeof window !== "undefined") {
          localStorage.setItem("username", formData.providerName.trim());
          localStorage.setItem("userType", "provider");
          localStorage.setItem("userId", data.providerId); // Store the provider ID
          localStorage.setItem("tempPassword", formData.password);
        }
        router.push("/setup-2fa");
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Check username availability when provider name changes
    if (name === "providerName") {
      handleUsernameChange(value);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Create Your Provider Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
            Set up your Bitcoin signing service
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Provider Name
              </label>
              <input
                type="text"
                name="providerName"
                value={formData.providerName}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#FF9500] focus:border-[#FF9500]"
                placeholder="Enter your provider name"
                required
                minLength={3}
              />
              {validationErrors.providerName && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {validationErrors.providerName}
                </p>
              )}
              {usernameAvailable === false && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  This provider name is already taken
                </p>
              )}
              {usernameAvailable === true && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  This provider name is available
                </p>
              )}
              {isCheckingUsername && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Checking availability...
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#FF9500] focus:border-[#FF9500]"
                  placeholder="Create a strong password"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
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
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
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
              </div>
              {validationErrors.password && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {validationErrors.password}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#FF9500] focus:border-[#FF9500]"
                  placeholder="Confirm your password"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
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
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
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
              </div>
              {validationErrors.confirmPassword && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {validationErrors.confirmPassword}
                </p>
              )}
              {formData.password === formData.confirmPassword && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Passwords match!
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={loading || !isFormValid()}
          >
            Create Account
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Already have an account?{" "}
            <a
              href="/login"
              className="font-medium text-[#FF9500] hover:text-[#FF9500]/80"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
