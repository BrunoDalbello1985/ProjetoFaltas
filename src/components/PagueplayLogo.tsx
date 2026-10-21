import React from 'react';

interface PagueplayLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'badge';
  theme?: 'dark' | 'white' | 'colored';
  subtitle?: string;
}

export const PagueplayLogo: React.FC<PagueplayLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
  theme = 'colored',
  subtitle,
}) => {
  // Dimensions map
  const iconDimensions = {
    sm: { w: 28, h: 28, text: 'text-lg', sub: 'text-[9px]' },
    md: { w: 38, h: 38, text: 'text-2xl', sub: 'text-[10px]' },
    lg: { w: 52, h: 52, text: 'text-3xl', sub: 'text-xs' },
    xl: { w: 72, h: 72, text: 'text-4xl', sub: 'text-sm' },
  }[size];

  const textColorClass = theme === 'white' 
    ? 'text-white' 
    : theme === 'dark' 
    ? 'text-slate-900' 
    : 'text-slate-700';

  const subColorClass = theme === 'white'
    ? 'text-emerald-100/90'
    : 'text-emerald-600 font-semibold';

  // SVG Icon representing Pagueplay's iconic green and blue overlapping speech-bubble/leaf mark
  const IconSvg = (
    <svg
      width={iconDimensions.w}
      height={iconDimensions.h}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-300 group-hover:scale-105 drop-shadow-xs"
    >
      <defs>
        {/* Vibrant Pagueplay Green Gradient */}
        <linearGradient id="pagueplayGreen" x1="15%" y1="10%" x2="85%" y2="90%">
          <stop offset="0%" stopColor="#48C726" />
          <stop offset="100%" stopColor="#2E9E15" />
        </linearGradient>

        {/* Vibrant Pagueplay Blue Gradient */}
        <linearGradient id="pagueplayBlue" x1="20%" y1="15%" x2="90%" y2="95%">
          <stop offset="0%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>

        {/* Soft shadow for depth between the two shapes */}
        <filter id="pagueplayShadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="-2" dy="2" stdDeviation="3" floodOpacity="0.18" />
        </filter>
      </defs>

      {/* Left green organic bubble */}
      <path
        d="M48 12C28.1178 12 12 28.1178 12 48C12 62.464 20.5707 74.9224 33 80.648V88C33 90.2091 34.7909 92 37 92C38.0609 92 39.0783 91.5786 39.8284 90.8284L47.6569 83.0001C47.7709 83.0001 47.8853 83 48 83C67.8823 83 84 66.8823 84 47C84 27.1178 67.8823 12 48 12Z"
        fill="url(#pagueplayGreen)"
      />

      {/* Right blue organic bubble overlapping */}
      <path
        d="M62 26C45.4315 26 32 39.4315 32 56C32 67.5712 38.548 77.6166 48 82.5204V89C48 90.6569 49.3431 92 51 92C51.7956 92 52.5587 91.6839 53.1213 91.1213L59.2426 85C59.4939 85 59.7461 85 60 85C76.5685 85 90 71.5685 90 55C90 38.4315 76.5685 26 62 26Z"
        fill="url(#pagueplayBlue)"
        filter="url(#pagueplayShadow)"
        opacity="0.96"
      />

      {/* Inner highlight dot for play/touch feeling */}
      <circle cx="58" cy="46" r="6" fill="#ffffff" fillOpacity="0.25" />
    </svg>
  );

  if (variant === 'icon') {
    return <div className={`inline-flex items-center ${className}`}>{IconSvg}</div>;
  }

  if (variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center justify-center p-2 rounded-2xl bg-white shadow-xs border border-slate-100 ${className}`}
      >
        {IconSvg}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 group select-none ${className}`}>
      {IconSvg}
      <div className="flex flex-col">
        <div className={`flex items-baseline tracking-tight font-extrabold ${iconDimensions.text}`}>
          <span className={textColorClass}>pague</span>
          <span className={theme === 'white' ? 'text-sky-200' : 'text-slate-500 font-bold'}>play</span>
        </div>
        {subtitle && (
          <span className={`tracking-wider uppercase text-[10px] font-semibold -mt-1 ${subColorClass}`}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
