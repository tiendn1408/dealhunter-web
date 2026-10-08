import React from "react";
import Image from "next/image";

interface DealHunterLogoProps {
  className?: string;
  iconOnly?: boolean;
  inverted?: boolean; // For dark background
  showTagline?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

/**
 * DealHunter Official Brand Mark
 */
export function DealHunterIcon({
  className = "w-7 h-7",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <Image
      src="/icon.png"
      alt="DealHunter Logo"
      width={28}
      height={28}
      className={`${className} object-contain rounded-lg`}
      priority
    />
  );
}

export function DealHunterLogo({
  className = "",
  iconOnly = false,
  inverted = false,
  showTagline = false,
  size = "md",
}: DealHunterLogoProps) {
  const pixelSize =
    size === "sm" ? 24 : size === "lg" ? 36 : size === "xl" ? 56 : 28;

  const iconSizeClass =
    size === "sm"
      ? "w-6 h-6"
      : size === "lg"
      ? "w-9 h-9"
      : size === "xl"
      ? "w-14 h-14"
      : "w-7 h-7";

  const textSizeClass =
    size === "sm"
      ? "text-lg"
      : size === "lg"
      ? "text-2xl"
      : size === "xl"
      ? "text-4xl"
      : "text-xl";

  const textColor = inverted ? "text-white" : "text-pine-900";
  const taglineColor = inverted ? "text-pine-200" : "text-slate-400";

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image
        src="/icon.png"
        alt="DealHunter Logo"
        width={pixelSize}
        height={pixelSize}
        className={`${iconSizeClass} rounded-xl object-contain shadow-xs`}
        priority
      />
      {!iconOnly && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span
              className={`${textSizeClass} font-black tracking-tight leading-none ${textColor}`}
            >
              DealHunter
            </span>
          </div>
          {showTagline && (
            <span
              className={`text-[11px] font-medium tracking-normal mt-0.5 ${taglineColor}`}
            >
              Săn đúng giá trước khi mua
            </span>
          )}
        </div>
      )}
    </div>
  );
}
