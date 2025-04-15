"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/I18nContext";

interface LanguageSelectorProps {
  value: string;
  onChange: (language: string) => void;
}

// Common languages for translation
const LANGUAGES = [
  "Afrikaans",
  "Albanian",
  "Arabic",
  "Armenian",
  "Bengali",
  "Bulgarian",
  "Chinese (Simplified)",
  "Chinese (Traditional)",
  "Croatian",
  "Czech",
  "Danish",
  "Dutch",
  "English",
  "Estonian",
  "Filipino",
  "Finnish",
  "French",
  "German",
  "Greek",
  "Hebrew",
  "Hindi",
  "Hungarian",
  "Icelandic",
  "Indonesian",
  "Italian",
  "Japanese",
  "Korean",
  "Latvian",
  "Lithuanian",
  "Malay",
  "Norwegian",
  "Persian",
  "Polish",
  "Portuguese",
  "Romanian",
  "Russian",
  "Serbian",
  "Slovak",
  "Slovenian",
  "Spanish",
  "Swahili",
  "Swedish",
  "Thai",
  "Turkish",
  "Ukrainian",
  "Urdu",
  "Vietnamese",
];

export default function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  const { t } = useI18n();
  // Filter languages based on input
  const [filter, setFilter] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  
  const filteredLanguages = filter
    ? LANGUAGES.filter(lang => 
        lang.toLowerCase().includes(filter.toLowerCase())
      )
    : LANGUAGES;

  return (
    <div className="relative">
      <div className="flex gap-2">
        <Input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setFilter(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            // Delay closing to allow for selection
            setTimeout(() => setIsOpen(false), 200);
          }}
          placeholder={t('translationSettings.selectLanguage')}
          className="w-full"
        />
      </div>

      {isOpen && filteredLanguages.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm custom-scrollbar">
          <ul className="divide-y divide-gray-200">
            {filteredLanguages.map((language) => (
              <li
                key={language}
                className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 ${
                  value === language ? "bg-gray-100" : ""
                }`}
                onMouseDown={() => {
                  onChange(language);
                  setIsOpen(false);
                }}
              >
                {language}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 