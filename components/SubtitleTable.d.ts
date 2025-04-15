import React from 'react';
import { SubtitleItem } from "./SubtitleTranslator";

interface SubtitleTableProps {
  subtitles: SubtitleItem[];
  onRetry: (id: number) => void;
  onUpdateTranslation: (id: number, translatedText: string) => void;
  translating: boolean;
}

export default function SubtitleTable(props: SubtitleTableProps): React.ReactElement; 