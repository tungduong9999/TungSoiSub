"use client";

import { useState, useEffect, useRef } from "react";
import { parse, stringify } from "@/lib/srtUtils";
import { translateWithGemini, setApiKey, getApiKey } from "@/lib/geminiApi";
import type { TranslationResult } from "@/lib/geminiApi";
import SubtitleTable from "@/components/SubtitleTable";
import LanguageSelector from "@/components/LanguageSelector";
import LoadingIndicator from "@/components/LoadingIndicator";
import ApiKeyInput from "@/components/ApiKeyInput";
import ClientOnly from "@/components/ClientOnlyComponent";
import BatchErrorDisplay from "@/components/BatchErrorDisplay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { saveAs } from "file-saver";
import { ChevronDown, ChevronUp, Globe, AlertCircle, PauseCircle, PlayCircle, StopCircle, X } from "lucide-react";

// Define subtitle item interface
export interface SubtitleItem {
  id: number;
  startTime: string;
  endTime: string;
  text: string;
  translatedText: string;
  status: "pending" | "translating" | "translated" | "error";
  error?: string;
}

// Define types for parsed SRT item
interface ParsedSubtitle {
  id: number;
  startTime: string;
  endTime: string;
  text: string;
}

const BATCH_SIZE = 10; // Number of subtitles to translate in a batch
const MAX_BATCH_SIZE = 30; // Maximum number of subtitles in one large batch
const RATE_LIMIT_DELAY = 2000; // Delay between batches in milliseconds

