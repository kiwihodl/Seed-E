"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";

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
  const router = useRouter();

  // Debounce timer for username checking
  const [usernameTimer, setUsernameTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  // Validate password strength
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
      errors.push("Password must contain at least one special character");
    }
    return errors;
  };

  // Check username availability
  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setIsCheckingUsername(true);
    try {
      const response = await fetch("/api/providers/check-username", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();
      setUsernameAvailable(data.available);
    } catch {
      setUsernameAvailable(null);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  // Handle username change with debounce
  const handleUsernameChange = (value: string) => {
    setFormData({ ...formData, providerName: value });

    // Clear existing timer
    if (usernameTimer) {
      clearTimeout(usernameTimer);
    }

    // Set new timer for username checking
    const timer = setTimeout(() => {
      checkUsernameAvailability(value);
    }, 500);

    setUsernameTimer(timer);
  };

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
  }, [formData, validatePassword]);

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
      const response = await fetch("http://localhost:3001/api/providers", {
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
      console.log("Registration response:", response.status, data);

      if (response.ok) {
        console.log("Registration successful, redirecting to 2FA setup...");
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
    setFormData({
      ...formData,
      [name]: value,
    });
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
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#FF9500] focus:border-[#FF9500]"
                placeholder="Create a strong password"
                required
                minLength={8}
              />
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
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#FF9500] focus:border-[#FF9500]"
                placeholder="Confirm your password"
                required
                minLength={8}
              />
              {validationErrors.confirmPassword && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {validationErrors.confirmPassword}
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
