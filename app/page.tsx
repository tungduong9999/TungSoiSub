"use client";

import dynamic from 'next/dynamic';
import TranslatorSkeleton from '@/components/TranslatorSkeleton';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useI18n } from '@/lib/i18n/I18nContext';

// Import the SubtitleTranslator component dynamically with SSR disabled
const SubtitleTranslator = dynamic(
  () => import('@/components/SubtitleTranslator'),
  { 
    ssr: false, // This ensures the component only renders on the client
    loading: () => <TranslatorSkeleton /> // Show a skeleton while loading
  }
);

export default function Home() {
  const { t } = useI18n();
  
  return (
    <>
      {/* Fixed header */}
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm transition-all duration-200">
        <div className="container max-w-6xl mx-auto px-4 py-3.5 flex justify-between items-center">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800 transition-colors">
              {t('common.appTitle')}
            </h1>
            <p className="text-sm text-gray-600 mt-0.5 transition-colors">
              {t('common.appDescription')}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-3 md:p-6 pt-8">
        <div className="w-full max-w-6xl mx-auto">
          <SubtitleTranslator />
        </div>
      </main>
    </>
  );
}
