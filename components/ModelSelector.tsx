"use client";

import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/I18nContext";

// Tên key để lưu trong localStorage
const STORAGE_KEY = "gemini_model";

// Đa ngôn ngữ cho các nhãn hiển thị
export const translations = {
  title: {
    vi: "Mô hình AI",
    en: "AI Model"
  },
  selectModel: {
    vi: "Chọn mô hình",
    en: "Select model"
  },
  capabilities: {
    vi: "Khả năng",
    en: "Capabilities"
  },
  optimizedFor: {
    vi: "Tối ưu cho",
    en: "Optimized for"
  },
  priceCategory: {
    free: {
      vi: "Miễn phí",
      en: "Free"
    },
    paid: {
      vi: "Trả phí",
      en: "Paid"
    },
    experimental: {
      vi: "Thử nghiệm",
      en: "Experimental"
    }
  },
  tierLabel: {
    freeTier: {
      vi: "Miễn phí (Free Tier)",
      en: "Free Tier"
    },
    paidTier: {
      vi: "Trả phí (Paid Tier)",
      en: "Paid Tier"
    }
  },
  capabilityLabels: {
    audio: {
      vi: "Âm thanh",
      en: "Audio"
    },
    image: {
      vi: "Hình ảnh",
      en: "Image"
    },
    video: {
      vi: "Video",
      en: "Video"
    },
    text: {
      vi: "Văn bản",
      en: "Text"
    }
  },
  optimizationLabels: {
    reasoning: {
      vi: "Suy luận",
      en: "Reasoning"
    },
    multimodal: {
      vi: "Đa phương thức",
      en: "Multimodal"
    },
    programming: {
      vi: "Lập trình",
      en: "Programming"
    },
    speed: {
      vi: "Tốc độ",
      en: "Speed"
    },
    "real-time": {
      vi: "Thời gian thực",
      en: "Real-time"
    },
    cost: {
      vi: "Chi phí thấp",
      en: "Cost-effective"
    },
    latency: {
      vi: "Độ trễ thấp",
      en: "Low latency"
    },
    versatility: {
      vi: "Đa năng",
      en: "Versatility"
    },
    volume: {
      vi: "Khối lượng lớn",
      en: "High volume"
    },
    "simple-tasks": {
      vi: "Tác vụ đơn giản",
      en: "Simple tasks"
    },
    "complex-reasoning": {
      vi: "Suy luận phức tạp",
      en: "Complex reasoning"
    },
    "context-awareness": {
      vi: "Hiểu ngữ cảnh",
      en: "Context awareness"
    }
  }
}

export interface ModelOption {
  id: string;
  name: string;
  description: {
    vi: string;
    en: string;
  };
  capabilities: string[];
  optimizedFor: string[];
  priceCategory: string;
}

// Danh sách các model có sẵn hỗ trợ dịch thuật text-to-text
export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: "gemini-2.5-pro-exp-03-25",
    name: "Gemini 2.5 Pro Experimental",
    description: {
      vi: "Mô hình tiên tiến nhất, phù hợp cho dịch thuật chất lượng cao",
      en: "Most advanced model, suitable for high-quality translations"
    },
    capabilities: ["audio", "image", "video", "text"],
    optimizedFor: ["reasoning", "multimodal", "programming"],
    priceCategory: "free"
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    description: {
      vi: "Hiệu suất nhanh và cân bằng, phù hợp cho dịch thuật thông thường",
      en: "Fast and balanced performance, suitable for routine translations"
    },
    capabilities: ["audio", "image", "video", "text"],
    optimizedFor: ["speed", "reasoning", "real-time"],
    priceCategory: "free"
  }
];

// Default model - sử dụng model miễn phí làm mặc định
export const DEFAULT_MODEL = "gemini-2.0-flash";

interface ModelSelectorProps {
  onModelChange: (modelId: string) => void;
  className?: string;
}

export default function ModelSelector({ onModelChange, className = "" }: ModelSelectorProps) {
  const { t, locale = 'vi' } = useI18n();
  const [currentModel, setCurrentModel] = useState<string>(DEFAULT_MODEL);
  
  // Tải model từ localStorage khi component được khởi tạo
  useEffect(() => {
    const savedModel = localStorage.getItem(STORAGE_KEY);
    
    if (savedModel) {
      setCurrentModel(savedModel);
      onModelChange(savedModel);
    }
  }, [onModelChange]);

  const handleModelChange = (value: string) => {
    setCurrentModel(value);
    localStorage.setItem(STORAGE_KEY, value);
    onModelChange(value);
  };

  // Lấy thông tin model hiện tại
  const currentModelInfo = AVAILABLE_MODELS.find(m => m.id === currentModel) || AVAILABLE_MODELS[0];
  
  // Xác định ngôn ngữ hiển thị, mặc định là tiếng Việt nếu không có
  const currentLanguage = locale === 'en' ? 'en' : 'vi';

  // Hàm lấy nhãn theo ngôn ngữ
  const getCapabilityLabel = (capability: string) => {
    return translations.capabilityLabels[capability as keyof typeof translations.capabilityLabels]?.[currentLanguage] || capability;
  };

  const getOptimizationLabel = (optimization: string) => {
    return translations.optimizationLabels[optimization as keyof typeof translations.optimizationLabels]?.[currentLanguage] || optimization;
  };

  const getPriceCategoryLabel = (category: string) => {
    return translations.priceCategory[category as keyof typeof translations.priceCategory]?.[currentLanguage] || category;
  };

  // Nhóm các mô hình theo loại giá - không cần phân nhóm nữa
  const models = AVAILABLE_MODELS;

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium text-gray-700">
        {translations.title[currentLanguage] || 'AI Model'}
      </label>
      <Select
        value={currentModel}
        onValueChange={handleModelChange}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={translations.selectModel[currentLanguage] || 'Select model'} />
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              <div>
                <div className="font-medium">{model.name}</div>
                <div className="text-xs text-gray-500">{model.description[currentLanguage]}</div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 