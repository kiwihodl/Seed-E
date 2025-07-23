import React from "react";
import Text from "@/components/Text";

type DashedButtonProps = {
  name: string;
  callback?: (name: string) => void;
  cardStyles?: React.CSSProperties;
  iconWidth?: number;
  customStyle?: React.CSSProperties;
  iconHeight?: number;
  loading?: boolean;
  description?: string;
  icon?: React.ReactElement;
  backgroundColor?: string;
  hexagonBackgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  titleSize?: number;
  arrowIcon?: React.ReactElement;
  textPosition?: "center" | "left";
};

function DashedCta({
  name,
  callback = () => {},
  description,
  iconWidth = 40,
  iconHeight = 34,
  icon,
  cardStyles,
  backgroundColor,
  customStyle,
  hexagonBackgroundColor,
  borderColor,
  textColor,
  arrowIcon,
  textPosition = "center",
  titleSize = 14,
}: DashedButtonProps) {
  const defaultBackgroundColor = "bg-gray-50 dark:bg-gray-800";
  const defaultTextColor = "text-gray-900 dark:text-white";
  const defaultBorderColor =
    borderColor || "border-green-500 dark:border-green-400";
  const defaultHexagonBackgroundColor = "#ffffff";

  return (
    <button
      className="w-full"
      onClick={() => callback(name)}
      data-testid={`btn_${name}`}
    >
      <div
        className={`min-h-[50px] rounded-lg border border-dashed flex items-center justify-center gap-2 p-4 ${defaultBackgroundColor} ${defaultBorderColor}`}
        style={{
          ...(customStyle || {}),
          ...cardStyles,
        }}
      >
        {icon && (
          <div
            className="flex items-center justify-center rounded-lg"
            style={{
              width: iconWidth,
              height: iconHeight,
              backgroundColor:
                hexagonBackgroundColor || defaultHexagonBackgroundColor,
            }}
          >
            {icon}
          </div>
        )}

        <div
          className={`flex-1 ${
            textPosition === "center" ? "text-center" : "text-left"
          }`}
        >
          {name && (
            <Text
              className={`font-semibold ${defaultTextColor}`}
              style={{ fontSize: titleSize }}
            >
              {name}
            </Text>
          )}
          {description && (
            <Text
              className={`${defaultTextColor} mt-1`}
              style={{ fontSize: 13 }}
            >
              {description}
            </Text>
          )}
        </div>

        {arrowIcon && (
          <div className="ml-2">
            <svg
              className="w-4 h-4 text-gray-400 dark:text-gray-500"
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
          </div>
        )}
      </div>
    </button>
  );
}

export default DashedCta;
