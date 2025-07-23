import React from "react";

interface ScreenWrapperProps {
  children: React.ReactNode;
  barStyle?: "dark-content" | "light-content";
  backgroundcolor?: string;
  paddingHorizontal?: number;
}

function ScreenWrapper({
  children,
  barStyle,
  backgroundcolor = "bg-white dark:bg-gray-900",
  paddingHorizontal = 20,
}: ScreenWrapperProps) {
  return (
    <div className={`min-h-screen ${backgroundcolor}`}>
      <div
        className="container mx-auto px-4 py-6"
        style={{
          paddingLeft: paddingHorizontal,
          paddingRight: paddingHorizontal,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default ScreenWrapper;
