"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Locale, Translations, locales, translateWithParams, getNestedValue } from './index';

// Khóa trong localStorage để lưu ngôn ngữ
const LOCALE_STORAGE_KEY = 'subtitle_translator_locale';

// Default locale
const DEFAULT_LOCALE: Locale = 'en';

// Định nghĩa context
interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  translations: Translations;
  formatParams: (text: string, params?: Record<string, string | number>) => string;
}

// Tạo context
const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Provider component
interface I18nProviderProps {
  children: ReactNode;
  defaultLocale?: Locale;
}

export function I18nProvider({ children, defaultLocale = DEFAULT_LOCALE }: I18nProviderProps) {
  // State để lưu ngôn ngữ hiện tại
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [isLoaded, setIsLoaded] = useState(false);

  // Tải ngôn ngữ đã lưu từ localStorage khi component mount
  useEffect(() => {
    // Chỉ chạy ở client
    const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
    if (savedLocale && Object.keys(locales).includes(savedLocale)) {
      setLocaleState(savedLocale);
    }
    setIsLoaded(true);
  }, []);

  // Hàm để cập nhật ngôn ngữ và lưu vào localStorage
  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
  };

  // Hàm t() để lấy chuỗi dịch
  const t = (key: string, params?: Record<string, string | number>): string => {
    const value = getNestedValue(locales[locale], key);
    if (value === undefined) {
      console.warn(`Translation key "${key}" not found for locale "${locale}"`);
      return key;
    }
    
    if (params) {
      return translateWithParams(value, params);
    }
    
    return value;
  };

  // Hàm format chuỗi riêng lẻ với tham số
  const formatParams = (text: string, params?: Record<string, string | number>): string => {
    if (!params) return text;
    return translateWithParams(text, params);
  };

  // Chỉ render khi đã tải xong ngôn ngữ (tránh hydration mismatch)
  if (!isLoaded) {
    return null;
  }

  return (
    <I18nContext.Provider value={{ 
      locale, 
      setLocale, 
      t, 
      translations: locales[locale],
      formatParams 
    }}>
      {children}
    </I18nContext.Provider>
  );
}

// Hook để sử dụng trong các component
export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// Higher order component (HOC) để wrap các component cần dịch
export function withI18n<P extends object>(Component: React.ComponentType<P & I18nContextType>) {
  return function WithI18nComponent(props: P) {
    return (
      <I18nProvider>
        <Component {...props} {...useI18n()} />
      </I18nProvider>
    );
  };
} 