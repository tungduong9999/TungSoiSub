import * as srtUtils from './srtUtils';
import * as vttUtils from './vttUtils';
import * as assUtils from './assUtils';

/**
 * Supported subtitle formats
 */
export type SubtitleFormat = 'srt' | 'vtt' | 'ass';

/**
 * Common interface for subtitle items across all formats
 */
export interface SubtitleItem {
  id: number;
  startTime: string;
  endTime: string;
  text: string;
}

/**
 * Detect subtitle format based on file extension
 */
export function detectFormat(filename: string): SubtitleFormat | null {
  const ext = filename.toLowerCase().split('.').pop();
  
  if (ext === 'srt') return 'srt';
  if (ext === 'vtt') return 'vtt';
  if (ext === 'ass') return 'ass';
  
  return null;
}

/**
 * Parse subtitle content based on format
 */
export function parseSubtitle(content: string, format: SubtitleFormat): SubtitleItem[] {
  switch (format) {
    case 'srt':
      return srtUtils.parse(content);
    case 'vtt':
      return vttUtils.parse(content);
    case 'ass':
      return assUtils.parse(content);
    default:
      throw new Error(`Unsupported subtitle format: ${format}`);
  }
}

/**
 * Generate subtitle content based on format
 */
export function stringifySubtitle(subtitles: SubtitleItem[], format: SubtitleFormat): string {
  switch (format) {
    case 'srt':
      return srtUtils.stringify(subtitles);
    case 'vtt':
      return vttUtils.stringify(subtitles);
    case 'ass':
      return assUtils.stringify(subtitles);
    default:
      throw new Error(`Unsupported subtitle format: ${format}`);
  }
}

/**
 * Get all supported subtitle extensions
 */
export function getSupportedExtensions(): string[] {
  return ['.srt', '.vtt', '.ass'];
}

/**
 * Get MIME type for file input accept attribute
 */
export function getAcceptAttribute(): string {
  return '.srt,.vtt,.ass,text/plain,text/srt,text/vtt,application/x-subrip,text/x-ass';
}

/**
 * Get formatted file extension for export 
 */
export function getFileExtension(format: SubtitleFormat): string {
  return `.${format}`;
} 