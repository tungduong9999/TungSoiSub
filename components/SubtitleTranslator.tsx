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
import { ChevronDown, ChevronUp, Globe, AlertCircle, PauseCircle, PlayCircle, StopCircle, X, Maximize, Minimize, Eye, EyeOff } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nContext";
import SubtitlePreview from "@/components/SubtitlePreview";

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
  const { t, formatParams } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [subtitles, setSubtitles] = useState<SubtitleItem[]>([]);
  const [translating, setTranslating] = useState<boolean>(false);
  const [targetLanguage, setTargetLanguage] = useState<string>("Vietnamese");
  const [customPrompt, setCustomPrompt] = useState<string>(
    t('translationSettings.customPromptDefault')
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
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [dragCounter, setDragCounter] = useState<number>(0);
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState<boolean>(false);
  const [layoutMode, setLayoutMode] = useState<'default' | 'sidebyside'>('default');

  // Cập nhật pauseStateRef khi isPaused thay đổi
  useEffect(() => {
    pauseStateRef.current = isPaused;
    console.log(`Pause state changed to: ${isPaused}`);
  }, [isPaused]);

  // Update custom prompt when language changes
  useEffect(() => {
    setCustomPrompt(formatParams(t('translationSettings.customPromptDefault'), { language: targetLanguage }));
  }, [t, formatParams, targetLanguage]);

  // Theo dõi sự thay đổi ngôn ngữ để đánh dấu phụ đề cần dịch lại
  const [previousLanguage, setPreviousLanguage] = useState<string>(targetLanguage);
  
  useEffect(() => {
    // Nếu ngôn ngữ thay đổi và đã có dữ liệu phụ đề
    if (previousLanguage !== targetLanguage && subtitles.length > 0) {
      // Hiển thị thông báo nhỏ rằng cần dịch lại
      console.log(`Ngôn ngữ đã thay đổi từ ${previousLanguage} sang ${targetLanguage}. Phụ đề sẽ được dịch lại.`);
    }
    
    // Ghi nhớ ngôn ngữ hiện tại cho lần thay đổi tiếp theo
    setPreviousLanguage(targetLanguage);
  }, [targetLanguage, subtitles.length, previousLanguage]);

  // Kiểm tra nếu màn hình đủ lớn để sử dụng layout side-by-side
  useEffect(() => {
    const checkScreenSize = () => {
      if (typeof window !== 'undefined') {
        setLayoutMode(window.innerWidth >= 1600 ? 'sidebyside' : 'default');
      }
    };
    
    // Kiểm tra khi component mount
    checkScreenSize();
    
    // Thêm event listener để kiểm tra khi resize
    window.addEventListener('resize', checkScreenSize);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

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
      setValidationError(t('errors.apiKeyRequired'));
      return false;
    }
    
    // Kiểm tra file SRT
    if (!file || subtitles.length === 0) {
      setValidationError(t('errors.fileRequired'));
      return false;
    }
    
    // Nếu tất cả đều hợp lệ, xóa thông báo lỗi
    setValidationError(null);
    return true;
  };

  // Tạm dừng hoặc tiếp tục dịch
  const handlePauseResume = () => {
    console.log("Toggling pause state:", !isPaused);
    setIsPaused(!isPaused);
    pauseStateRef.current = !isPaused;
  };

  // Dừng hoàn toàn quá trình dịch
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort("Translation aborted by user.");
      abortControllerRef.current = null;
    }
    console.log("Translation stopped by user");
  };

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    processFile(selectedFile);
  };

  // Process the selected/dropped file
  const processFile = async (selectedFile: File) => {
    // Check if file is an SRT file
    if (!selectedFile.name.toLowerCase().endsWith('.srt')) {
      setValidationError(t('fileUpload.invalidFormat'));
      return;
    }

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
      setValidationError(t('fileUpload.invalidFormat'));
    }
  };

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    // Ngăn trình duyệt mở tệp khi kéo thả
    e.preventDefault();
    e.stopPropagation();
    
    if (translating) return;
    
    // Tăng bộ đếm khi có sự kiện enter
    setDragCounter(prev => prev + 1);
    
    // Chỉ set isDragging thành true nếu có file
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Ngăn trình duyệt mở tệp khi kéo thả
    e.preventDefault();
    e.stopPropagation();
    
    // Giảm bộ đếm khi có sự kiện leave
    setDragCounter(prev => prev - 1);
    
    // Chỉ khi bộ đếm về 0 (đã rời khỏi vùng thả hoàn toàn) mới set isDragging về false
    if (dragCounter === 1) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    // Rất quan trọng: ngăn chặn hành vi mặc định của trình duyệt
    // khi kéo file vào trang web
    e.preventDefault();
    e.stopPropagation();
    
    if (translating) return;
    
    // Hiển thị rõ cho người dùng biết có thể thả tệp vào đây
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    // Rất quan trọng: ngăn chặn hành vi mặc định của trình duyệt
    // để tránh trình duyệt mở tệp thay vì xử lý trong ứng dụng
    e.preventDefault();
    e.stopPropagation();
    
    // Reset trạng thái kéo thả
    setIsDragging(false);
    setDragCounter(0);
    
    if (translating) return;
    
    // Kiểm tra xem có file nào được thả không
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      const file = droppedFiles[0];
      
      // Kiểm tra xem file có phải là file SRT không
      if (file.name.toLowerCase().endsWith('.srt')) {
        processFile(file);
      } else {
        setValidationError(t('fileUpload.invalidFormat'));
      }
    }
  };

  // Start translation process
  const handleTranslate = async () => {
    // Xác thực đầu vào và dừng nếu có lỗi
    if (!validateBeforeTranslate()) {
      return;
    }
    
    // Đặt lại trạng thái cho tất cả phụ đề về "pending" khi dịch lại với ngôn ngữ mới
    if (subtitles.some(sub => sub.status === "translated")) {
      const resetSubtitles = subtitles.map(sub => ({
        ...sub,
        status: "pending" as const,
        translatedText: "", // Xóa bản dịch cũ
        error: undefined
      }));
      setSubtitles(resetSubtitles);
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
      
      console.log(`Translating ${pendingSubtitles.length} subtitles to ${targetLanguage}`);
      
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

  // Export bilingual subtitles (original + translated)
  const handleExportBilingual = () => {
    if (!window || subtitles.length === 0 || !fileName) return;
    
    // Create SRT content with both original and translated text
    const srtContent = stringify(subtitles.map(sub => {
      // Skip subtitles that haven't been translated yet
      if (sub.status !== "translated" || !sub.translatedText) {
        return {
          id: sub.id,
          startTime: sub.startTime,
          endTime: sub.endTime,
          text: sub.text
        };
      }
      
      // Format as bilingual: original text followed by translated text
      return {
        id: sub.id,
        startTime: sub.startTime,
        endTime: sub.endTime,
        text: `${sub.text}\n${sub.translatedText}`
      };
    }));
    
    // Generate file name for bilingual version
    const origName = fileName.replace(/\.srt$/i, '');
    const newFileName = `${origName}_bilingual_${targetLanguage.toLowerCase()}.srt`;
    
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
                  <h3 className="text-sm font-medium text-rose-800">{t('errors.translationError')}</h3>
                  <p className="text-sm text-rose-700 mt-1">{translationError}</p>
                  <p className="text-xs text-rose-600 mt-2">
                    {t('errors.translationErrorDescription')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Layout Container - Side by Side or Stacked */}
          <div className={`${layoutMode === 'sidebyside' ? 'flex gap-4' : ''}`}>
            {/* Left Column - File Upload, Settings and Table */}
            <div className={`${layoutMode === 'sidebyside' ? 'w-3/5' : 'w-full'} space-y-4`}>
              {/* File Upload and Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* File Upload */}
                <Card className="md:col-span-1">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{t('fileUpload.title')}</CardTitle>
                        <CardDescription>{t('fileUpload.description')}</CardDescription>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => setIsSettingsCollapsed(!isSettingsCollapsed)}
                      >
                        {isSettingsCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  {!isSettingsCollapsed && (
                    <CardContent>
                      <div className="space-y-2">
                        <div
                          ref={dropZoneRef}
                          className={`border-2 border-dashed rounded-md p-4 sm:p-6 text-center cursor-pointer transition-colors
                            ${isDragging ? 'border-blue-400 bg-blue-50/50' : ''}
                            ${validationError && !file ? 'border-rose-300 bg-rose-50/50' : 'border-gray-300 hover:bg-gray-50'}
                          `}
                          onClick={() => fileInputRef.current?.click()}
                          onDragEnter={handleDragEnter}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".srt"
                            className="hidden"
                            onChange={handleFileChange}
                            disabled={translating}
                          />
                          <div className="text-sm text-gray-500">
                            {isDragging ? (
                              <p className="text-blue-500 font-medium">{t('fileUpload.dropFileHere')}</p>
                            ) : (
                              <div>
                                <p>{t('fileUpload.dragAndDropHere')}</p>
                                <p className="text-xs mt-1 text-gray-400">{t('fileUpload.orClickToSelect')}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {file && (
                          <div className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                            <div className="truncate">
                              <span className="font-medium">{t('fileUpload.fileSelected')}</span> {fileName}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-2 h-7 text-xs"
                              onClick={handleClearFile}
                              disabled={translating}
                            >
                              {t('fileUpload.clearFile')}
                            </Button>
                          </div>
                        )}

                        {validationError && !file && (
                          <div className="text-xs text-rose-600 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {validationError}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}
                  {isSettingsCollapsed && file && (
                    <CardContent>
                      <div className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                        <div className="truncate">
                          <span className="font-medium">{t('fileUpload.fileSelected')}</span> {fileName}
                        </div>
                      </div>
                    </CardContent>
                  )}
                  {isSettingsCollapsed && !file && (
                    <CardContent>
                      <div className="text-sm text-gray-500 text-center py-2">
                        {t('fileUpload.noFileSelected')}
                      </div>
                    </CardContent>
                  )}
                </Card>

                {/* Translation Settings */}
                <Card className="md:col-span-2">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{t('translationSettings.title')}</CardTitle>
                        <CardDescription>{t('translationSettings.description')}</CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => setLayoutMode(layoutMode === 'default' ? 'sidebyside' : 'default')}
                          title={layoutMode === 'default' ? 'Chế độ song song' : 'Chế độ mặc định'}
                        >
                          {layoutMode === 'default' ? <Maximize className="h-4 w-4" /> : <Minimize className="h-4 w-4" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => setIsSettingsCollapsed(!isSettingsCollapsed)}
                        >
                          {isSettingsCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {!isSettingsCollapsed && (
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            {t('translationSettings.targetLanguage')}
                          </label>
                          <LanguageSelector 
                            value={targetLanguage} 
                            onChange={setTargetLanguage} 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            {t('translationSettings.customPrompt')}
                          </label>
                          <Textarea 
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            className="min-h-[80px] resize-y max-h-[200px] custom-scrollbar"
                            disabled={translating}
                          />
                        </div>
                      </div>

                      {/* Translation Buttons */}
                      <div className="flex justify-between">
                        <div className="flex-1 flex items-center">
                          {subtitles.length > 0 && (
                            <div className="text-sm text-gray-500">
                              {formatParams(t('fileUpload.successfullyParsed'), { count: subtitles.length })}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {translating && (
                            <>
                              <Button 
                                variant="outline" 
                                onClick={handlePauseResume}
                                className="flex items-center gap-1"
                              >
                                {isPaused ? (
                                  <>
                                    <PlayCircle className="h-4 w-4" />
                                    {t('common.resume')}
                                  </>
                                ) : (
                                  <>
                                    <PauseCircle className="h-4 w-4" />
                                    {t('common.pause')}
                                  </>
                                )}
                              </Button>
                              <Button 
                                variant="destructive"
                                onClick={handleStop}
                                className="flex items-center gap-1"
                              >
                                <StopCircle className="h-4 w-4" />
                                {t('common.stop')}
                              </Button>
                            </>
                          )}
                          {!translating && (
                            <Button 
                              onClick={handleTranslate} 
                              disabled={!file || subtitles.length === 0}
                              className="flex items-center gap-1"
                            >
                              <Globe className="h-4 w-4" />
                              {t('translationSettings.startTranslation')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}

                  {translating && (
                    <CardFooter className="pt-2 border-t">
                      {isPaused ? (
                        <div className="w-full">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-sm font-medium text-amber-600">
                              {t('translationSettings.translationPaused')}
                            </div>
                            <div className="text-sm text-gray-500">{translationProgress}%</div>
                          </div>
                          <LoadingIndicator progress={translationProgress} isPaused={isPaused} />
                          <div className="mt-2 text-xs text-amber-600 px-2 py-1 bg-amber-50 border border-amber-100 rounded-md">
                            {t('translationSettings.translationPaused')}
                          </div>
                        </div>
                      ) : (
                        <div className="w-full">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-sm font-medium text-blue-600">
                              {t('translationSettings.translationInProgress')}
                            </div>
                            <div className="text-sm text-gray-500">{translationProgress}%</div>
                          </div>
                          <LoadingIndicator progress={translationProgress} />
                        </div>
                      )}
                    </CardFooter>
                  )}
                </Card>
              </div>

              {/* Batch Error Display */}
              {failedBatches.length > 0 && (
                <BatchErrorDisplay 
                  failedBatches={failedBatches}
                  onRetryBatch={handleRetryBatch}
                  isProcessing={translating}
                />
              )}

              {/* Subtitle Table */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Subtitles</CardTitle>
                      <CardDescription>View and edit translated subtitles</CardDescription>
                    </div>
                    {subtitles.length > 0 && (
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => setIsSubtitleTableCollapsed(!isSubtitleTableCollapsed)}
                        >
                          {isSubtitleTableCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                        </Button>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExport}
                            disabled={!subtitles.some(s => s.status === "translated")}
                            title={t('export.exportTranslated')}
                          >
                            {t('export.exportTranslated')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportBilingual}
                            disabled={!subtitles.some(s => s.status === "translated")}
                            title={t('export.bilingualDescription')}
                            className="whitespace-nowrap"
                          >
                            {t('export.exportBilingual')}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                {!isSubtitleTableCollapsed && (
                  <CardContent>
                    {subtitles.length > 0 ? (
                      <SubtitleTable
                        subtitles={subtitles}
                        onRetry={handleRetrySubtitle}
                        onRetryBatch={handleRetryBatch}
                        onUpdateTranslation={handleUpdateSubtitle}
                        translating={translating}
                      />
                    ) : (
                      <div className="text-center py-10 text-gray-500">
                        {t('fileUpload.noFileSelected')}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            </div>

            {/* Right Column - Video Preview (only shown in side-by-side mode or if not collapsed) */}
            {(layoutMode === 'sidebyside' || !isPreviewCollapsed) && subtitles.length > 0 && (
              <div className={`${layoutMode === 'sidebyside' ? 'w-2/5' : 'w-full mt-4'}`}>
                <Card className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{t('preview.title')}</CardTitle>
                        <CardDescription>{t('preview.description')}</CardDescription>
                      </div>
                      {layoutMode !== 'sidebyside' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => setIsPreviewCollapsed(!isPreviewCollapsed)}
                        >
                          <EyeOff className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <SubtitlePreview
                      subtitles={subtitles}
                      isTranslating={translating}
                    />
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Toggle button to show preview (only in stacked mode and when preview is collapsed) */}
            {layoutMode !== 'sidebyside' && isPreviewCollapsed && subtitles.length > 0 && (
              <div className="w-full mt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsPreviewCollapsed(false)}
                  className="w-full flex items-center justify-center gap-2 py-6"
                >
                  <Eye className="h-4 w-4" />
                  {t('preview.title')}
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
} 