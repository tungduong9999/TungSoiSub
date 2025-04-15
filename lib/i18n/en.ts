// English translations
const en = {
  common: {
    appTitle: "SRT Subtitle Translator",
    appDescription: "Translate subtitles from SRT files using Gemini AI",
    loading: "Loading...",
    save: "Save",
    cancel: "Cancel",
    retry: "Retry",
    retryAll: "Retry All",
    retrying: "Retrying...",
    export: "Export",
    edit: "Edit",
    pause: "Pause",
    resume: "Resume",
    stop: "Stop",
    expand: "Expand",
    collapse: "Collapse",
    error: "Error",
    success: "Success",
    close: "Close",
    clear: "Clear"
  },
  apiKey: {
    title: "Gemini API Key",
    description: "Enter your Gemini API key to translate subtitles.",
    getKey: "Get a key",
    configuredAndReady: "API key configured and ready to use",
    enterKey: "Enter your Gemini API key...",
    show: "Show",
    hide: "Hide",
    isValid: "API key is valid",
    isInvalid: "Invalid API key. Please check and try again.",
    saveInBrowser: "Save API key in this browser",
    saveAndUse: "Save & Use Key",
    update: "Update API Key",
    validating: "Validating..."
  },
  fileUpload: {
    title: "Upload SRT File",
    description: "Select an SRT subtitle file to translate",
    dragAndDrop: "Drag and drop an SRT file here, or click to select",
    dropFileHere: "Drop your SRT file here...",
    browsing: "Browsing...",
    selectFile: "Select File",
    fileSelected: "File selected:",
    clearFile: "Clear file",
    invalidFormat: "Invalid file format. Please select an SRT file.",
    noFileSelected: "No file selected",
    processingFile: "Processing file...",
    successfullyParsed: "Successfully parsed {count} subtitles."
  },
  translationSettings: {
    title: "Translation Settings",
    description: "Configure how your subtitles will be translated",
    targetLanguage: "Target Language",
    selectLanguage: "Select or type a language",
    customPrompt: "Custom Prompt",
    customPromptDefault: "Translate the following subtitle to {language}. Maintain the original tone, style, and nuances. Keep it concise to fit the subtitle timing.",
    startTranslation: "Start Translation",
    translationInProgress: "Translating subtitles...",
    translationPaused: "Paused - Press 'Continue' to resume translation",
    translationStopped: "Translation stopped",
    translationCompleted: "Translation completed"
  },
  subtitleTable: {
    id: "ID",
    time: "Time",
    originalText: "Original Text",
    translation: "Translation",
    status: "Status",
    action: "Action",
    batch: "Batch",
    showing: "Showing",
    subtitles: "subtitles",
    translated: "translated",
    errors: "errors",
    expandTable: "Expand table",
    collapseTable: "Collapse table",
    waitingToTranslate: "Waiting to translate...",
    translating: "Translating..."
  },
  batchErrorDisplay: {
    failedBatches: "{count} failed {batches}",
    batch: "batch",
    batches: "batches",
    description: "Each batch contains up to 10 subtitles. Retry failed batches to complete the translation.",
    retryBatch: "Retry Batch"
  },
  errors: {
    apiKeyRequired: "API key is required. Please provide a valid Gemini API key.",
    fileRequired: "Please select an SRT file to translate.",
    translationError: "Translation Error",
    translationErrorDescription: "An error occurred during translation:",
    rateLimit: "Rate limit exceeded. Please wait a moment before trying again.",
    forbidden: "API access forbidden. Please check your API key.",
    unauthorized: "Unauthorized API access. Your API key might be invalid.",
    serverError: "Server error from Gemini API. Please try again later."
  },
  export: {
    exportTranslated: "Export Translated SRT",
    exportBilingual: "Export Bilingual SRT",
    bilingualDescription: "Export SRT with both original and translated subtitles",
    downloading: "Downloading...",
    noTranslatedSubtitles: "No translated subtitles to export."
  }
};

export default en; 