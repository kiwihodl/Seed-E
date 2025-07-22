export interface AuthUser {
  id: string;
  username: string;
  userType: "client" | "provider";
}

export async function validateUserType(
  username: string,
  expectedUserType: "client" | "provider"
): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/validate-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        expectedUserType,
      }),
    });

    if (!response.ok) {
      console.error("Error validating user type:", response.statusText);
      return false;
    }

    const data = await response.json();
    return data.isValid;
  } catch (error) {
    console.error("Error validating user type:", error);
    return false;
  }
}

export async function getUserInfo(username: string): Promise<AuthUser | null> {
  try {
    const clientResponse = await fetch(
      `/api/clients/check-username?name=${encodeURIComponent(username)}`
    );
    if (clientResponse.ok) {
      const clientData = await clientResponse.json();
      if (!clientData.available) {
        return {
          id: "client-id", 
          username,
          userType: "client" as const,
        };
      }
    }

    const providerResponse = await fetch(
      `/api/providers/check-username?name=${encodeURIComponent(username)}`
    );
    if (providerResponse.ok) {
      const providerData = await providerResponse.json();
      if (!providerData.available) {
        return {
          id: "provider-id", 
          username,
          userType: "provider" as const,
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Error getting user info:", error);
    return null;
  }
}

export function getStoredUserInfo(): {
  username: string | null;
  userType: string | null;
  userId: string | null;
} {
  if (typeof window === "undefined") {
    return { username: null, userType: null, userId: null };
  }

  return {
    username: localStorage.getItem("username"),
    userType: localStorage.getItem("userType"),
    userId: localStorage.getItem("userId"),
  };
}

export function clearUserSession(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem("username");
  localStorage.removeItem("userType");
  localStorage.removeItem("userId");
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;

  const username = localStorage.getItem("username");
  const userType = localStorage.getItem("userType");
  const userId = localStorage.getItem("userId");

  return !!(username && userType && userId);
}
