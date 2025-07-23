import React from "react";

interface ActivityIndicatorViewProps {
  visible: boolean;
  showLoader?: boolean;
}

function ActivityIndicatorView({
  visible,
  showLoader = true,
}: ActivityIndicatorViewProps) {
  if (!visible) {
    return null;
  }

  return (
    <div
      data-testid="modal_loading"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
    >
      {showLoader && (
        <div
          data-testid="activityIndicator"
          className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "#00836A", borderTopColor: "transparent" }}
        />
      )}
    </div>
  );
}

export default ActivityIndicatorView;
