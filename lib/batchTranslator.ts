"use client";

import { translateWithGemini } from "@/lib/geminiApi";
import { SubtitleItem } from "@/components/SubtitleTranslator";

export interface BatchTranslationResult {
  batchIndex: number; // Chỉ số của batch
  results: {
    success: boolean;
    items: SubtitleItem[];
    error?: string;
  };
}

export interface BatchConfig {
  batchSize: number; // Số câu trong mỗi batch
  concurrentBatches: number; // Số batch xử lý đồng thời
  retryCount: number; // Số lần thử lại
}

const DEFAULT_BATCH_CONFIG: BatchConfig = {
  batchSize: 10,
  concurrentBatches: 5,
  retryCount: 3
};

/**
 * Xử lý dịch nhiều batch đồng thời và tự động retry nếu lỗi
 */
export class BatchTranslator {
  private config: BatchConfig;
  private failedBatches: Map<number, SubtitleItem[]> = new Map();
  private isTranslating: boolean = false;
  private onResultCallback: (result: BatchTranslationResult) => void;
  private onCompleteCallback: () => void;
  private abortController = new AbortController();

  constructor(
    config: Partial<BatchConfig> = {},
    onResult: (result: BatchTranslationResult) => void = () => {},
    onComplete: () => void = () => {}
  ) {
    this.config = { ...DEFAULT_BATCH_CONFIG, ...config };
    this.onResultCallback = onResult;
    this.onCompleteCallback = onComplete;
  }

  /**
   * Bắt đầu quá trình dịch
   * @param subtitles Mảng các subtitle cần dịch
   * @param targetLanguage Ngôn ngữ đích
   * @param promptTemplate Mẫu prompt
   */
  async startTranslation(
    subtitles: SubtitleItem[],
    targetLanguage: string,
    promptTemplate: string
  ): Promise<void> {
    if (this.isTranslating) {
      throw new Error("Translation is already in progress");
    }

    this.isTranslating = true;
    this.failedBatches.clear();
    this.abortController = new AbortController();

    try {
      // Tạo các batch từ mảng subtitles
      const batches: SubtitleItem[][] = [];
      for (let i = 0; i < subtitles.length; i += this.config.batchSize) {
        batches.push(subtitles.slice(i, i + this.config.batchSize));
      }

      // Xử lý các batch theo số lượng concurrent
      for (let i = 0; i < batches.length; i += this.config.concurrentBatches) {
        if (this.abortController.signal.aborted) {
          break;
        }

        const batchPromises = batches
          .slice(i, i + this.config.concurrentBatches)
          .map((batch, idx) => this.processBatch(i + idx, batch, targetLanguage, promptTemplate));

        // Chờ tất cả batch trong nhóm concurrent này hoàn thành (Promise.allSettled đảm bảo sẽ không dừng khi có lỗi)
        await Promise.allSettled(batchPromises);
      }
    } finally {
      this.isTranslating = false;
      this.onCompleteCallback();
    }
  }

  /**
   * Xử lý một batch
   */
  private async processBatch(
    batchIndex: number,
    batch: SubtitleItem[],
    targetLanguage: string,
    promptTemplate: string,
    retryCount: number = 0
  ): Promise<void> {
    try {
      // Tạo một bản sao của batch để không làm thay đổi dữ liệu gốc
      const updatedBatch = [...batch];
      
      // Cập nhật trạng thái đang dịch
      updatedBatch.forEach(item => {
        item.status = "translating";
      });
      
      // Gọi callback để cập nhật UI
      this.onResultCallback({
        batchIndex,
        results: {
          success: false, // Chưa thành công, mới bắt đầu dịch
          items: updatedBatch
        }
      });

      // Chuẩn bị dữ liệu cho API
      const textsToTranslate = batch.map(item => item.text);
      const finalPrompt = promptTemplate.replace('{language}', targetLanguage);
      
      // Thêm context của các câu trước đó nếu cần
      // TODO: Triển khai thêm context cho mỗi batch

      // Gọi API để dịch
      const translatedResults = await translateWithGemini({
        texts: textsToTranslate,
        targetLanguage,
        prompt: finalPrompt,
        context: ""
      });

      // Kiểm tra xem có lỗi không
      const hasError = translatedResults.some(r => !!r.error);
      
      if (hasError) {
        // Nếu có lỗi và vẫn còn lần thử lại
        if (retryCount < this.config.retryCount) {
          console.log(`Batch ${batchIndex} failed, retrying (${retryCount + 1}/${this.config.retryCount})...`);
          
          // Đợi một chút trước khi thử lại
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          return this.processBatch(batchIndex, batch, targetLanguage, promptTemplate, retryCount + 1);
        }
        
        // Đã hết số lần thử, đánh dấu là lỗi
        updatedBatch.forEach((item, idx) => {
          item.status = "error";
          item.error = translatedResults[idx]?.error || "Translation failed after multiple retries";
        });
        
        // Lưu các batch lỗi để có thể thử lại thủ công
        this.failedBatches.set(batchIndex, updatedBatch);
      } else {
        // Cập nhật kết quả dịch
        updatedBatch.forEach((item, idx) => {
          item.translatedText = translatedResults[idx]?.text || "";
          item.status = "translated";
          item.error = undefined;
        });
      }

      // Gọi callback với kết quả
      this.onResultCallback({
        batchIndex,
        results: {
          success: !hasError,
          items: updatedBatch,
          error: hasError ? "One or more translations failed" : undefined
        }
      });
    } catch (error) {
      console.error(`Error processing batch ${batchIndex}:`, error);
      
      if (retryCount < this.config.retryCount) {
        console.log(`Batch ${batchIndex} failed with exception, retrying (${retryCount + 1}/${this.config.retryCount})...`);
        
        // Đợi một chút trước khi thử lại
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return this.processBatch(batchIndex, batch, targetLanguage, promptTemplate, retryCount + 1);
      }
      
      // Đã hết số lần thử, đánh dấu tất cả các câu trong batch là lỗi
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      const failedItems = batch.map(item => ({
        ...item,
        status: "error" as const,
        error: errorMessage
      }));
      
      // Lưu batch lỗi
      this.failedBatches.set(batchIndex, failedItems);
      
      // Gọi callback với kết quả lỗi
      this.onResultCallback({
        batchIndex,
        results: {
          success: false,
          items: failedItems,
          error: errorMessage
        }
      });
    }
  }

  /**
   * Thử lại một batch đã lỗi
   */
  async retryBatch(
    batchIndex: number,
    targetLanguage: string,
    promptTemplate: string
  ): Promise<void> {
    const batch = this.failedBatches.get(batchIndex);
    if (!batch) {
      throw new Error(`No failed batch found with index ${batchIndex}`);
    }

    return this.processBatch(batchIndex, batch, targetLanguage, promptTemplate);
  }

  /**
   * Dừng quá trình dịch
   */
  stop(): void {
    this.abortController.abort();
  }

  /**
   * Lấy danh sách các batch đã thất bại
   */
  getFailedBatches(): [number, SubtitleItem[]][] {
    return Array.from(this.failedBatches.entries());
  }
} 