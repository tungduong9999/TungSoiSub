"use client";

export default function TranslatorSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* API Key Input Skeleton */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-start gap-3 mb-4">
          <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-5 w-48 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-64 bg-gray-100 rounded"></div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-10 w-full bg-gray-100 rounded"></div>
          <div className="h-4 w-40 bg-gray-100 rounded"></div>
          <div className="flex justify-end">
            <div className="h-8 w-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>

      {/* File Upload and Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* File Upload Skeleton */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="h-5 w-32 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-48 bg-gray-100 rounded mb-4"></div>
          <div className="h-10 bg-gray-100 rounded"></div>
        </div>

        {/* Translation Settings Skeleton */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="h-5 w-40 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-56 bg-gray-100 rounded mb-4"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="h-4 w-28 bg-gray-200 rounded mb-2"></div>
              <div className="h-10 bg-gray-100 rounded"></div>
            </div>
            <div>
              <div className="h-4 w-28 bg-gray-200 rounded mb-2"></div>
              <div className="h-20 bg-gray-100 rounded"></div>
            </div>
          </div>
          
          <div className="mt-4 space-y-3">
            <div className="flex justify-between mt-4">
              <div className="h-10 w-32 bg-gray-200 rounded"></div>
              <div className="h-10 w-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 