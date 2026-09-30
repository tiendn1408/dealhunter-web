import React from "react";

interface DealHunterLogoProps {
  className?: string;
  iconOnly?: boolean;
  inverted?: boolean; // For dark background
  showTagline?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

/**
 * Deal Hunter Abstract Mark:
 * - Mũi tên / chuyển động đi xuống: Tượng trưng cho giá giảm (price drop).
 * - Hai lớp hình học xếp chồng: Tượng trưng cho việc theo dõi lịch sử giá theo thời gian.
 * - Khối hình cân đối & gọn gàng: Chuẩn hóa cho Favicon, App Icon, Mobile & Desktop Header.
 */
export function DealHunterIcon({
  className = "w-7 h-7",
  color = "currentColor",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="DealHunter Logo"
    >
      {/* Mảng 1 (trên-trái): Nghiêng xuống tạo lực chuyển động dốc */}
      <rect
        x="7.5"
        y="5"
        width="6.5"
        height="17"
        rx="3.25"
        transform="rotate(-28 10.75 13.5)"
        fill={color}
      />
      {/* Mảng 2 (dưới-phải): Xếp lớp so le đối xứng tạo mũi tên hạ giá */}
      <rect
        x="18"
        y="10"
        width="6.5"
        height="17"
        rx="3.25"
        transform="rotate(28 21.25 18.5)"
        fill={color}
      />
    </svg>
  );
}

export function DealHunterLogo({
  className = "",
  iconOnly = false,
  inverted = false,
  showTagline = false,
  size = "md",
}: DealHunterLogoProps) {
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

  const color = inverted ? "#ffffff" : "#0A3832";
  const textColor = inverted ? "text-white" : "text-pine-900";
  const taglineColor = inverted ? "text-pine-200" : "text-slate-400";

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <DealHunterIcon className={iconSizeClass} color={color} />
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
