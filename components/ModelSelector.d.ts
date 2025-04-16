import { ReactElement } from "react";

export interface ModelOption {
  id: string;
  name: string;
  description: {
    vi: string;
    en: string;
  };
  capabilities: string[];
  optimizedFor: string[];
  priceCategory: "free" | "paid" | "experimental";
}

export interface ModelSelectorProps {
  onModelChange: (modelId: string) => void;
  className?: string;
}

export interface TranslationsType {
  title: {
    vi: string;
    en: string;
  };
  selectModel: {
    vi: string;
    en: string;
  };
  capabilities: {
    vi: string;
    en: string;
  };
  optimizedFor: {
    vi: string;
    en: string;
  };
  priceCategory: Record<string, {
    vi: string;
    en: string;
  }>;
  tierLabel: {
    freeTier: {
      vi: string;
      en: string;
    };
    paidTier: {
      vi: string;
      en: string;
    };
  };
  capabilityLabels: Record<string, {
    vi: string;
    en: string;
  }>;
  optimizationLabels: Record<string, {
    vi: string;
    en: string;
  }>;
}

export const AVAILABLE_MODELS: ModelOption[];
export const DEFAULT_MODEL: string;
export const translations: TranslationsType;

declare function ModelSelector(props: ModelSelectorProps): ReactElement;
export default ModelSelector; 