import React from "react";

interface TextProps {
  children: React.ReactNode;
  color?: string;
  fontSize?: number;
  bold?: boolean;
  light?: boolean;
  italic?: boolean;
  medium?: boolean;
  semiBold?: boolean;
  fontWeight?: string | number;
  style?: React.CSSProperties;
  className?: string;
}

function Text(props: TextProps) {
  const {
    children,
    style,
    fontSize,
    medium,
    semiBold,
    bold = false,
    light = false,
    italic,
    fontWeight = undefined,
    className = "",
  } = props;

  let computedFontWeight: string | number = fontWeight || 400;

  if (!fontWeight) {
    if (bold) {
      computedFontWeight = 700;
    } else if (light) {
      computedFontWeight = 300;
    } else if (medium) {
      computedFontWeight = 500;
    } else if (semiBold) {
      computedFontWeight = 600;
    } else {
      computedFontWeight = 400;
    }
  }

  const updatedProps = {
    ...props,
    bold: undefined,
    light: undefined,
    medium: undefined,
    semiBold: undefined,
  };

  const passedStyles = Array.isArray(style)
    ? Object.assign({}, ...style)
    : style;

  return (
    <span
      {...updatedProps}
      style={{
        fontSize,
        fontWeight: computedFontWeight,
        fontStyle: italic ? "italic" : undefined,
        ...passedStyles,
      }}
      className={className}
    >
      {children}
    </span>
  );
}

export default Text;
