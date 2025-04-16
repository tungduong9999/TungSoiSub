import { track } from '@vercel/analytics';
import { useEffect } from 'react';

/**
 * Theo dõi sự kiện tùy chỉnh với Vercel Analytics
 */
export function trackEvent(eventName: string, properties?: Record<string, any>): void {
  try {
    track(eventName, properties);
  } catch (error) {
    console.error('Error tracking event:', error);
  }
}

/**
 * Hook theo dõi phiên làm việc
 */
export function useSessionTracking(): void {
  useEffect(() => {
    // Theo dõi bắt đầu phiên làm việc
    const startTime = Date.now();
    trackEvent('session_start');

    // Xử lý khi người dùng rời trang
    const handleBeforeUnload = () => {
      const sessionDuration = Math.floor((Date.now() - startTime) / 1000); // Tính thời gian sử dụng bằng giây
      trackEvent('session_end', { duration: sessionDuration });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload(); // Cũng ghi nhận khi component unmount
    };
  }, []);
}

/**
 * Theo dõi sự kiện tải lên file
 */
export function trackFileUpload(fileFormat: string, fileSize: number): void {
  trackEvent('file_upload', {
    format: fileFormat,
    size: fileSize,
  });
}

/**
 * Theo dõi sự kiện dịch phụ đề
 */
export function trackTranslation(
  sourceLanguage: string, 
  targetLanguage: string, 
  subtitleCount: number,
  model: string
): void {
  trackEvent('translation', {
    source: sourceLanguage,
    target: targetLanguage,
    count: subtitleCount,
    model: model
  });
}

/**
 * Theo dõi sự kiện xuất phụ đề
 */
export function trackExport(
  format: string, 
  subtitleCount: number, 
  targetLanguage: string,
  isBilingual: boolean
): void {
  trackEvent('export', {
    format,
    count: subtitleCount,
    language: targetLanguage,
    bilingual: isBilingual
  });
}

/**
 * Theo dõi lỗi dịch
 */
export function trackError(
  errorType: string,
  errorMessage: string,
  context?: Record<string, any>
): void {
  trackEvent('error', {
    type: errorType,
    message: errorMessage,
    ...context
  });
} 