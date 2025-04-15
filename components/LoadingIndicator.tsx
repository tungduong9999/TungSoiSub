"use client";

import React from "react";

interface LoadingIndicatorProps {
  progress?: number;
  showPercentage?: boolean;
  isPaused?: boolean;
}

export default function LoadingIndicator({ 
  progress = 0, 
  showPercentage = true,
  isPaused = false
}: LoadingIndicatorProps) {
  return (
    <div className="flex items-center space-x-3">
      <div className="flex-1">
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ease-out ${
              isPaused ? 'bg-amber-400' : 'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      {showPercentage && (
        <div className={`text-sm font-medium w-12 text-right tabular-nums ${
          isPaused ? 'text-amber-600' : 'text-gray-600'
        }`}>
          {progress}%
        </div>
      )}
    </div>
  );
} 