import React from "react";
import Text from "@/components/Text";

type OptionProps = {
  title: string;
  preTitle?: string;
  description?: string;
  callback?: () => void;
  titleColor?: string;
  descriptionColor?: string;
  Icon?: React.ReactElement;
  LeftIcon?: React.ReactElement;
  disabled?: boolean;
  visible?: boolean;
  CardPill?: React.ReactElement;
  rightComponent?: () => React.ReactElement;
};

export function OptionCard({
  title,
  preTitle,
  description,
  Icon,
  callback,
  titleColor,
  descriptionColor,
  LeftIcon,
  disabled = false,
  CardPill,
  visible = true,
  rightComponent,
}: OptionProps) {
  if (!visible) return null;

  const containerOpacity = disabled ? 0.8 : 1;
  const preTitleOpacity = 1;
  const descriptionOpacity = 0.8;

  const getTextColor = (type: "title" | "description" | "preTitle") => {
    if (disabled) {
      return "text-gray-400 dark:text-gray-500";
    }

    switch (type) {
      case "title":
        return titleColor || "text-gray-900 dark:text-white";
      case "description":
        return descriptionColor || "text-gray-600 dark:text-gray-400";
      case "preTitle":
        return "text-green-600 dark:text-green-400";
    }
  };

  return (
    <button
      className="w-full"
      onClick={callback}
      disabled={disabled}
      data-testid={`btn_${title}`}
    >
      <div className="flex justify-between items-center py-3 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        <div
          className="flex items-center space-x-3 flex-1"
          style={{ opacity: containerOpacity }}
        >
          {LeftIcon && (
            <div className="w-6 h-6 flex items-center justify-center">
              {LeftIcon}
            </div>
          )}

          <div className="flex-1 space-y-1">
            {preTitle && (
              <Text
                className={`text-sm italic ${getTextColor("preTitle")}`}
                style={{ opacity: preTitleOpacity }}
                data-testid={`text_preTitle_${title.replace(/ /g, "_")}`}
              >
                {preTitle}
              </Text>
            )}

            <Text
              className={`text-sm font-medium ${getTextColor("title")}`}
              data-testid={`text_${title.replace(/ /g, "_")}`}
            >
              {title}
            </Text>

            {description && (
              <Text
                className={`text-xs ${getTextColor("description")}`}
                style={{ opacity: descriptionOpacity }}
              >
                {description}
              </Text>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center min-w-6">
          {rightComponent
            ? rightComponent()
            : CardPill ||
              Icon || (
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
        </div>
      </div>
    </button>
  );
}

export default OptionCard;
