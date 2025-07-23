import { useState } from "react";

// Simplified plan hook for Seed-E key import
const usePlan = () => {
  // For Seed-E, we'll use simple state instead of complex plan management
  const [isOnL1, setIsOnL1] = useState(false);
  const [isOnL2, setIsOnL2] = useState(false);
  const [isOnL4, setIsOnL4] = useState(true); // Default to highest tier for demo
  const [isOnL2Above, setIsOnL2Above] = useState(true);

  return {
    isOnL1,
    isOnL2,
    isOnL4,
    isOnL2Above,
  };
};

export default usePlan;
