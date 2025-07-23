import React from "react";
import Text from "@/components/Text";

type ActionCardProps = {
  cardName: string;
  description?: string;
  icon?: React.ReactElement;
  callback: () => void;
  customStyle?: React.CSSProperties;
  dottedBorder?: boolean;
  cardPillText?: string;
  showDot?: boolean;
  smallDeviceHeight?: number;
  smallDeviceWidth?: number;
  disable?: boolean;
  cardPillColor?: string;
  circleColor?: string;
  pillTextColor?: string;
  customCardPill?: React.ReactElement;
};

function ActionCard({
  cardName,
  icon,
  description,
  customStyle,
  callback,
  dottedBorder = false,
  cardPillText = "",
  showDot = false,
  smallDeviceHeight = 140,
  smallDeviceWidth = 110,
  disable = false,
  cardPillColor,
  circleColor,
  pillTextColor,
  customCardPill,
}: ActionCardProps) {
  return (
    <button
      className="w-full"
      onClick={callback}
      disabled={disable}
      data-testid={`btn_${cardName}`}
    >
      <div
        className="relative bg-gray-50 dark:bg-gray-800 rounded-lg p-3 overflow-hidden transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
        style={{
          minHeight: smallDeviceHeight,
          minWidth: smallDeviceWidth,
          ...customStyle,
        }}
      >
        {customCardPill ? (
          <div className="absolute top-2 right-2 z-10">{customCardPill}</div>
        ) : (
          cardPillText && (
            <div className="absolute top-2 right-2 z-10">
              <div
                className="px-2 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: cardPillColor || "#f3f4f6",
                  color: pillTextColor || "#374151",
                }}
              >
                {cardPillText}
              </div>
            </div>
          )
        )}

        <div
          className="relative w-8 h-8 rounded-full flex items-center justify-center mt-1 mb-2 ml-1"
          style={{
            backgroundColor: circleColor || "#8b5a2b",
          }}
        >
          {dottedBorder && (
            <div className="absolute w-[85%] h-[85%] rounded-full border border-dotted border-white" />
          )}
          {icon && icon}
          {showDot && (
            <div className="absolute w-2.5 h-2.5 rounded-full bg-red-500 top-0 right-0 border border-white" />
          )}
        </div>

        <Text
          className="text-sm font-medium text-gray-900 dark:text-white leading-tight"
          style={{ fontSize: 13, lineHeight: 16 }}
        >
          {cardName}
        </Text>

        {description && (
          <Text
            className="text-xs text-gray-600 dark:text-gray-400 leading-tight mt-1"
            style={{ fontSize: 11, lineHeight: 14 }}
          >
            {description}
          </Text>
        )}

        {disable && (
          <div className="absolute inset-0 bg-gray-300 dark:bg-gray-600 opacity-60 rounded-lg" />
        )}
      </div>
    </button>
  );
}

export default ActionCard;
