"use client";

import React, { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubtitleItem } from "@/components/SubtitleTranslator";
import { useI18n } from "@/lib/i18n/I18nContext";

interface SubtitlePreviewProps {
  subtitles: SubtitleItem[];
  isTranslating: boolean;
}

export default function SubtitlePreview({ subtitles, isTranslating }: SubtitlePreviewProps) {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [subtitleMode, setSubtitleMode] = useState<"translated" | "bilingual" | "original">("translated");
  const [currentSubtitle, setCurrentSubtitle] = useState<SubtitleItem | null>(null);

  // Xử lý khi người dùng chọn video
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Rút lại URL cũ để tránh rò rỉ bộ nhớ
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }

    const newUrl = URL.createObjectURL(file);
    setVideoUrl(newUrl);
  };

  // Cập nhật thời gian hiện tại của video khi phát
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Tìm phụ đề hiện tại dựa trên thời gian video
  useEffect(() => {
    if (!subtitles.length || !showSubtitles) {
      setCurrentSubtitle(null);
      return;
    }

    const found = subtitles.find(subtitle => {
      const startSeconds = timeToSeconds(subtitle.startTime);
      const endSeconds = timeToSeconds(subtitle.endTime);
      return currentTime >= startSeconds && currentTime <= endSeconds;
    });

    setCurrentSubtitle(found || null);
  }, [currentTime, subtitles, showSubtitles]);

  // Chuyển đổi thời gian từ định dạng "00:00:00,000" sang giây
  const timeToSeconds = (timeString: string): number => {
    const [time, milliseconds] = timeString.split(',');
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds + Number(milliseconds) / 1000;
  };

  // Render phụ đề dựa trên chế độ đã chọn
  const renderSubtitleText = () => {
    if (!currentSubtitle) return null;

    switch (subtitleMode) {
      case "original":
        return <div>{currentSubtitle.text}</div>;
      case "translated":
        return currentSubtitle.translatedText ? (
          <div>{currentSubtitle.translatedText}</div>
        ) : (
          <div className="text-gray-400">{currentSubtitle.text}</div>
        );
      case "bilingual":
        return (
          <>
            <div className="mb-1 text-gray-300">{currentSubtitle.text}</div>
            <div className="font-medium">
              {currentSubtitle.translatedText || 
                <span className="text-gray-400 italic">
                  {isTranslating ? t('subtitleTable.translating') : t('subtitleTable.waitingToTranslate')}
                </span>
              }
            </div>
          </>
        );
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle>{t('preview.title')}</CardTitle>
        <CardDescription>{t('preview.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept="video/*"
            onChange={handleVideoUpload}
            className="flex-1"
          />
          <Button 
            onClick={() => setShowSubtitles(!showSubtitles)}
            variant="outline"
            size="sm"
          >
            {showSubtitles ? t('preview.hideSubtitles') : t('preview.showSubtitles')}
          </Button>
        </div>

        {subtitles.length > 0 && (
          <div className="mb-2">
            <Tabs defaultValue="translated" onValueChange={(v: string) => setSubtitleMode(v as "translated" | "bilingual" | "original")}>
              <TabsList className="grid grid-cols-3 mb-2">
                <TabsTrigger value="translated">{t('preview.translatedOnly')}</TabsTrigger>
                <TabsTrigger value="bilingual">{t('preview.bilingual')}</TabsTrigger>
                <TabsTrigger value="original">{t('preview.originalOnly')}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

        <div className="relative rounded-md overflow-hidden bg-black aspect-video">
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              className="w-full h-full"
              onTimeUpdate={handleTimeUpdate}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white">
              {t('preview.uploadVideo')}
            </div>
          )}

          {showSubtitles && currentSubtitle && (
            <div className="absolute bottom-14 left-0 right-0 p-2 text-center text-white text-lg font-medium">
              <div className="bg-black bg-opacity-60 p-2 rounded inline-block max-w-[80%]">
                {renderSubtitleText()}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 