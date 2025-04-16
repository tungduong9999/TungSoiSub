"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { SubtitleItem } from "@/components/SubtitleTranslator";
import ApiErrorDisplay from "@/components/ApiErrorDisplay";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Loader2, Edit, RotateCw, ChevronUp, ChevronDown } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nContext";

interface SubtitleTableProps {
  subtitles: SubtitleItem[];
  onRetry: (id: number) => void;
  onRetryBatch?: (batchIndex: number) => Promise<void>;
  onUpdateTranslation: (id: number, translatedText: string) => void;
  translating: boolean;
  batchSize?: number;
  highlightedSubtitleId?: number | null;
}

interface BatchGroup {
  batchIndex: number;
  items: SubtitleItem[];
  hasErrors: boolean;
}

export default function SubtitleTable({
  subtitles,
  onRetry,
  onRetryBatch,
  onUpdateTranslation,
  translating,
  batchSize = 10,
  highlightedSubtitleId
}: SubtitleTableProps) {
  const { t } = useI18n();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState<string>("");
  const [retryingBatch, setRetryingBatch] = useState<number | null>(null);
  const [expandedTable, setExpandedTable] = useState<boolean>(false);
  const highlightedRowRef = useRef<HTMLTableRowElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Cuộn đến dòng đang highlight khi highlightedSubtitleId thay đổi
  useEffect(() => {
    if (!highlightedSubtitleId || !tableContainerRef.current) return;
    
    // Sử dụng setTimeout để đảm bảo DOM đã cập nhật
    setTimeout(() => {
      const container = tableContainerRef.current;
      if (!container) return; // Kiểm tra lại container sau setTimeout
      
      // Find the row element by ID - đảm bảo dùng querySelector trong container
      const rowElement = container.querySelector(`#subtitle-row-${highlightedSubtitleId}`);
      if (!rowElement) return;
      
      // Set the highlighted row reference
      highlightedRowRef.current = rowElement as HTMLTableRowElement;
      const row = highlightedRowRef.current;
      
      // Calculate if the row is visible in the viewport
      const rowRect = row.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      const rowTop = rowRect.top - containerRect.top + container.scrollTop;
      const rowBottom = rowTop + row.offsetHeight;
      
      // Kiểm tra xem dòng có nằm hoàn toàn trong khung nhìn không
      const isFullyVisible = (
        rowTop >= container.scrollTop &&
        rowBottom <= container.scrollTop + container.clientHeight
      );
      
      // Only scroll if the row is not fully visible
      if (!isFullyVisible) {
        // Tính vị trí cuộn dựa vào vị trí của dòng
        let targetScrollTop;
        
        if (rowTop < container.scrollTop) {
          // Dòng nằm phía trên viewport - cuộn lên để hiển thị với padding
          targetScrollTop = rowTop - 30;
        } else if (rowBottom > container.scrollTop + container.clientHeight) {
          // Dòng nằm phía dưới viewport - cuộn xuống để hiển thị với padding
          targetScrollTop = rowBottom - container.clientHeight + 30;
        } else {
          // Dòng đã hiển thị một phần - căn giữa dòng
          targetScrollTop = rowTop - (container.clientHeight / 2) + (row.offsetHeight / 2);
        }
        
        // Đảm bảo không cuộn quá giới hạn
        targetScrollTop = Math.max(0, Math.min(targetScrollTop, container.scrollHeight - container.clientHeight));
        
        // Cuộn mượt đến vị trí
        container.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        });
      }
    }, 50); // Nhỏ delay để DOM cập nhật
  }, [highlightedSubtitleId]);

  // Nhóm phụ đề theo batch
  const batches = useMemo(() => {
    const result: BatchGroup[] = [];
    
    // Nhóm phụ đề theo batch
    for (let i = 0; i < subtitles.length; i += batchSize) {
      const batchItems = subtitles.slice(i, i + batchSize);
      const batchIndex = Math.floor(i / batchSize);
      
      result.push({
        batchIndex,
        items: batchItems,
        hasErrors: batchItems.some(item => item.status === "error")
      });
    }
    
    return result;
  }, [subtitles, batchSize]);

  // Start editing a subtitle
  const handleEdit = (id: number, text: string) => {
    setEditingId(id);
    setEditText(text);
  };

  // Save edited subtitle
  const handleSave = (id: number) => {
    onUpdateTranslation(id, editText);
    setEditingId(null);
    setEditText("");
  };

  // Cancel editing
  const handleCancel = () => {
    setEditingId(null);
    setEditText("");
  };

  // Retry a batch
  const handleRetryBatch = async (batchIndex: number) => {
    if (!onRetryBatch) return;
    
    setRetryingBatch(batchIndex);
    try {
      await onRetryBatch(batchIndex);
    } finally {
      setRetryingBatch(null);
    }
  };

  // Get status badge style and text
  const getStatusBadge = (status: SubtitleItem["status"]) => {
    switch (status) {
      case "pending":
        return <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">Pending</span>;
      case "translating":
        return <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-600 flex items-center">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />Translating
        </span>;
      case "translated":
        return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-600">Translated</span>;
      case "error":
        return <span className="px-2 py-0.5 text-xs rounded-full bg-rose-100 text-rose-600">Error</span>;
      default:
        return null;
    }
  };

  // Get count of errors in batches
  const errorBatchCount = batches.filter(batch => batch.hasErrors).length;

  // Handle clicking on a subtitle row to play it
  const handleRowClick = (id: number) => {
    if (id !== editingId && onRetry && !translating) {
      // Only trigger if we're not already editing and not in the middle of translation
      if (highlightedSubtitleId !== id) {
        // Call onRetry (which actually sets the currentPlayingSubtitleId in parent)
        onRetry(id);
        
        // Don't need additional scrolling code here as the useEffect will handle it
        // when highlightedSubtitleId changes. This prevents double-scrolling.
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Batch error quick retry section */}
      {onRetryBatch && errorBatchCount > 0 && (
        <div className="mx-4 mb-2 p-3 border border-amber-200 bg-amber-50 rounded">
          <div className="flex items-start gap-2">
            <AlertTriangle className="text-amber-500 h-4 w-4 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-amber-800">Quick batch retry</h3>
              <p className="text-xs text-amber-700 mb-2">
                {t('batchErrorDisplay.description')}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-1">
                {batches.filter(batch => batch.hasErrors).map(batch => {
                  const errorCount = batch.items.filter(item => item.status === "error").length;
                  const firstId = batch.items[0]?.id;
                  const lastId = batch.items[batch.items.length - 1]?.id;
                  const isRetrying = retryingBatch === batch.batchIndex;
                  
                  return (
                    <div key={`batch-${batch.batchIndex}`} className="flex items-center justify-between py-1 px-2 bg-white border border-amber-100 rounded text-sm">
                      <div className="truncate">
                        <span className="font-medium">{t('subtitleTable.batch')} {batch.batchIndex + 1}:</span> #{firstId}-{lastId}
                        <span className="ml-1 text-rose-600 text-xs">({errorCount} {t('subtitleTable.errors')})</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRetryBatch(batch.batchIndex)}
                        disabled={isRetrying || translating}
                        className="h-6 px-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-100"
                      >
                        {isRetrying ? (
                          <>
                            <Loader2 className="animate-spin h-3 w-3 mr-1" />
                            {t('common.retrying')}
                          </>
                        ) : (
                          <>
                            <RotateCw className="h-3 w-3 mr-1" />
                            {t('common.retry')}
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtitle table */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div 
          ref={tableContainerRef}
          className={`${expandedTable ? 'max-h-[800px]' : 'max-h-[400px]'} custom-scrollbar overflow-y-auto border border-gray-200 rounded-md transition-all duration-300 scroll-container`}
        >
          <style jsx>{`
            tr.highlighted {
              background-color: rgba(254, 240, 138, 0.4) !important;
              border-left: 4px solid #f59e0b !important;
            }
            
            tr.highlighted td:first-child {
              padding-left: calc(1rem - 4px);
            }
            
            @keyframes highlight-pulse {
              0%, 100% { background-color: rgba(254, 240, 138, 0.4); }
              50% { background-color: rgba(251, 191, 36, 0.2); }
            }
            
            tr.highlighted {
              animation: highlight-pulse 2s infinite;
            }
          `}</style>
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-white border-b border-gray-200">
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase w-12 bg-gray-50 first:rounded-tl-md">{t('subtitleTable.id')}</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase w-28 bg-gray-50">{t('subtitleTable.time')}</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase bg-gray-50">{t('subtitleTable.originalText')}</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase bg-gray-50">{t('subtitleTable.translation')}</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase w-24 text-center bg-gray-50">{t('subtitleTable.status')}</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase w-20 text-right bg-gray-50 last:rounded-tr-md">{t('subtitleTable.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subtitles.map((subtitle, index) => {
                const batchIndex = Math.floor((subtitle.id - 1) / batchSize);
                const isEven = index % 2 === 0;
                const isPlaying = subtitle.id === highlightedSubtitleId;
                
                return (
                  <tr 
                    key={subtitle.id} 
                    id={`subtitle-row-${subtitle.id}`}
                    ref={isPlaying ? highlightedRowRef : null}
                    onClick={() => handleRowClick(subtitle.id)}
                    className={`
                      ${isEven ? 'bg-white' : 'bg-gray-50/50'} 
                      ${retryingBatch === batchIndex && subtitle.status === "translating" ? "bg-blue-50/70" : ""}
                      ${isPlaying ? "highlighted" : ""}
                      hover:bg-blue-50/30 transition-colors border-b border-gray-100
                      ${editingId !== subtitle.id ? "cursor-pointer" : ""}
                    `}
                  >
                    <td className="px-4 py-2 align-top text-gray-700">
                      {subtitle.id}
                      {subtitle.id % batchSize === 1 && (
                        <span className="ml-1 text-xs text-gray-400">B{batchIndex + 1}</span>
                      )}
                    </td>
                    <td className="px-4 py-2 align-top text-gray-500 text-xs whitespace-nowrap">
                      <div>{subtitle.startTime}</div>
                      <div className="text-gray-400">↓</div>
                      <div>{subtitle.endTime}</div>
                    </td>
                    <td className="px-4 py-2 align-top text-gray-600">
                      <div className="max-w-xs whitespace-pre-wrap break-words text-sm max-h-[120px] custom-scrollbar">{subtitle.text}</div>
                    </td>
                    <td className="px-4 py-2 align-top text-gray-800">
                      {editingId === subtitle.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full min-h-[80px] max-h-[150px] text-sm custom-scrollbar"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleSave(subtitle.id)}>{t('common.save')}</Button>
                            <Button size="sm" variant="outline" onClick={handleCancel}>{t('common.cancel')}</Button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className={`max-w-xs whitespace-pre-wrap break-words max-h-[120px] custom-scrollbar ${
                            subtitle.status === "error" ? "text-rose-600" : "text-gray-800"
                          }`}
                        >
                          {subtitle.status === "error" 
                            ? <ApiErrorDisplay 
                                error={subtitle.error || t('errors.translationError')} 
                                retryAction={() => onRetry(subtitle.id)}
                              />
                            : subtitle.translatedText || (subtitle.status === "pending" ? 
                                <span className="text-gray-400 italic text-sm">{t('subtitleTable.waitingToTranslate')}</span> : 
                                <span className="text-blue-400 italic text-sm">{t('subtitleTable.translating')}</span>
                              )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 align-top text-center">
                      {getStatusBadge(subtitle.status)}
                    </td>
                    <td className="px-4 py-2 align-top text-right">
                      {subtitle.status !== "translating" && editingId !== subtitle.id && (
                        <div className="flex justify-end gap-1">
                          {subtitle.status === "translated" && (
                            <Button 
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEdit(subtitle.id, subtitle.translatedText)}
                              disabled={translating}
                              className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title={t('common.edit')}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {subtitle.status === "error" && (
                            <Button 
                              size="icon"
                              variant="ghost"
                              onClick={() => onRetry(subtitle.id)}
                              disabled={translating || retryingBatch === batchIndex}
                              className="h-7 w-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              title={t('common.retry')}
                            >
                              <RotateCw className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center mt-3 px-4">
          <div className="text-xs text-gray-500">
            {t('subtitleTable.showing')} <span className="font-medium">{subtitles.length}</span> {t('subtitleTable.subtitles')}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setExpandedTable(!expandedTable)}
            className="text-gray-500 hover:text-gray-700 px-2 py-1 h-8"
          >
            {expandedTable ? (
              <><ChevronUp className="h-4 w-4 mr-1" /> {t('subtitleTable.collapseTable')}</>
            ) : (
              <><ChevronDown className="h-4 w-4 mr-1" /> {t('subtitleTable.expandTable')}</>
            )}
          </Button>
          <div className="text-xs text-gray-500 text-right">
            <span className="font-medium">{subtitles.filter(s => s.status === "translated").length}</span> {t('subtitleTable.translated')}, 
            <span className="font-medium ml-1">{subtitles.filter(s => s.status === "error").length}</span> {t('subtitleTable.errors')}
          </div>
        </div>
      </div>
    </div>
  );
} 