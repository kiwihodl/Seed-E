import React from "react";
import Text from "@/components/Text";
import ThemedSvg from "@/components/ThemedSvg";

interface WalletHeaderProps {
  title?: string;
  enableBack?: boolean;
  onPressHandler?: () => void;
  titleColor?: string;
  data?: any;
  rightComponent?: React.ReactNode;
  subTitle?: string;
  subtitleColor?: string;
  learnMore?: boolean;
  learnMorePressed?: () => void;
}

const WalletHeader: React.FC<WalletHeaderProps> = ({
  title = "",
  enableBack = true,
  onPressHandler,
  titleColor,
  rightComponent,
  subTitle,
  subtitleColor,
  learnMore,
  learnMorePressed,
}) => {
  const handleBack = () => {
    if (onPressHandler) {
      onPressHandler();
    } else {
      // Default back behavior for web
      window.history.back();
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center flex-1">
          {enableBack && (
            <button
              data-testid="btn_back"
              onClick={handleBack}
              className="h-11 w-7 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            >
              <ThemedSvg name="back_Button" />
            </button>
          )}
          {title && (
            <Text
              className="text-lg font-medium ml-2"
              style={{ color: titleColor }}
            >
              {title}
            </Text>
          )}
        </div>
        {learnMore && (
          <button
            className="w-10 h-10 flex items-center justify-center ml-5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            onClick={learnMorePressed}
          >
            <ThemedSvg name="info_icon" />
          </button>
        )}
        {rightComponent && <div>{rightComponent}</div>}
      </div>
      {subTitle && (
        <Text
          className="text-sm mt-2.5 w-[90%]"
          style={{ color: subtitleColor }}
        >
          {subTitle}
        </Text>
      )}
    </div>
  );
};

export default WalletHeader;
