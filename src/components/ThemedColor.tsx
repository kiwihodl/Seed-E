import React from "react";

// Placeholder themed colors - you'll need to replace this with actual color values
const themedColors: Record<string, Record<string, string>> = {
  green_modal_text_color: {
    LIGHT: "#1f2937",
    DARK: "#f9fafb",
  },
  green_modal_background: {
    LIGHT: "#f0fdf4",
    DARK: "#064e3b",
  },
  green_modal_button_background: {
    LIGHT: "#10b981",
    DARK: "#059669",
  },
  green_modal_button_text: {
    LIGHT: "#ffffff",
    DARK: "#ffffff",
  },
  green_modal_sec_button_text: {
    LIGHT: "#059669",
    DARK: "#34d399",
  },
  // Add more color mappings as needed
};

interface ThemedColorProps {
  name: string;
}

const ThemedColor: React.FC<ThemedColorProps> = ({ name }) => {
  // For now, we'll use a simple theme detection
  // In a real implementation, you'd get this from your Redux store
  const themeMode =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "DARK"
      : "LIGHT";
  const fallbackMode = "LIGHT";

  const color =
    themedColors[name]?.[themeMode] || themedColors[name]?.[fallbackMode];

  if (!color) {
    console.warn(`Color "${name}" not found in themed colors`);
    return null;
  }

  return color;
};

export default ThemedColor;