export default function SubtitleTranslator() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [subtitles, setSubtitles] = useState<SubtitleItem[]>([]);
  const [translating, setTranslating] = useState<boolean>(false);
  const [targetLanguage, setTargetLanguage] = useState<string>("Vietnamese");
  const [customPrompt, setCustomPrompt] = useState<string>(
    "Translate the following subtitle to {language}. Maintain the original tone, style, and nuances. Keep it concise to fit the subtitle timing."
  );
  const [translationProgress, setTranslationProgress] = useState<number>(0);
  const [apiKeyProvided, setApiKeyProvided] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [failedBatches, setFailedBatches] = useState<{ index: number; items: SubtitleItem[] }[]>([]);
  const [isSettingsCollapsed, setIsSettingsCollapsed] = useState<boolean>(false);
  const [isSubtitleTableCollapsed, setIsSubtitleTableCollapsed] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pauseStateRef = useRef<boolean>(false);

  // Cập nhật pauseStateRef khi isPaused thay đổi
  useEffect(() => {
    pauseStateRef.current = isPaused;
    console.log(`Pause state changed to: ${isPaused}`);
  }, [isPaused]);

  // Xử lý khi người dùng cung cấp API key
  const handleApiKeyChange = (apiKey: string) => {
    setApiKey(apiKey);
    setApiKeyProvided(!!apiKey);
    
    // Xóa thông báo lỗi nếu đã cung cấp API key
    if (!!apiKey && validationError?.includes("Gemini API key")) {
      setValidationError(null);
    }
  };

  // Clear current file and subtitles
  const handleClearFile = () => {
    setFile(null);
    setFileName("");
    setSubtitles([]);
    setTranslationProgress(0);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Xác thực đầu vào trước khi dịch
  const validateBeforeTranslate = () => {
    // Kiểm tra API key
    if (!getApiKey()) {
      setValidationError("Vui lòng nhập Gemini API key trước khi dịch");
      return false;
    }
    
    // Kiểm tra file SRT
    if (!file || subtitles.length === 0) {
      setValidationError("Vui lòng tải lên file phụ đề SRT trước khi dịch");
      return false;
    }
    
    // Nếu tất cả đều hợp lệ, xóa thông báo lỗi
    setValidationError(null);
    return true;
  };

  // Tạm dừng hoặc tiếp tục dịch
  const handlePauseResume = () => {
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);
    pauseStateRef.current = newPausedState;
    console.log(`Pause state set to: ${newPausedState}`);
  };

  // Dừng hoàn toàn quá trình dịch
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Reset trạng thái của các subtitle đang dịch về pending
    setSubtitles(prev => prev.map(sub => 
      sub.status === "translating" 
        ? { ...sub, status: "pending", error: undefined } 
        : sub
    ));
    
    setTranslating(false);
    setIsPaused(false);
    setTranslationProgress(0);
  };

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setTranslationProgress(0);
    setValidationError(null);

    try {
      const content = await selectedFile.text();
      const parsedSubtitles = parse(content);
      
      // Initialize subtitle items with status
      const subtitleItems: SubtitleItem[] = parsedSubtitles.map((sub: ParsedSubtitle, index: number) => ({
        id: index + 1,
        startTime: sub.startTime,
        endTime: sub.endTime,
        text: sub.text,
        translatedText: "",
        status: "pending"
      }));
      
      setSubtitles(subtitleItems);
    } catch (error) {
      console.error("Error parsing the SRT file:", error);
      setValidationError("Không thể phân tích file SRT. Vui lòng đảm bảo file có định dạng SRT hợp lệ.");
    }
  };

  // Start translation process
  const handleTranslate = async () => {
    // Xác thực đầu vào và dừng nếu có lỗi
    if (!validateBeforeTranslate()) {
      return;
    }
    
    setTranslating(true);
    setFailedBatches([]); // Xóa danh sách batch lỗi cũ khi bắt đầu dịch lại
    setIsPaused(false);
    pauseStateRef.current = false;
    setTranslationError(null); // Reset thông báo lỗi dịch
    
    // Tạo abort controller mới
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    try {
      // Clone the subtitles array to avoid mutation during iteration
      const updatedSubtitles = [...subtitles];
      const pendingSubtitles = updatedSubtitles.filter(sub => 
        sub.status === "pending" || sub.status === "error"
      );
      
      console.log(`Translating ${pendingSubtitles.length} subtitles`);
      
      // Process subtitles in batches
      const newFailedBatches: { index: number; items: SubtitleItem[] }[] = [];
      
      // Xác định kích thước batch dựa vào số lượng phụ đề
      // Nếu có nhiều phụ đề, tăng kích thước batch để giảm số lần gọi API
      const dynamicBatchSize = pendingSubtitles.length > 100 
        ? MAX_BATCH_SIZE // Nếu có nhiều phụ đề (>100), sử dụng batch lớn
        : BATCH_SIZE; // Ngược lại, sử dụng kích thước batch mặc định
      
      console.log(`Using batch size: ${dynamicBatchSize}`);
      
      for (let i = 0; i < pendingSubtitles.length; i += dynamicBatchSize) {
        // Kiểm tra nếu đã abort
        if (signal.aborted) {
          console.log("Translation process aborted");
          throw new Error("Translation aborted");
        }
        
        // Đợi nếu đang tạm dừng - sử dụng ref thay vì state trực tiếp
        while (pauseStateRef.current) {
          if (signal.aborted) {
            console.log("Translation process aborted while paused");
            throw new Error("Translation aborted");
          }
          console.log("Paused, waiting...");
          // Sử dụng await-sleep dài hơn để giảm CPU usage
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        const batchIndex = Math.floor(i / dynamicBatchSize);
        const batch = pendingSubtitles.slice(i, i + dynamicBatchSize);
        
        console.log(`Processing batch ${batchIndex + 1}: ${batch.length} items, isPaused: ${pauseStateRef.current}`);
        
        // Update status to translating for this batch
        batch.forEach(sub => {
          const index = updatedSubtitles.findIndex(s => s.id === sub.id);
          if (index !== -1) {
            updatedSubtitles[index].status = "translating";
          }
        });
        setSubtitles([...updatedSubtitles]);
        
        // Process batch with history/context
        try {
          await processBatchWithContext(batch, updatedSubtitles);
        } catch (batchError) {
          // Nếu lỗi là do abort thì không xử lý retry
          if (signal.aborted) {
            throw batchError;
          }
          
          console.error(`Batch ${batchIndex} failed:`, batchError);
          
          // Nếu batch lớn bị lỗi, thử chia nhỏ thành các batch nhỏ hơn
          if (batch.length > BATCH_SIZE) {
            console.log(`Retrying batch ${batchIndex} with smaller sub-batches...`);
            let anySubBatchSucceeded = false;
            
            // Chia thành các sub-batch nhỏ hơn
            for (let j = 0; j < batch.length; j += BATCH_SIZE) {
              const subBatch = batch.slice(j, j + BATCH_SIZE);
              const subBatchIndex = batchIndex * (dynamicBatchSize / BATCH_SIZE) + Math.floor(j / BATCH_SIZE);
              
              try {
                await processBatchWithContext(subBatch, updatedSubtitles);
                anySubBatchSucceeded = true;
              } catch (subBatchError) {
                console.error(`Sub-batch ${subBatchIndex} failed:`, subBatchError);
                // Lưu lại batch bị lỗi
                newFailedBatches.push({
                  index: subBatchIndex,
                  items: subBatch.map(item => ({
                    ...item,
                    status: "error",
                    error: subBatchError instanceof Error ? subBatchError.message : "Failed to translate sub-batch"
                  }))
                });
              }
            }
            
            // Nếu tất cả sub-batch đều thất bại, lưu lại batch lớn ban đầu
            if (!anySubBatchSucceeded) {
              newFailedBatches.push({
                index: batchIndex,
                items: batch.map(item => ({
                  ...item,
                  status: "error",
                  error: batchError instanceof Error ? batchError.message : "Failed to translate batch"
                }))
              });
            }
          } else {
            // Nếu là batch nhỏ, lưu lại luôn
            newFailedBatches.push({
              index: batchIndex,
              items: batch.map(item => ({
                ...item,
                status: "error",
                error: batchError instanceof Error ? batchError.message : "Failed to translate batch"
              }))
            });
          }
        }
        
        // Update progress
        setTranslationProgress(Math.min(100, Math.round(((i + batch.length) / pendingSubtitles.length) * 100)));
      }
      
      setTranslationProgress(100);
      
      // Cập nhật danh sách batch lỗi
      if (newFailedBatches.length > 0) {
        console.log(`${newFailedBatches.length} batches failed`);
        setFailedBatches(newFailedBatches);
      }
    } catch (error) {
      console.error("Translation process error:", error);
      
      // Kiểm tra nếu lỗi là do người dùng chủ động dừng
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      if (!errorMessage.includes("aborted") && !errorMessage.includes("Translation aborted")) {
        // Hiển thị lỗi trong UI với translationError state
        setTranslationError(`Có lỗi xảy ra trong quá trình dịch: ${errorMessage}`);
      } else {
        console.log("Translation was stopped by user");
      }
    } finally {
      setTranslating(false);
    }
  };

  // Process a batch of subtitles with context
  const processBatchWithContext = async (batch: SubtitleItem[], allSubtitles: SubtitleItem[]) => {
    // Kiểm tra nếu đã abort
    if (abortControllerRef.current?.signal.aborted) {
      throw new Error("Translation aborted");
    }
    
    if (!batch || batch.length === 0) {
      throw new Error("Empty batch provided");
    }
    
    // Gather previous context (last 3 translated subtitles before this batch)
    const firstSubInBatch = batch[0];
    const firstSubIndex = allSubtitles.findIndex(s => s.id === firstSubInBatch.id);
    
    const context: { original: string; translated: string }[] = [];
    
    // Get up to 3 previous subtitles as context if they have translations
    for (let i = Math.max(0, firstSubIndex - 3); i < firstSubIndex; i++) {
      if (allSubtitles[i].status === "translated" && allSubtitles[i].translatedText) {
        context.push({
          original: allSubtitles[i].text,
          translated: allSubtitles[i].translatedText
        });
      }
    }
    
    // Create a prompt with context
    const contextStr = context.length > 0 
      ? `Context from previous subtitles:\n${context.map(c => `Original: ${c.original}\nTranslation: ${c.translated}`).join('\n\n')}\n\nNow translate the following subtitles:`
      : '';
    
    const finalPrompt = customPrompt.replace('{language}', targetLanguage);
    
    try {
      // Kiểm tra xem có đang tạm dừng không trước khi gửi batch để dịch
      while (pauseStateRef.current) {
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error("Translation aborted while paused");
        }
        console.log("Batch processing paused, waiting...");
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Send the batch for translation
      const textsToTranslate = batch.map(sub => sub.text);
      
      console.log(`Translating batch with ${textsToTranslate.length} items`);
      
      // Nếu batch quá lớn (>30 item), chia thành các phần nhỏ hơn để dịch
      // nhưng vẫn giữ trong cùng một promise để vẫn được xử lý song song
      let translatedTexts: TranslationResult[] = [];
      
      if (textsToTranslate.length > 30) {
        console.log(`Batch size > 30, splitting into chunks of 30...`);
        
        // Chia batch thành các phần nhỏ hơn, mỗi phần tối đa 30 item
        const chunks: string[][] = [];
        for (let i = 0; i < textsToTranslate.length; i += 30) {
          chunks.push(textsToTranslate.slice(i, i + 30));
        }
        
        // Dịch từng phần và thu thập kết quả
        const chunkPromises = chunks.map((chunk, index) => {
          return (async () => {
            // Kiểm tra trạng thái tạm dừng trước khi dịch mỗi chunk
            while (pauseStateRef.current) {
              if (abortControllerRef.current?.signal.aborted) {
                throw new Error("Translation aborted while paused");
              }
              console.log(`Chunk ${index} processing paused, waiting...`);
              await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // Dịch chunk
            return translateWithGemini({
              texts: chunk,
              targetLanguage,
              prompt: finalPrompt,
              context: `${contextStr}${index > 0 ? ' (continued)' : ''}`
            });
          })();
        });
        
        const chunkResults = await Promise.all(chunkPromises);
        
        // Gộp kết quả từ các phần
        translatedTexts = chunkResults.flat();
      } else {
        // Nếu batch kích thước vừa phải, dịch tất cả cùng lúc
        translatedTexts = await translateWithGemini({
          texts: textsToTranslate,
          targetLanguage,
          prompt: finalPrompt,
          context: contextStr
        });
      }
      
      // Kiểm tra xem có lỗi trong kết quả không
      const hasErrors = translatedTexts.some(result => !!result.error);
      
      // Nếu tất cả các phần tử đều bị lỗi, ném một lỗi để cho batch retry xử lý
      if (hasErrors && translatedTexts.every(result => !!result.error)) {
        throw new Error(translatedTexts[0]?.error || "Failed to translate all items in batch");
      }
      
      // Update the subtitles with translations
      const updatedSubtitles = [...allSubtitles];
      
      batch.forEach((sub, index) => {
        const subIndex = updatedSubtitles.findIndex(s => s.id === sub.id);
        if (subIndex !== -1) {
          if (translatedTexts[index]?.error) {
            updatedSubtitles[subIndex].status = "error";
            updatedSubtitles[subIndex].error = translatedTexts[index].error;
          } else {
            updatedSubtitles[subIndex].translatedText = translatedTexts[index]?.text || "";
            updatedSubtitles[subIndex].status = "translated";
            updatedSubtitles[subIndex].error = undefined;
          }
        }
      });
      
      setSubtitles(updatedSubtitles);
      
      // Nếu có một số lỗi nhưng không phải tất cả, cũng báo lỗi để batch retry có thể xử lý
      if (hasErrors) {
        const numErrors = translatedTexts.filter(result => !!result.error).length;
        throw new Error(`Failed to translate ${numErrors} of ${batch.length} items in batch`);
      }
    } catch (error) {
      console.error("Batch translation error:", error);
      
      // Mark all subtitles in the batch as error
      const updatedSubtitles = [...allSubtitles];
      batch.forEach(sub => {
        const subIndex = updatedSubtitles.findIndex(s => s.id === sub.id);
        if (subIndex !== -1) {
          updatedSubtitles[subIndex].status = "error";
          updatedSubtitles[subIndex].error = error instanceof Error 
            ? error.message 
            : "Failed to translate this batch";
        }
      });
      
      setSubtitles(updatedSubtitles);
      
      // Re-throw the error để caller có thể xử lý
      throw error;
    }
  };

  // Retry translating a specific subtitle
  const handleRetrySubtitle = async (id: number) => {
    const subtitleIndex = subtitles.findIndex(sub => sub.id === id);
    if (subtitleIndex === -1) return;
    
    const subtitle = subtitles[subtitleIndex];
    const updatedSubtitles = [...subtitles];
    
    updatedSubtitles[subtitleIndex].status = "translating";
    setSubtitles(updatedSubtitles);
    
    // Tạo abort controller mới nếu chưa có
    if (!abortControllerRef.current) {
      abortControllerRef.current = new AbortController();
    }
    
    try {
      // Kiểm tra trạng thái tạm dừng trước khi dịch
      while (pauseStateRef.current) {
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error("Translation aborted while paused");
        }
        console.log("Subtitle retry paused, waiting...");
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Get a few previous subtitles for context
      const context: { original: string; translated: string }[] = [];
      for (let i = Math.max(0, subtitleIndex - 3); i < subtitleIndex; i++) {
        if (updatedSubtitles[i].status === "translated" && updatedSubtitles[i].translatedText) {
          context.push({
            original: updatedSubtitles[i].text,
            translated: updatedSubtitles[i].translatedText
          });
        }
      }
      
      const contextStr = context.length > 0 
        ? `Context from previous subtitles:\n${context.map(c => `Original: ${c.original}\nTranslation: ${c.translated}`).join('\n\n')}\n\nNow translate the following subtitle:`
        : '';
      
      const finalPrompt = customPrompt.replace('{language}', targetLanguage);
      
      // Sử dụng API batch translation nhưng chỉ với một phần tử
      const translatedResult = await translateWithGemini({
        texts: [subtitle.text],
        targetLanguage,
        prompt: finalPrompt,
        context: contextStr
      });
      
      // Kiểm tra nếu đã abort trong quá trình dịch
      if (abortControllerRef.current?.signal.aborted) {
        throw new Error("Translation aborted");
      }
      
      // Cập nhật kết quả
      if (translatedResult[0]?.error) {
        updatedSubtitles[subtitleIndex].status = "error";
        updatedSubtitles[subtitleIndex].error = translatedResult[0].error;
      } else {
        updatedSubtitles[subtitleIndex].translatedText = translatedResult[0]?.text || "";
        updatedSubtitles[subtitleIndex].status = "translated";
        updatedSubtitles[subtitleIndex].error = undefined;
        
        // Nếu dịch thành công, kiểm tra xem phụ đề này có thuộc batch nào đã thất bại không
        // và cập nhật trạng thái của batch đó nếu cần
        const batchIndex = Math.floor((id - 1) / BATCH_SIZE);
        
        setFailedBatches(prevBatches => {
          const updatedBatches = [...prevBatches];
          const batchToUpdateIndex = updatedBatches.findIndex(b => b.index === batchIndex);
          
          if (batchToUpdateIndex !== -1) {
            // Cập nhật item trong batch thất bại
            const updatedItems = updatedBatches[batchToUpdateIndex].items.map(item => {
              if (item.id === id) {
                return {
                  ...item,
                  status: "translated" as const,
                  translatedText: translatedResult[0].text,
                  error: undefined
                };
              }
              return item;
            });
            
            // Kiểm tra xem tất cả các item trong batch đã được dịch thành công chưa
            const allTranslated = updatedItems.every(item => item.status === "translated");
            
            if (allTranslated) {
              // Nếu tất cả đã dịch thành công, loại bỏ batch này khỏi danh sách thất bại
              return updatedBatches.filter((_, index) => index !== batchToUpdateIndex);
            } else {
              // Cập nhật items trong batch
              updatedBatches[batchToUpdateIndex].items = updatedItems;
              return updatedBatches;
            }
          }
          
          return prevBatches;
        });
      }
    } catch (error) {
      updatedSubtitles[subtitleIndex].status = "error";
      updatedSubtitles[subtitleIndex].error = error instanceof Error 
        ? error.message 
        : "Failed to translate";
    } finally {
      setSubtitles([...updatedSubtitles]);
    }
  };

  // Export translated subtitles as SRT file
  const handleExport = () => {
    if (!window || subtitles.length === 0 || !fileName) return;
    
    // Create SRT content with translations
    const srtContent = stringify(subtitles.map(sub => ({
      id: sub.id,
      startTime: sub.startTime,
      endTime: sub.endTime,
      text: sub.translatedText || sub.text // Use original text as fallback if translation is missing
    })));
    
    // Generate file name with language indication
    const origName = fileName.replace(/\.srt$/i, '');
    const newFileName = `${origName}_${targetLanguage.toLowerCase()}.srt`;
    
    // Create and download the file
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, newFileName);
  };

  // Update subtitle manually
  const handleUpdateSubtitle = (id: number, translatedText: string) => {
    setSubtitles(prevSubtitles => 
      prevSubtitles.map(sub => 
        sub.id === id 
          ? { ...sub, translatedText, status: "translated" } 
          : sub
      )
    );
  };

  // Retry a batch of subtitles
  const handleRetryBatch = async (batchIndex: number) => {
    const batchToRetry = failedBatches.find(batch => batch.index === batchIndex);
    if (!batchToRetry) return;
    
    const updatedSubtitles = [...subtitles];
    
    // Update status to translating for all subtitles in this batch
    batchToRetry.items.forEach(item => {
      const subIndex = updatedSubtitles.findIndex(s => s.id === item.id);
      if (subIndex !== -1) {
        updatedSubtitles[subIndex].status = "translating";
      }
    });
    
    setSubtitles(updatedSubtitles);
    
    // Tạo abort controller mới nếu chưa có
    if (!abortControllerRef.current) {
      abortControllerRef.current = new AbortController();
    }
    
    try {
      // Process the batch
      await processBatchWithContext(batchToRetry.items, updatedSubtitles);
      
      // If successful, remove this batch from failedBatches
      setFailedBatches(prev => prev.filter(batch => batch.index !== batchIndex));
      
      return Promise.resolve();
    } catch (error) {
      console.error(`Error retrying batch ${batchIndex}:`, error);
      
      // Không cập nhật lại lỗi nếu là do abort
      if (abortControllerRef.current?.signal.aborted) {
        return Promise.reject(error);
      }
      
      // Update error message but keep batch in failed batches
      setFailedBatches(prev => 
        prev.map(batch => 
          batch.index === batchIndex
            ? {
                ...batch,
                items: batch.items.map(item => ({
                  ...item,
                  error: error instanceof Error ? error.message : "Failed to translate after retry"
                }))
              }
            : batch
        )
      );
      
      return Promise.reject(error);
    }
  };

  return (
    <div className="space-y-4">
      {/* API Key Input */}
      <ApiKeyInput onApiKeyChange={handleApiKeyChange} />

      {apiKeyProvided && (
        <>
          {/* Hiển thị lỗi dịch (nếu có) */}
          {translationError && (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-md relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-2 top-2 h-6 w-6 text-gray-400 hover:text-gray-500"
                onClick={() => setTranslationError(null)}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-rose-800">Lỗi dịch phụ đề</h3>
                  <p className="text-sm text-rose-700 mt-1">{translationError}</p>
                  <p className="text-xs text-rose-600 mt-2">
                    Bạn có thể kiểm tra các phụ đề lỗi và thử lại từng phụ đề hoặc từng batch.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* File Upload and Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* File Upload */}
            <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h2 className="text-lg font-medium mb-2">Select SRT File</h2>
              <p className="text-sm text-gray-500 mb-3">
                Choose an SRT subtitle file to translate
              </p>
              
              <ClientOnly>
                <div className="flex justify-between items-center">
                  <div className="w-full">
                    <Input
                      type="file"
                      ref={fileInputRef}
                      accept=".srt"
                      onChange={handleFileChange}
                      className={`w-full cursor-pointer ${!file && validationError?.includes("SRT") ? 'border-rose-400' : ''}`}
                    />
                  </div>
                  {file && (
                    <Button variant="outline" size="sm" onClick={handleClearFile}>
                      Clear
                    </Button>
                  )}
                </div>
              </ClientOnly>
              
              {file && (
                <div className="text-sm text-gray-500 mt-2 truncate">
                  Selected: <span className="font-medium">{fileName}</span>
                </div>
              )}
              
              {validationError?.includes("SRT") && (
                <div className="mt-2 p-2 bg-rose-50 border border-rose-200 rounded-md flex items-center gap-2 text-sm text-rose-600">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {validationError}
                </div>
              )}
            </div>

            {/* Translation Settings */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-300">
              <div 
                className="p-4 flex items-start justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => setIsSettingsCollapsed(!isSettingsCollapsed)}
              >
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-blue-500 mt-1" />
                  <div>
                    <h2 className="text-lg font-medium">Translation Settings</h2>
                    {isSettingsCollapsed ? (
                      <p className="text-sm text-gray-600">
                        {targetLanguage} | {customPrompt.length > 50 ? customPrompt.substring(0, 50) + '...' : customPrompt}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">Configure translation options</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSettingsCollapsed(!isSettingsCollapsed);
                  }}
                >
                  {isSettingsCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </Button>
              </div>
              
              {!isSettingsCollapsed && (
                <div className="px-4 pb-4 pt-1 space-y-3 border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Target Language</h3>
                      <LanguageSelector
                        value={targetLanguage}
                        onChange={setTargetLanguage}
                      />
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2">Custom Prompt</h3>
                      <Textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="Custom prompt for translation..."
                        className="min-h-[80px] resize-y max-h-[200px] custom-scrollbar"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Use {"{language}"} to insert the target language in your prompt.
                      </p>
                    </div>
                  </div>
                  
                  {/* API Key Error Message */}
                  {validationError?.includes("API key") && (
                    <div className="p-2 bg-rose-50 border border-rose-200 rounded-md flex items-center gap-2 text-sm text-rose-600">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {validationError}
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="mt-4 space-y-3">
                    {translating && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="text-gray-600">
                            {isPaused ? (
                              <span className="text-amber-600 flex items-center">
                                <PauseCircle className="h-4 w-4 mr-1" />
                                Đã tạm dừng - Nhấn "Tiếp tục" để tiếp tục dịch
                              </span>
                            ) : (
                              <span>Đang dịch phụ đề...</span>
                            )}
                          </div>
                          <div className={`font-medium ${isPaused ? 'text-amber-600' : 'text-blue-600'}`}>
                            {translationProgress}%
                          </div>
                        </div>
                        <LoadingIndicator progress={translationProgress} isPaused={isPaused} />
                        {isPaused && (
                          <div className="p-2 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-700 flex items-center gap-1 mt-1">
                            <AlertCircle className="h-3 w-3 flex-shrink-0" />
                            Quá trình dịch đã tạm dừng. Nhấn "Tiếp tục" để tiếp tục dịch phụ đề, hoặc "Dừng" để hủy quá trình dịch.
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center gap-3">
                      {!translating ? (
                        <Button
                          onClick={handleTranslate}
                          disabled={translating}
                          className="w-32"
                        >
                          Translate
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePauseResume}
                            className="flex items-center gap-1"
                          >
                            {isPaused ? (
                              <>
                                <PlayCircle className="h-4 w-4" />
                                Tiếp tục
                              </>
                            ) : (
                              <>
                                <PauseCircle className="h-4 w-4" />
                                Tạm dừng
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleStop}
                            className="flex items-center gap-1 text-rose-600 hover:text-rose-700"
                          >
                            <StopCircle className="h-4 w-4" />
                            Dừng
                          </Button>
                        </div>
                      )}
                      
                      <Button
                        variant={subtitles.some(s => s.status === "translated") ? "default" : "outline"}
                        onClick={handleExport}
                        disabled={translating || subtitles.every(s => s.status !== "translated")}
                        className="w-32"
                      >
                        Export SRT
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {file && subtitles.length > 0 && (
            <>
              {/* Hiển thị batch error display nếu có batch bị lỗi */}
              {failedBatches.length > 0 && (
                <BatchErrorDisplay 
                  failedBatches={failedBatches} 
                  onRetryBatch={handleRetryBatch}
                  isProcessing={translating}
                />
              )}
              
              {/* Subtitle Table */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-300">
                <div 
                  className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                  onClick={() => setIsSubtitleTableCollapsed(!isSubtitleTableCollapsed)}
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <h2 className="text-lg font-medium">Subtitles</h2>
                      <p className="text-sm text-gray-500">
                        {subtitles.length} subtitles found | {subtitles.filter(s => s.status === "translated").length} translated
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm flex items-center gap-1">
                      <span className="text-gray-500">Progress: </span>
                      <span className="font-medium">
                        {subtitles.filter(s => s.status === "translated").length} / {subtitles.length}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSubtitleTableCollapsed(!isSubtitleTableCollapsed);
                      }}
                    >
                      {isSubtitleTableCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                {!isSubtitleTableCollapsed && (
                  <div className="border-t border-gray-200">
                    <SubtitleTable
                      subtitles={subtitles}
                      onRetry={handleRetrySubtitle}
                      onRetryBatch={handleRetryBatch}
                      onUpdateTranslation={handleUpdateSubtitle}
                      translating={translating}
                      batchSize={BATCH_SIZE}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
} 