"use client";

import dynamic from 'next/dynamic';
import TranslatorSkeleton from '@/components/TranslatorSkeleton';

// Import the SubtitleTranslator component dynamically with SSR disabled
const SubtitleTranslator = dynamic(
  () => import('@/components/SubtitleTranslator'),
  { 
    ssr: false, // This ensures the component only renders on the client
    loading: () => <TranslatorSkeleton /> // Show a skeleton while loading
  }
);

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-3 md:p-6">
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center py-6 mb-3">
          <h1 className="text-3xl font-bold text-gray-800">SRT Subtitle Translator</h1>
          <p className="text-gray-600 mt-2">
            Translate subtitles from SRT files using Gemini AI
          </p>
        </div>
        
        <SubtitleTranslator />
      </div>
    </main>
  );
}
