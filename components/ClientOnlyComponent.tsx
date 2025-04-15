"use client";

import React, { useState, useEffect, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface FailedChunk {
  index: number;
  sentences: string[];
}

interface ClientOnlyComponentProps {
  failedChunks: FailedChunk[];
  loading: boolean;
  chunkSize: number;
  retrying: number[];
  parsedBlocksLength: number;
  onRetry: (index: number, sentences: string[]) => Promise<void>;
  onRetryAll: () => void;
}

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that only renders its children on the client side
 * Useful for components that use browser APIs or need to avoid hydration errors
 */
export default function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export function ClientOnlyComponent({
  failedChunks,
  loading,
  chunkSize,
  retrying,
  parsedBlocksLength,
  onRetry,
  onRetryAll
}: ClientOnlyComponentProps) {
  if (failedChunks.length === 0 || loading) {
    return null;
  }
  
  // Debug info
  console.log(`ClientOnlyComponent: Hiển thị ${failedChunks.length} nhóm thất bại`);
  
  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-yellow-800">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <h3 className="font-medium">Có {failedChunks.length} nhóm câu chưa dịch thành công</h3>
          </div>
          <p className="text-sm text-yellow-700">
            Bạn có thể thử lại từng nhóm bằng cách nhấn vào nút bên dưới.
          </p>
          <div className="space-y-2 mt-2">
            {failedChunks.map((chunk) => {
              const startSentence = chunk.index * chunkSize + 1;
              const endSentence = Math.min(startSentence + chunk.sentences.length - 1, parsedBlocksLength);
              const isRetrying = retrying.includes(chunk.index);
              
              return (
                <div key={`failed-${chunk.index}`} className="flex items-center justify-between p-2 border border-yellow-200 bg-yellow-50 rounded">
                  <div>
                    <span className="font-medium">Nhóm {chunk.index + 1}:</span> Câu {startSentence} - {endSentence}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={isRetrying}
                    onClick={() => onRetry(chunk.index, chunk.sentences)}
                    className="text-xs bg-white"
                  >
                    {isRetrying ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang thử lại...
                      </>
                    ) : (
                      <>
                        <svg className="mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Thử lại
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              disabled={retrying.length > 0}
              onClick={onRetryAll}
            >
              Thử lại tất cả các nhóm
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}