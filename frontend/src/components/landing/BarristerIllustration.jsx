import React from 'react';

export default function BarristerIllustration() {
  return (
    <div className="w-full lg:w-[38%] flex items-center justify-center p-6 sm:p-12 relative overflow-hidden select-none">
      <div className="absolute inset-0 bg-radial-gradient from-court-gold/10 via-transparent to-transparent opacity-30 pointer-events-none"></div>

      <div className="w-full max-w-[340px] lg:max-w-full flex justify-center items-center relative animate-float">
        <svg
          viewBox="0 0 400 700"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto max-h-[80vh]"
        >
          <circle cx="280" cy="210" r="100" fill="url(#scale-glow)" opacity="0.45" />

          <path
            d="M50 700 C80 570 120 440 150 400 C140 350 145 310 150 260 C130 260 110 280 100 310 L70 340 C60 320 65 290 85 260 C110 220 140 210 170 210 C160 175 165 150 180 130 C195 110 215 110 230 130 C245 150 250 175 240 210 C270 210 300 225 315 250 L345 230 C360 250 355 270 340 290 L310 310 C312 330 310 350 300 400 C330 440 370 570 400 700 Z"
            fill="#120c06"
          />

          <path
            d="M150 400 C165 490 175 600 185 700"
            stroke="#d4a820"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.25"
          />
          <path
            d="M250 400 C235 490 225 600 215 700"
            stroke="#d4a820"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.25"
          />

          <path
            d="M194 210 L189 250 L199 250 Z M214 210 L219 250 L209 250 Z"
            fill="#e8e0d0"
          />
          <path
            d="M184 210 C194 195 214 195 224 210 Z"
            fill="#e8e0d0"
            stroke="#120c06"
            strokeWidth="1.5"
          />

          <path
            d="M240 210 C260 180 280 140 280 110 C280 100 275 95 270 100 L260 120 C250 140 240 185 240 210 Z"
            fill="#120c06"
          />
          <circle cx="280" cy="100" r="8" fill="#d4a820" />

          <path
            d="M200 120 L360 120"
            stroke="#d4a820"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <path
            d="M280 100 L280 180"
            stroke="#d4a820"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <circle cx="280" cy="120" r="6" fill="#d4a820" />

          <path d="M200 120 L185 170 M200 120 L215 170" stroke="#d4a820" strokeWidth="1.2" />
          <path d="M180 170 C180 177 220 177 220 170 Z" fill="#d4a820" />

          <path d="M360 120 L345 170 M360 120 L375 170" stroke="#d4a820" strokeWidth="1.2" />
          <path d="M340 170 C340 177 380 177 380 170 Z" fill="#d4a820" />

          <defs>
            <radialGradient
              id="scale-glow"
              cx="50%"
              cy="50%"
              r="50%"
              fx="50%"
              fy="50%"
            >
              <stop offset="0%" stopColor="#d4a820" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#d4a820" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
