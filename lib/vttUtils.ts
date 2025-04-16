interface VttItem {
  id: number;
  startTime: string;
  endTime: string;
  text: string;
}

/**
 * Parse WebVTT file content into array of subtitle items
 */
export function parse(content: string): VttItem[] {
  // Split the content by double newlines (subtitle blocks)
  const lines = content.trim().split(/\r?\n/);
  const subtitles: VttItem[] = [];
  let currentSubtitle: Partial<VttItem> | null = null;
  let id = 1;
  let isHeader = true;

  // Process line by line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip the WEBVTT header line and any header comments/settings
    if (isHeader) {
      if (line === '' && lines[i-1]?.includes('WEBVTT')) {
        isHeader = false;
      }
      continue;
    }

    // Skip empty lines between cues
    if (line === '') {
      if (currentSubtitle && currentSubtitle.startTime && currentSubtitle.endTime && currentSubtitle.text) {
        subtitles.push({
          id: currentSubtitle.id || id++,
          startTime: currentSubtitle.startTime,
          endTime: currentSubtitle.endTime,
          text: currentSubtitle.text
        });
      }
      currentSubtitle = {};
      continue;
    }

    // Check if line is a timestamp
    const timeMatch = line.match(/(\d{2}:\d{2}:\d{2}\.\d{3}|\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3}|\d{2}:\d{2}\.\d{3})/);
    if (timeMatch) {
      if (!currentSubtitle) currentSubtitle = {};
      
      // Convert timestamps to SRT format (replace . with ,)
      currentSubtitle.startTime = timeMatch[1].replace('.', ',');
      currentSubtitle.endTime = timeMatch[2].replace('.', ',');
      
      // Ensure HH:MM:SS,mmm format
      if (currentSubtitle.startTime.split(':').length === 2) {
        currentSubtitle.startTime = `00:${currentSubtitle.startTime}`;
      }
      if (currentSubtitle.endTime.split(':').length === 2) {
        currentSubtitle.endTime = `00:${currentSubtitle.endTime}`;
      }
      
      continue;
    }

    // Check if line contains the cue identifier/ID
    if (!currentSubtitle) {
      currentSubtitle = { id: parseInt(line, 10) || id };
      continue;
    }

    // If we have a timestamp but no text yet, this is the subtitle text
    if (currentSubtitle && currentSubtitle.startTime && currentSubtitle.endTime) {
      if (!currentSubtitle.text) {
        currentSubtitle.text = line;
      } else {
        currentSubtitle.text += '\n' + line;
      }
    }
  }

  // Add the last subtitle if there is one
  if (currentSubtitle && currentSubtitle.startTime && currentSubtitle.endTime && currentSubtitle.text) {
    subtitles.push({
      id: currentSubtitle.id || id,
      startTime: currentSubtitle.startTime,
      endTime: currentSubtitle.endTime,
      text: currentSubtitle.text
    });
  }

  return subtitles;
}

/**
 * Generate WebVTT content from subtitle items
 */
export function stringify(subtitles: VttItem[]): string {
  let output = 'WEBVTT\n\n';
  
  output += subtitles.map(subtitle => {
    // Convert timestamps from SRT format (HH:MM:SS,mmm) to WebVTT format (HH:MM:SS.mmm)
    const startTime = subtitle.startTime.replace(',', '.');
    const endTime = subtitle.endTime.replace(',', '.');
    
    return `${subtitle.id}\n${startTime} --> ${endTime}\n${subtitle.text}`;
  }).join('\n\n');
  
  return output;
} 