import React, { useContext } from "react";
import Text from "@/components/Text";

type ModalProps = {
  visible: boolean;
  close: () => void;
  title?: string;
  subTitle?: string;
  subTitleWidth?: number;
  modalBackground?: string;
  buttonBackground?: string;
  buttonText?: string;
  buttonTextColor?: string;
  secButtonTextColor?: string;
  secondaryButtonText?: string;
  secondaryCallback?: () => void;
  buttonCallback?: () => void;
  textColor?: string;
  subTitleColor?: string;
  DarkCloseIcon?: boolean;
  Content?: React.ComponentType;
  dismissible?: boolean;
  learnMoreButton?: boolean;
  learnMoreButtonPressed?: () => void;
  learnMoreButtonText?: string;
  learnButtonBackgroundColor?: string;
  learnButtonTextColor?: string;
  closeOnOverlayClick?: boolean;
  showCloseIcon?: boolean;
  showCurrencyTypeSwitch?: boolean;
  justifyContent?: string;
  loading?: boolean;
  secondaryIcon?: React.ReactNode;
};

function Modal(props: ModalProps) {
  const {
    visible,
    close,
    title = "",
    subTitle = null,
    subTitleWidth = 280,
    modalBackground = "primaryBackground",
    buttonBackground = "greenButtonBackground",
    buttonText = null,
    buttonTextColor = "buttonText",
    buttonCallback = () => {},
    textColor = "black",
    subTitleColor: ignored = null,
    secondaryButtonText = null,
    secondaryCallback = () => {},
    DarkCloseIcon = false,
    Content = () => null,
    dismissible = true,
    learnMoreButton = false,
    learnMoreButtonPressed = () => {},
    learnMoreButtonText = null,
    learnButtonTextColor = "light.white",
    learnButtonBackgroundColor = "BrownNeedHelp",
    secButtonTextColor = "headerText",
    closeOnOverlayClick = true,
    showCloseIcon = true,
    showCurrencyTypeSwitch = false,
    justifyContent = "flex-end",
    loading = false,
    secondaryIcon = null,
  } = props;
  const subTitleColor = ignored || textColor;

  if (!visible) {
    return null;
  }

  const getCloseIcon = () => (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          {showCloseIcon && (
            <button
              onClick={close}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {getCloseIcon()}
            </button>
          )}
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex-1 text-center">
            {title}
          </h2>
          {showCloseIcon && <div className="w-6 h-6"></div>}
        </div>

        {/* Subtitle */}
        {subTitle && (
          <p
            className="text-gray-600 dark:text-gray-300 text-center mb-6"
            style={{ width: subTitleWidth }}
          >
            {subTitle}
          </p>
        )}

        {/* Content */}
        <div className="mb-6">
          <Content />
        </div>

        {/* Footer */}
        {buttonText && (
          <div className="flex justify-end space-x-3">
            {secondaryButtonText && (
              <button
                onClick={secondaryCallback}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                {secondaryButtonText}
              </button>
            )}
            <button
              onClick={buttonCallback}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Loading..." : buttonText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
