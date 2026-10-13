import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Sun } from 'lucide-react';

interface AppleCapsuleSliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
  color?: 'amber' | 'neutral' | 'indigo' | 'emerald';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPercentInside?: boolean;
  unit?: string;
  className?: string;
}

export const AppleCapsuleSlider: React.FC<AppleCapsuleSliderProps> = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  color = 'neutral',
  leftIcon,
  rightIcon,
  showPercentInside = true,
  unit = '٪',
  className = '',
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  // Sync internal state if prop changes externally
  useEffect(() => {
    if (!isDragging) {
      setLocalValue(value);
    }
  }, [value, isDragging]);

  const clampedValue = Math.min(max, Math.max(min, localValue));
  const percentage = Math.min(100, Math.max(0, ((clampedValue - min) / (max - min)) * 100));

  // Compute color styles
  const colorStyles = {
    amber: {
      gradient: 'from-amber-400 via-amber-500 to-amber-500',
      activeText: 'text-amber-950',
      glow: 'shadow-[0_0_15px_rgba(245,158,11,0.2)]',
    },
    neutral: {
      gradient: 'from-neutral-700 via-neutral-800 to-neutral-900',
      activeText: 'text-white',
      glow: 'shadow-[0_0_15px_rgba(0,0,0,0.2)]',
    },
    indigo: {
      gradient: 'from-indigo-500 via-indigo-600 to-indigo-600',
      activeText: 'text-white',
      glow: 'shadow-[0_0_15px_rgba(99,102,241,0.2)]',
    },
    emerald: {
      gradient: 'from-emerald-400 via-emerald-500 to-emerald-600',
      activeText: 'text-white',
      glow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]',
    },
  }[color];

  // Calculate value from pointer X coordinate (fluid left-to-right physics inside the capsule)
  const calculateValueFromPointer = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const trackWidth = rect.width;
      if (trackWidth <= 0) return;

      const offsetX = Math.max(0, Math.min(trackWidth, clientX - rect.left));
      const ratio = offsetX / trackWidth;
      const rawValue = min + ratio * (max - min);

      const stepped = Math.round(rawValue / step) * step;
      const finalVal = Math.min(max, Math.max(min, stepped));

      setLocalValue(finalVal);
      onChange(finalVal);
    },
    [min, max, step, onChange]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    calculateValueFromPointer(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    calculateValueFromPointer(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Safe catch
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    let nextVal = localValue;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      nextVal = Math.min(max, localValue + step);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      nextVal = Math.max(min, localValue - step);
    } else if (e.key === 'Home') {
      nextVal = min;
    } else if (e.key === 'End') {
      nextVal = max;
    } else {
      return;
    }
    e.preventDefault();
    setLocalValue(nextVal);
    onChange(nextVal);
  };

  return (
    <div className={`w-full select-none ${className}`}>
      {/* 
        Minimal Seamless Apple Capsule Slider (طراحی مینیمال یکپارچه کنترل‌سنتر آیفون - بدون هیچ سر اضافی که بیرون بزند)
      */}
      <div
        ref={trackRef}
        dir="ltr"
        role="slider"
        tabIndex={0}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={clampedValue}
        aria-label="اسلایدر کپسولی مینیمال"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        className={`relative w-full h-11 sm:h-12 bg-neutral-200/90 rounded-full cursor-pointer overflow-hidden flex items-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] border border-neutral-300/80 transition-transform focus:outline-none focus:ring-2 focus:ring-neutral-400/40 ${
          isDragging ? 'scale-[1.01]' : 'hover:border-neutral-400/80 active:scale-[0.99]'
        }`}
        style={{
          touchAction: 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* Seamless Filled Capsule Bar (پرشدگی یکپارچه و فیت داخل کپسول) */}
        <div
          className={`absolute left-0 top-0 bottom-0 bg-gradient-to-r ${colorStyles.gradient} rounded-full transition-all duration-75`}
          style={{
            width: `${percentage}%`,
            willChange: 'width',
          }}
        />

        {/* Embedded Left Dim Icon */}
        <div
          className={`absolute left-3.5 z-10 pointer-events-none flex items-center justify-center transition-colors duration-200 ${
            percentage > 12 ? 'text-white drop-shadow-xs' : 'text-neutral-500'
          }`}
        >
          {leftIcon || <Sun className="w-4 h-4 opacity-80" />}
        </div>

        {/* Embedded Right Bright Icon */}
        <div
          className={`absolute right-3.5 z-10 pointer-events-none flex items-center justify-center transition-colors duration-200 ${
            percentage > 90 ? 'text-white drop-shadow-xs' : 'text-neutral-500'
          }`}
        >
          {rightIcon || <Sun className="w-5 h-5" />}
        </div>

        {/* Center Minimal Live Value Readout (درصد خوانا و کاملاً مینیمال در مرکز کپسول) */}
        {showPercentInside && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
            <span
              className={`font-mono font-bold text-xs tracking-wide px-2.5 py-0.5 rounded-full transition-all duration-150 tabular-nums ${
                percentage > 50
                  ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]'
                  : 'text-neutral-700 font-extrabold'
              }`}
            >
              {clampedValue}
              {unit}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
