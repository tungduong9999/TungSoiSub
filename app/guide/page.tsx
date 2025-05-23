"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n/I18nContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Link from 'next/link';
import { ArrowLeft, FileType, Languages, Key, Play, Edit, Download, RotateCw, Sparkles, Info, AlertTriangle, ArrowUp, Search, Menu, X, Printer, ChevronDown, ChevronUp } from 'lucide-react';
import { useSessionTracking } from '@/lib/analytics';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Define types for sidebar items
interface SubItem {
  id: string;
  title: string;
}

interface SidebarItem {
  id: string;
  title: string;
  subItems: SubItem[];
}

export default function UserGuide() {
  const { t } = useI18n();
  const [activeSection, setActiveSection] = useState<string>('introduction');
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredItems, setFilteredItems] = useState<SidebarItem[]>([]);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const [openFaqs, setOpenFaqs] = useState<Record<number, boolean>>({});
  const [openIssues, setOpenIssues] = useState<Record<number, boolean>>({});
  
  // Track session
  useSessionTracking();
  
  // Handle scroll to update active section and show/hide back to top button
  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        'introduction',
        'getting-started',
        'uploading-subtitles',
        'translation-settings',
        'translating-process',
        'editing-subtitles',
        'exporting-subtitles',
        'troubleshooting',
        'faq'
      ];
      
      // Find the section closest to the top of the viewport
      let closestSection = sections[0];
      let closestDistance = Infinity;
      
      sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
          const rect = section.getBoundingClientRect();
          // Consider sections above the middle of the viewport
          const distance = Math.abs(rect.top - 200);
          if (distance < closestDistance && rect.top <= 300) {
            closestDistance = distance;
            closestSection = sectionId;
          }
        }
      });
      
      setActiveSection(closestSection);
      
      // Check if we should show the back to top button
      setShowBackToTop(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initialize active section
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Scroll to section
  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      // Add a small delay to ensure smooth scrolling
      setTimeout(() => {
        const yOffset = -90; // Adjust offset to account for fixed header
        const y = section.getBoundingClientRect().top + window.pageYOffset + yOffset;
        
        window.scrollTo({
          top: y,
          behavior: 'smooth'
        });
        
        setActiveSection(sectionId);
      }, 100);
      
      // Close sidebar on mobile after clicking
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    }
  };
  
  // Back to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setFilteredItems(generateSidebarItems());
      return;
    }
    
    // Filter sidebar items based on search query
    const items = generateSidebarItems();
    const filtered = items.filter(item => {
      const mainTitleMatch = item.title.toLowerCase().includes(query.toLowerCase());
      const subItemMatch = item.subItems.some(subItem => 
        subItem.title.toLowerCase().includes(query.toLowerCase())
      );
      
      return mainTitleMatch || subItemMatch;
    });
    
    setFilteredItems(filtered);
  };
  
  // Handle form submit
  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    // Search logic already handled in handleSearchChange
  };
  
  // Handle print function
  const handlePrint = () => {
    window.print();
  };

  // Generate sidebar items
  const generateSidebarItems = useCallback((): SidebarItem[] => {
    return [
      {
        id: 'introduction',
        title: t('guide.introTitle'),
        subItems: []
      },
      {
        id: 'getting-started',
        title: t('guide.section1'),
        subItems: [
          { id: 'api-key', title: t('guide.apiKeyTitle') },
          { id: 'model-selection', title: t('guide.modelSelectionTitle') }
        ]
      },
      {
        id: 'uploading-subtitles',
        title: t('guide.section2'),
        subItems: [
          { id: 'upload-methods', title: t('guide.uploadMethodsTitle') }
        ]
      },
      {
        id: 'translation-settings',
        title: t('guide.section3'),
        subItems: [
          { id: 'target-language', title: t('guide.targetLanguageTitle') },
          { id: 'custom-prompt', title: t('guide.customPromptTitle') }
        ]
      },
      {
        id: 'translating-process',
        title: t('guide.section4'),
        subItems: [
          { id: 'start-translation', title: t('guide.startTranslationTitle') },
          { id: 'translation-progress', title: t('guide.translationProgressTitle') },
          { id: 'translation-control', title: t('guide.translationControlTitle') }
        ]
      },
      {
        id: 'editing-subtitles',
        title: t('guide.section5'),
        subItems: [
          { id: 'manual-edit', title: t('guide.manualEditTitle') },
          { id: 'improve-translation', title: t('guide.improveTranslationTitle') },
          { id: 'retry-failed', title: t('guide.retryFailedTitle') }
        ]
      },
      {
        id: 'exporting-subtitles',
        title: t('guide.section6'),
        subItems: [
          { id: 'export-options', title: t('guide.exportOptionsTitle') }
        ]
      },
      {
        id: 'troubleshooting',
        title: t('guide.section7'),
        subItems: [
          { id: 'common-issues', title: t('guide.commonIssuesTitle') }
        ]
      },
      {
        id: 'faq',
        title: t('guide.faqTitle'),
        subItems: []
      }
    ];
  }, [t]);
  
  // Initialize filtered items
  useEffect(() => {
    setFilteredItems(generateSidebarItems());
  }, [generateSidebarItems]);

  // Toggle FAQ item
  const toggleFaq = (index: number) => {
    setOpenFaqs(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // Toggle troubleshooting issue
  const toggleIssue = (index: number) => {
    setOpenIssues(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <>
      {/* Fixed header */}
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm transition-all duration-200 print:static print:border-none">
        <div className="container max-w-6xl mx-auto px-4 py-3.5 flex justify-between items-center">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800 transition-colors">
              {t('common.appTitle')} - {t('guide.title')}
            </h1>
            <p className="text-sm text-gray-600 mt-0.5 transition-colors">
              {t('guide.subtitle')}
            </p>
          </div>
          <div className="ml-4 flex items-center gap-3">
            {/* Print button */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handlePrint} 
              className="hidden md:flex print:hidden"
              aria-label={t('guideUi.printGuide')}
            >
              <Printer className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="md:hidden print:hidden"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main content with sidebar */}
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-3 md:p-6 pt-8 pb-16 print:bg-white print:p-0 print:pt-4">
        <div className="w-full max-w-6xl mx-auto">
          {/* Back button - Fixed position */}
          <div className="guide-back-button print:hidden">
            <Link href="/" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-1" />
              {t('guide.backToApp')}
            </Link>
          </div>

          {/* Two-column layout */}
          <div className="flex flex-col md:flex-row gap-6 print:block">
            {/* Sidebar with Table of Contents */}
            <aside className="md:w-72 relative print:hidden">
              {/* Mobile Sidebar Toggle Button - Only shown on mobile */}
              <div className="md:hidden mb-4 print:hidden">
                <Button 
                  onClick={() => setSidebarOpen(true)} 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2 py-1.5"
                >
                  <Menu className="h-4 w-4" />
                  {t('guideUi.openTableOfContents')}
                </Button>
              </div>
              
              {/* Desktop Sidebar - Always visible on desktop, hidden on mobile */}
              <div className="hidden md:block guide-sidebar-container">
                <div className="guide-sidebar">
                  {/* Search functionality */}
                  <div className="mb-4 w-full">
                    <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full">
                      <Input
                        type="search"
                        placeholder={t('guideUi.searchPlaceholder')}
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="text-sm w-full"
                      />
                      <Button 
                        type="submit" 
                        size="icon"
                        variant="ghost"
                        aria-label="Search"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                  
                  <div className="w-full">
                    <h3 className="text-lg font-medium mb-3">{t('guide.tocTitle')}</h3>
                    <nav className="guide-toc-nav">
                      {/* Introduction */}
                      <button 
                        onClick={() => scrollToSection('introduction')}
                        className={`w-full text-left px-3 py-2 text-sm rounded transition duration-200 guide-toc-item ${activeSection === 'introduction' ? 'active' : ''}`}
                      >
                        {t('guide.introTitle')}
                      </button>
  
                      {/* Generate dynamic sidebar from filtered items */}
                      {filteredItems.map(item => (
                        item.id !== 'introduction' && (
                          <div key={item.id} className="w-full space-y-1 mt-2">
                            <button 
                              onClick={() => scrollToSection(item.id)}
                              className={`w-full text-left px-3 py-2 text-sm rounded transition duration-200 guide-toc-item ${activeSection === item.id ? 'active' : ''}`}
                            >
                              {item.title}
                            </button>
                            
                            {/* Sub-items if any */}
                            {item.subItems.length > 0 && (
                              <div className="pl-4 space-y-1 mt-1 w-full">
                                {item.subItems.map(subItem => (
                                  <button
                                    key={subItem.id}
                                    onClick={() => scrollToSection(subItem.id)}
                                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700 rounded hover:bg-gray-100 transition duration-200"
                                  >
                                    {subItem.title}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      ))}
                    </nav>
                  </div>
                </div>
              </div>
              
              {/* Mobile Sidebar - Shown only when opened */}
              <div 
                className={`fixed inset-0 z-40 bg-black/50 ${sidebarOpen ? 'block' : 'hidden'} md:hidden`}
                onClick={() => setSidebarOpen(false)}
              >
                <div 
                  className="fixed left-0 top-0 h-full w-72 bg-white p-4 shadow-lg overflow-y-auto z-50 transition-transform transform-gpu"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Mobile close button */}
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">{t('guide.tocTitle')}</h3>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setSidebarOpen(false)} 
                      aria-label="Close menu"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Search functionality */}
                  <div className="mb-4 w-full">
                    <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full">
                      <Input
                        type="search"
                        placeholder={t('guideUi.searchPlaceholder')}
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="text-sm w-full"
                      />
                      <Button 
                        type="submit" 
                        size="icon"
                        variant="ghost"
                        aria-label="Search"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                  
                  <div className="w-full">
                    <nav className="space-y-1">
                      {/* Introduction */}
                      <button 
                        onClick={() => scrollToSection('introduction')}
                        className={`w-full text-left px-3 py-2 text-sm rounded transition duration-200 ${activeSection === 'introduction' ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-100'}`}
                      >
                        {t('guide.introTitle')}
                      </button>
  
                      {/* Generate dynamic sidebar from filtered items */}
                      {filteredItems.map(item => (
                        item.id !== 'introduction' && (
                          <div key={item.id} className="w-full space-y-1 mt-1">
                            <button 
                              onClick={() => scrollToSection(item.id)}
                              className={`w-full text-left px-3 py-2 text-sm rounded transition duration-200 ${activeSection === item.id ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-100'}`}
                            >
                              {item.title}
                            </button>
                            
                            {/* Sub-items if any */}
                            {item.subItems.length > 0 && (
                              <div className="pl-4 space-y-1 mt-1 w-full">
                                {item.subItems.map(subItem => (
                                  <button
                                    key={subItem.id}
                                    onClick={() => scrollToSection(subItem.id)}
                                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700 rounded hover:bg-gray-100 transition duration-200"
                                  >
                                    {subItem.title}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      ))}
                    </nav>
                  </div>
                </div>
              </div>
            </aside>
            
            {/* Main content area */}
            <div className="flex-1 print:w-full" ref={mainContentRef}>
              {/* Print-only title for print version */}
              <div className="hidden print:block print:mb-8">
                <h1 className="text-3xl font-bold text-center">{t('common.appTitle')} - {t('guide.title')}</h1>
                <p className="text-center text-gray-600 mt-2">{t('guide.subtitle')}</p>
                <div className="border-b border-gray-200 my-4"></div>
              </div>

              {/* Introduction */}
              <Card id="introduction" className="mb-8 scroll-mt-24 border-blue-100 bg-blue-50/50">
                <CardHeader>
                  <CardTitle className="text-xl text-blue-700">{t('guide.introTitle')}</CardTitle>
                  <CardDescription>{t('guide.introDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="text-blue-700">
                  <p className="mb-4">
                    {t('guide.introText')}
                  </p>
                </CardContent>
              </Card>

              {/* Getting Started */}
              <Card id="getting-started" className="mb-8 scroll-mt-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-blue-600" />
                    {t('guide.section1')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div id="api-key">
                    <h3 className="font-medium text-lg mb-2">{t('guide.apiKeyTitle')}</h3>
                    <p className="mb-2">{t('guide.apiKeyDescription')}</p>
                    <ol className="list-decimal pl-5 space-y-2">
                      <li>{t('guide.apiKeyStep1')}</li>
                      <li>{t('guide.apiKeyStep2')}</li>
                      <li>{t('guide.apiKeyStep3')}</li>
                      <li>{t('guide.apiKeyStep4')}</li>
                    </ol>
                  </div>
                  
                  <div id="model-selection">
                    <h3 className="font-medium text-lg mb-2">{t('guide.modelSelectionTitle')}</h3>
                    <p>{t('guide.modelSelectionDescription')}</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                      <li><strong>Gemini 2.0 Flash:</strong> {t('guide.model20FlashDescription')}</li>
                      <li><strong>Gemini 2.5 Pro Experimental:</strong> {t('guide.model25ProDescription')}</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Uploading Subtitles */}
              <Card id="uploading-subtitles" className="mb-8 scroll-mt-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileType className="h-5 w-5 text-blue-600" />
                    {t('guide.section2')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div id="upload-methods">
                    <h3 className="font-medium text-lg mb-2">{t('guide.uploadMethodsTitle')}</h3>
                    <p className="mb-2">{t('guide.uploadMethodsDescription')}</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><strong>{t('guide.uploadMethod1Title')}</strong>: {t('guide.uploadMethod1Description')}</li>
                      <li><strong>{t('guide.uploadMethod2Title')}</strong>: {t('guide.uploadMethod2Description')}</li>
                    </ul>
                  </div>
                  
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                      <p className="text-sm text-amber-700">{t('guide.supportedFormatsNote')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Translation Settings */}
              <Card id="translation-settings" className="mb-8 scroll-mt-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Languages className="h-5 w-5 text-blue-600" />
                    {t('guide.section3')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div id="target-language">
                    <h3 className="font-medium text-lg mb-2">{t('guide.targetLanguageTitle')}</h3>
                    <p>{t('guide.targetLanguageDescription')}</p>
                  </div>
                  
                  <div id="custom-prompt">
                    <h3 className="font-medium text-lg mb-2">{t('guide.customPromptTitle')}</h3>
                    <p>{t('guide.customPromptDescription')}</p>
                    <div className="mt-2 p-3 bg-gray-100 rounded-md">
                      <code className="text-sm whitespace-pre-wrap">
                        {t('guide.customPromptExample')}
                      </code>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{t('guide.customPromptTip')}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Translation Process */}
              <Card id="translating-process" className="mb-8 scroll-mt-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-blue-600" />
                    {t('guide.section4')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div id="start-translation">
                    <h3 className="font-medium text-lg mb-2">{t('guide.startTranslationTitle')}</h3>
                    <p>{t('guide.startTranslationDescription')}</p>
                  </div>
                  
                  <div id="translation-progress">
                    <h3 className="font-medium text-lg mb-2">{t('guide.translationProgressTitle')}</h3>
                    <p>{t('guide.translationProgressDescription')}</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                      <li><strong>{t('guide.statusPending')}</strong>: {t('guide.statusPendingDescription')}</li>
                      <li><strong>{t('guide.statusTranslating')}</strong>: {t('guide.statusTranslatingDescription')}</li>
                      <li><strong>{t('guide.statusTranslated')}</strong>: {t('guide.statusTranslatedDescription')}</li>
                      <li><strong>{t('guide.statusError')}</strong>: {t('guide.statusErrorDescription')}</li>
                    </ul>
                  </div>
                  
                  <div id="translation-control">
                    <h3 className="font-medium text-lg mb-2">{t('guide.translationControlTitle')}</h3>
                    <p>{t('guide.translationControlDescription')}</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                      <li><strong>{t('guide.pauseResumeTitle')}</strong>: {t('guide.pauseResumeDescription')}</li>
                      <li><strong>{t('guide.stopTitle')}</strong>: {t('guide.stopDescription')}</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Editing Subtitles */}
              <Card id="editing-subtitles" className="mb-8 scroll-mt-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="h-5 w-5 text-blue-600" />
                    {t('guide.section5')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div id="manual-edit">
                    <h3 className="font-medium text-lg mb-2">{t('guide.manualEditTitle')}</h3>
                    <p>{t('guide.manualEditDescription')}</p>
                    <ol className="list-decimal pl-5 space-y-1 mt-2">
                      <li>{t('guide.editStep1')}</li>
                      <li>{t('guide.editStep2')}</li>
                      <li>{t('guide.editStep3')}</li>
                    </ol>
                  </div>
                  
                  <div id="improve-translation">
                    <h3 className="font-medium text-lg mb-2">{t('guide.improveTranslationTitle')}</h3>
                    <p>{t('guide.improveTranslationDescription')}</p>
                    <div className="flex items-center mt-2">
                      <Sparkles className="h-4 w-4 text-amber-500 mr-2" />
                      <p className="text-sm">{t('guide.aiSuggestionTip')}</p>
                    </div>
                  </div>

                  <div id="retry-failed">
                    <h3 className="font-medium text-lg mb-2">{t('guide.retryFailedTitle')}</h3>
                    <p>{t('guide.retryFailedDescription')}</p>
                    <div className="mt-2 flex items-start">
                      <div className="mr-3 mt-0.5">
                        <RotateCw className="h-4 w-4 text-blue-600" />
                      </div>
                      <p className="text-sm">{t('guide.retryButtonDescription')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Exporting Subtitles */}
              <Card id="exporting-subtitles" className="mb-8 scroll-mt-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5 text-blue-600" />
                    {t('guide.section6')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div id="export-options">
                    <h3 className="font-medium text-lg mb-2">{t('guide.exportOptionsTitle')}</h3>
                    <p>{t('guide.exportOptionsDescription')}</p>
                    <ul className="list-disc pl-5 space-y-2 mt-2">
                      <li><strong>{t('guide.normalExportTitle')}</strong>: {t('guide.normalExportDescription')}</li>
                      <li><strong>{t('guide.bilingualExportTitle')}</strong>: {t('guide.bilingualExportDescription')}</li>
                    </ul>
                  </div>
                  
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                      <p className="text-sm text-blue-700">{t('guide.exportFormatTip')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Troubleshooting */}
              <Card id="troubleshooting" className="mb-8 scroll-mt-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    {t('guide.section7')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div id="common-issues">
                    <h3 className="font-medium text-lg mb-2">{t('guide.commonIssuesTitle')}</h3>
                    
                    <div className="space-y-3 mt-4">
                      {/* Issue 1 */}
                      <div id="issue-1" className="border border-gray-200 rounded-md overflow-hidden">
                        <button 
                          onClick={() => toggleIssue(1)}
                          className="w-full p-3 bg-gray-50 flex justify-between items-center text-left hover:bg-gray-100 transition-colors"
                        >
                          <h4 className="font-medium">{t('guide.issue1Title')}</h4>
                          {openIssues[1] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                        {openIssues[1] && (
                          <div className="p-3 text-sm">
                            <p>{t('guide.issue1Solution')}</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Issue 2 */}
                      <div id="issue-2" className="border border-gray-200 rounded-md overflow-hidden">
                        <button 
                          onClick={() => toggleIssue(2)}
                          className="w-full p-3 bg-gray-50 flex justify-between items-center text-left hover:bg-gray-100 transition-colors"
                        >
                          <h4 className="font-medium">{t('guide.issue2Title')}</h4>
                          {openIssues[2] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                        {openIssues[2] && (
                          <div className="p-3 text-sm">
                            <p>{t('guide.issue2Solution')}</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Issue 3 */}
                      <div id="issue-3" className="border border-gray-200 rounded-md overflow-hidden">
                        <button 
                          onClick={() => toggleIssue(3)}
                          className="w-full p-3 bg-gray-50 flex justify-between items-center text-left hover:bg-gray-100 transition-colors"
                        >
                          <h4 className="font-medium">{t('guide.issue3Title')}</h4>
                          {openIssues[3] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                        {openIssues[3] && (
                          <div className="p-3 text-sm">
                            <p>{t('guide.issue3Solution')}</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Issue 4 */}
                      <div id="issue-4" className="border border-gray-200 rounded-md overflow-hidden">
                        <button 
                          onClick={() => toggleIssue(4)}
                          className="w-full p-3 bg-gray-50 flex justify-between items-center text-left hover:bg-gray-100 transition-colors"
                        >
                          <h4 className="font-medium">{t('guide.issue4Title')}</h4>
                          {openIssues[4] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                        {openIssues[4] && (
                          <div className="p-3 text-sm">
                            <p>{t('guide.issue4Solution')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* FAQ Section */}
              <Card id="faq" className="mb-8 scroll-mt-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-600" />
                    {t('guide.faqTitle')}
                  </CardTitle>
                  <CardDescription>{t('guide.faqDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {/* FAQ Item 1 */}
                    <div className="border border-gray-200 rounded-md overflow-hidden">
                      <button 
                        onClick={() => toggleFaq(1)}
                        className="w-full p-3 bg-gray-50 flex justify-between items-center text-left hover:bg-gray-100 transition-colors"
                      >
                        <h3 className="font-medium">{t('guide.faq1Question')}</h3>
                        {openFaqs[1] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      {openFaqs[1] && (
                        <div className="p-3 text-gray-600">
                          <p>{t('guide.faq1Answer')}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* FAQ Item 2 */}
                    <div className="border border-gray-200 rounded-md overflow-hidden">
                      <button 
                        onClick={() => toggleFaq(2)}
                        className="w-full p-3 bg-gray-50 flex justify-between items-center text-left hover:bg-gray-100 transition-colors"
                      >
                        <h3 className="font-medium">{t('guide.faq2Question')}</h3>
                        {openFaqs[2] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      {openFaqs[2] && (
                        <div className="p-3 text-gray-600">
                          <p>{t('guide.faq2Answer')}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* FAQ Item 3 */}
                    <div className="border border-gray-200 rounded-md overflow-hidden">
                      <button 
                        onClick={() => toggleFaq(3)}
                        className="w-full p-3 bg-gray-50 flex justify-between items-center text-left hover:bg-gray-100 transition-colors"
                      >
                        <h3 className="font-medium">{t('guide.faq3Question')}</h3>
                        {openFaqs[3] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      {openFaqs[3] && (
                        <div className="p-3 text-gray-600">
                          <p>{t('guide.faq3Answer')}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* FAQ Item 4 */}
                    <div className="border border-gray-200 rounded-md overflow-hidden">
                      <button 
                        onClick={() => toggleFaq(4)}
                        className="w-full p-3 bg-gray-50 flex justify-between items-center text-left hover:bg-gray-100 transition-colors"
                      >
                        <h3 className="font-medium">{t('guide.faq4Question')}</h3>
                        {openFaqs[4] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      {openFaqs[4] && (
                        <div className="p-3 text-gray-600">
                          <p>{t('guide.faq4Answer')}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* FAQ Item 5 */}
                    <div className="border border-gray-200 rounded-md overflow-hidden">
                      <button 
                        onClick={() => toggleFaq(5)}
                        className="w-full p-3 bg-gray-50 flex justify-between items-center text-left hover:bg-gray-100 transition-colors"
                      >
                        <h3 className="font-medium">{t('guide.faq5Question')}</h3>
                        {openFaqs[5] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      {openFaqs[5] && (
                        <div className="p-3 text-gray-600">
                          <p>{t('guide.faq5Answer')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Help and Feedback */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>{t('guide.helpTitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">{t('guide.helpText')}</p>
                  <p className="text-sm text-gray-600">{t('guide.feedbackText')}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Back to top button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-opacity duration-300 flex items-center justify-center print:hidden ${
          showBackToTop ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-label={t('guideUi.backToTop')}
      >
        <ArrowUp className="w-5 h-5" />
      </button>
      
      {/* Print-only footer */}
      <footer className="hidden print:block mt-8 text-center text-sm text-gray-500 border-t border-gray-200 pt-4">
        <p>{t('common.appTitle')} © {new Date().getFullYear()}</p>
        <p className="mt-1">{t('guideUi.printedGuide')}</p>
      </footer>
    </>
  );
} 