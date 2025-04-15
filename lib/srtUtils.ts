interface SrtItem {
  id: number;
  startTime: string;
  endTime: string;
  text: string;
}

/**
 * Parse SRT file content into array of subtitle items
 */
export function parse(content: string): SrtItem[] {
  // Split the content by double newlines (subtitle blocks)
  const blocks = content.trim().split(/\r?\n\r?\n/);
  const subtitles: SrtItem[] = [];

  blocks.forEach(block => {
    const lines = block.split(/\r?\n/);
    if (lines.length < 3) return; // Skip invalid blocks

    // First line is the subtitle ID
    const id = parseInt(lines[0].trim(), 10);
    if (isNaN(id)) return; // Skip if ID is not a number

    // Second line is the timestamp
    const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);
    if (!timeMatch) return; // Skip if timestamp format is invalid

    const startTime = timeMatch[1];
    const endTime = timeMatch[2];

    // Remaining lines are the subtitle text
    const text = lines.slice(2).join("\n");

    subtitles.push({
      id,
      startTime,
      endTime,
      text
    });
  });

  return subtitles;
}

/**
 * Generate SRT content from subtitle items
 */
export function stringify(subtitles: SrtItem[]): string {
  return subtitles.map(subtitle => {
    return `${subtitle.id}\n${subtitle.startTime} --> ${subtitle.endTime}\n${subtitle.text}`;
  }).join("\n\n");
} 