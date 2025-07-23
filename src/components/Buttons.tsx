import React from "react";
import Text from "@/components/Text";

interface ButtonsProps {
  primaryText?: string;
  secondaryText?: string;
  primaryCallback?: () => void;
  secondaryCallback?: () => void;
  primaryDisable?: boolean;
  secondaryDisable?: boolean;
  primaryLoading?: boolean;
  paddingHorizontal?: number;
  paddingVertical?: number;
  activeOpacity?: number;
  width?: number | null;
  fullWidth?: boolean;
  primaryBackgroundColor?: string;
  primaryTextColor?: string;
  secondaryTextColor?: string;
  SecondaryIcon?: React.ReactElement;
  LeftIcon?: React.ReactElement;
  RightIcon?: React.ReactElement;
  borderRadius?: number;
  primaryFontWeight?: string;
  disableNoOverlay?: boolean;
  primaryBorderColor?: string;
  border?: number;
}

function Buttons({
  primaryText = "",
  secondaryText = "",
  primaryCallback = () => {},
  secondaryCallback = () => {},
  primaryDisable = false,
  secondaryDisable = false,
  primaryLoading = false,
  paddingHorizontal = 40,
  paddingVertical = 15,
  activeOpacity = 0.5,
  width = null,
  fullWidth = false,
  primaryBackgroundColor,
  primaryTextColor,
  secondaryTextColor,
  SecondaryIcon,
  LeftIcon,
  RightIcon,
  borderRadius = 10,
  primaryFontWeight = "bold",
  disableNoOverlay = false,
  primaryBorderColor,
  border = 1,
}: ButtonsProps) {
  const onPrimaryInteraction = () => {
    if (!primaryDisable && !disableNoOverlay) {
      primaryCallback();
    }
  };

  const onSecondaryInteraction = () => {
    if (!secondaryDisable && !disableNoOverlay) {
      secondaryCallback();
    }
  };

  const getPrimaryButton = () => (
    <button
      onClick={onPrimaryInteraction}
      disabled={primaryDisable || disableNoOverlay || primaryLoading}
      className="transition-opacity"
      data-testid="btn_primaryText"
      style={{
        opacity: activeOpacity,
        width: secondaryText
          ? primaryLoading
            ? "100%"
            : width || undefined
          : fullWidth
          ? "100%"
          : width || undefined,
      }}
    >
      <div
        className={`flex items-center justify-center gap-2 rounded-lg border transition-all ${
          primaryDisable ? "opacity-50" : "opacity-100"
        }`}
        style={{
          paddingLeft: width ? 0 : paddingHorizontal,
          paddingRight: width ? 0 : paddingHorizontal,
          paddingTop: paddingVertical,
          paddingBottom: paddingVertical,
          width: width || undefined,
          borderRadius,
          borderWidth: border,
          borderColor: primaryBorderColor || "transparent",
          backgroundColor: primaryBackgroundColor || "#10b981",
        }}
      >
        {primaryLoading ? (
          <div className="flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {LeftIcon && LeftIcon}
            <Text
              className="text-sm font-medium text-white"
              style={{ fontWeight: primaryFontWeight }}
            >
              {primaryText}
            </Text>
            {RightIcon && RightIcon}
          </>
        )}
      </div>
    </button>
  );

  return (
    <div className="flex justify-end items-center">
      {secondaryText !== "" && !primaryLoading && (
        <button
          className={`flex items-center justify-center gap-1 rounded-lg transition-opacity ${
            secondaryDisable ? "opacity-50" : "opacity-100"
          }`}
          style={{
            marginRight: primaryText ? 20 : 0,
            borderRadius,
          }}
          onClick={onSecondaryInteraction}
          disabled={secondaryDisable || disableNoOverlay}
          data-testid="btn_secondaryText"
        >
          {SecondaryIcon && SecondaryIcon}
          <Text className="text-sm font-medium text-green-600 dark:text-green-400">
            {secondaryText}
          </Text>
        </button>
      )}
      {primaryText ? getPrimaryButton() : null}
    </div>
  );
}

export default Buttons;
