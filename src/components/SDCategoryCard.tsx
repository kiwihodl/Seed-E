import React from "react";
import Text from "@/components/Text";

interface SDCategoryCardProps {
  title: string;
  description: string;
  Icon: React.ReactElement;
  onPress: () => void;
  snippet: { Icon: React.ReactElement; backgroundColor: string }[];
}

const SDCategoryCard: React.FC<SDCategoryCardProps> = ({
  title,
  description,
  Icon,
  onPress,
  snippet,
}) => {
  return (
    <button className="w-full" onClick={onPress}>
      <div className="flex items-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 h-24">
        <div className="w-8 h-8 mr-5 flex items-center justify-center">
          {Icon}
        </div>

        <div className="flex-1 space-y-1">
          <Text className="text-sm font-medium text-gray-900 dark:text-white">
            {title}
          </Text>
          <Text className="text-xs text-gray-600 dark:text-gray-400">
            {description}
          </Text>

          {snippet.length > 0 && (
            <div className="mt-2">
              <div className="flex -space-x-2">
                {snippet.map((item, index) => (
                  <div
                    key={index}
                    className="w-6 h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800"
                    style={{ backgroundColor: item.backgroundColor }}
                  >
                    {item.Icon}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="ml-4">
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
      </div>
    </button>
  );
};

export default SDCategoryCard;
