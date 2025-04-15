"use client";

import { useI18n } from "@/lib/i18n/I18nContext";
import { Locale, localeNames } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-1.5 h-9 px-2.5 rounded-md border border-gray-200 hover:bg-gray-50"
        >
          <Globe className="w-4 h-4 text-gray-600" />
          <span className="text-gray-700 font-medium">{localeNames[locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-32">
        {Object.entries(localeNames).map(([key, name]) => (
          <DropdownMenuItem 
            key={key}
            onClick={() => setLocale(key as Locale)}
            className={`px-3 py-2 ${locale === key ? "bg-primary/5 font-medium" : ""}`}
          >
            <div className="flex items-center">
              {locale === key && (
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
              )}
              <span className={locale === key ? "ml-0" : "ml-3.5"}>{name}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 