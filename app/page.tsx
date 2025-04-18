"use client";

import dynamic from 'next/dynamic';
import TranslatorSkeleton from '@/components/TranslatorSkeleton';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useI18n } from '@/lib/i18n/I18nContext';
import { useSessionTracking } from '@/lib/analytics';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';

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
  
  // Kích hoạt theo dõi phiên làm việc
  useSessionTracking();
  
  return (
    <>
      {/* Fixed header */}
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm transition-all duration-200">
        <div className="container max-w-6xl mx-auto px-4 py-3.5 flex justify-between items-center">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800 transition-colors">
              TungSoiSub
            </h1>
            <p className="text-sm text-gray-600 mt-0.5 transition-colors">
              Nơi biến ước mơ trở thành hiện thực 🔥🔥🔥🔥🔥
            </p>
            <p className="text-sm text-gray-700 mt-2">
  🔥 Xin chào! Đây là công cụ dịch phụ đề cá nhân của mình – <strong>Tung Soi</strong>.<br />
  Bạn có thể upload file <code>.srt</code>, chọn ngôn ngữ và dịch trong vài giây. Hope you like it! ❤️
            </p>

          </div>
          <div className="ml-4 flex items-center gap-4">
            <Link href="/guide" className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors">
              <BookOpen className="h-4 w-4 mr-1" />
              {t('guide.title')}
            </Link>
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
