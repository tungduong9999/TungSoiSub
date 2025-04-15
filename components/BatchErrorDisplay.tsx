"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCw } from "lucide-react";
import { SubtitleItem } from "@/components/SubtitleTranslator";

interface BatchErrorDisplayProps {
  failedBatches: { index: number; items: SubtitleItem[] }[];
  onRetryBatch: (batchIndex: number) => Promise<void>;
  isProcessing: boolean;
}

export default function BatchErrorDisplay({
  failedBatches,
  onRetryBatch,
  isProcessing,
}: BatchErrorDisplayProps) {
  const [retryingBatches, setRetryingBatches] = useState<number[]>([]);

  if (failedBatches.length === 0) {
    return null;
  }

  const handleRetry = (batchIndex: number) => {
    setRetryingBatches(prev => [...prev, batchIndex]);
    onRetryBatch(batchIndex)
      .then(() => {
        setRetryingBatches(prev => prev.filter(index => index !== batchIndex));
      })
      .catch(() => {
        setRetryingBatches(prev => prev.filter(index => index !== batchIndex));
      });
  };

  const handleRetryAll = () => {
    // Create a copy of the indices to retry
    const indicesToRetry = failedBatches.map(batch => batch.index);
    
    // Mark all batches as retrying
    setRetryingBatches(indicesToRetry);
    
    // Retry each batch sequentially
    const retrySequentially = async () => {
      for (const index of indicesToRetry) {
        try {
          await onRetryBatch(index);
        } catch (error) {
          console.error(`Error retrying batch ${index}:`, error);
        }
        // Remove this batch from retrying state regardless of success/failure
        setRetryingBatches(prev => prev.filter(i => i !== index));
      }
    };
    
    retrySequentially();
  };

  return (
    <div className="bg-rose-50 border border-rose-200 rounded-lg shadow-sm overflow-hidden mb-4">
      <div className="p-3 border-b border-rose-200 bg-rose-100/50 flex items-start gap-2">
        <AlertTriangle className="text-rose-500 h-5 w-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-medium text-rose-800">
            {failedBatches.length} failed {failedBatches.length === 1 ? "batch" : "batches"}
          </h3>
          <p className="text-sm text-rose-700">
            Each batch contains up to 10 subtitles. Retry failed batches to complete the translation.
          </p>
        </div>
        {failedBatches.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetryAll}
            disabled={isProcessing || retryingBatches.length > 0}
            className="bg-white border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 whitespace-nowrap"
          >
            Retry All
          </Button>
        )}
      </div>

      <div className="p-2 grid gap-2 max-h-[300px] overflow-y-auto">
        {failedBatches.map(({ index, items }) => {
          const isRetrying = retryingBatches.includes(index);
          const firstId = items[0]?.id;
          const lastId = items[items.length - 1]?.id;
          const errorMessage = items[0]?.error || "Translation error occurred";

          return (
            <div
              key={`batch-${index}`}
              className="p-2 border border-rose-100 rounded bg-white flex justify-between items-start gap-2"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-800 text-sm">Batch {index + 1}: Subtitle {firstId} → {lastId}</div>
                <div className="text-xs text-rose-600 truncate">{errorMessage}</div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={isRetrying || isProcessing}
                onClick={() => handleRetry(index)}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 px-2 flex-shrink-0"
              >
                {isRetrying ? (
                  <>
                    <RotateCw className="h-3 w-3 mr-1 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RotateCw className="h-3 w-3 mr-1" />
                    Retry Batch
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
} 