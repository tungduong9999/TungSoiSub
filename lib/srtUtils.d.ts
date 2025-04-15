interface SrtItem {
  id: number;
  startTime: string;
  endTime: string;
  text: string;
}

export function parse(content: string): SrtItem[];
export function stringify(subtitles: SrtItem[]): string; 