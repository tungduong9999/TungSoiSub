// Vietnamese translations
const vi = {
  common: {
    appTitle: "Dịch Phụ Đề SRT",
    appDescription: "Dịch phụ đề từ tệp SRT sử dụng Gemini AI",
    loading: "Đang tải...",
    save: "Lưu",
    cancel: "Hủy",
    retry: "Thử lại",
    retryAll: "Thử lại tất cả",
    retrying: "Đang thử lại...",
    export: "Xuất",
    edit: "Sửa",
    pause: "Tạm dừng",
    resume: "Tiếp tục",
    stop: "Dừng",
    expand: "Mở rộng",
    collapse: "Thu gọn",
    error: "Lỗi",
    success: "Thành công",
    close: "Đóng",
    clear: "Xóa"
  },
  apiKey: {
    title: "Khóa API Gemini",
    description: "Nhập khóa API Gemini để dịch phụ đề.",
    getKey: "Lấy khóa",
    configuredAndReady: "Khóa API đã được cấu hình và sẵn sàng sử dụng",
    enterKey: "Nhập khóa API Gemini của bạn...",
    show: "Hiện",
    hide: "Ẩn",
    isValid: "Khóa API hợp lệ",
    isInvalid: "Khóa API không hợp lệ. Vui lòng kiểm tra và thử lại.",
    saveInBrowser: "Lưu khóa API trong trình duyệt này",
    saveAndUse: "Lưu & Sử dụng khóa",
    update: "Cập nhật khóa API",
    validating: "Đang xác thực..."
  },
  fileUpload: {
    title: "Tải lên tệp SRT",
    description: "Chọn tệp phụ đề SRT để dịch",
    dragAndDrop: "Kéo và thả tệp SRT vào đây, hoặc nhấp để chọn",
    dropFileHere: "Thả tệp SRT của bạn vào đây...",
    browsing: "Đang duyệt...",
    selectFile: "Chọn tệp",
    fileSelected: "Đã chọn tệp:",
    clearFile: "Xóa tệp",
    invalidFormat: "Định dạng tệp không hợp lệ. Vui lòng chọn tệp SRT.",
    noFileSelected: "Chưa chọn tệp",
    processingFile: "Đang xử lý tệp...",
    successfullyParsed: "Đã phân tích thành công {count} phụ đề."
  },
  translationSettings: {
    title: "Cài đặt dịch",
    description: "Cấu hình cách phụ đề của bạn sẽ được dịch",
    targetLanguage: "Ngôn ngữ đích",
    selectLanguage: "Chọn hoặc nhập ngôn ngữ",
    customPrompt: "Prompt tùy chỉnh",
    customPromptDefault: "Dịch phụ đề sau sang {language}. Giữ nguyên giọng điệu, phong cách và sắc thái ban đầu. Giữ ngắn gọn để phù hợp với thời gian phụ đề.",
    startTranslation: "Bắt đầu dịch",
    translationInProgress: "Đang dịch phụ đề...",
    translationPaused: "Đã tạm dừng - Nhấn 'Tiếp tục' để tiếp tục dịch",
    translationStopped: "Đã dừng dịch",
    translationCompleted: "Dịch hoàn tất"
  },
  subtitleTable: {
    id: "ID",
    time: "Thời gian",
    originalText: "Văn bản gốc",
    translation: "Bản dịch",
    status: "Trạng thái",
    action: "Hành động",
    batch: "Nhóm",
    showing: "Đang hiển thị",
    subtitles: "phụ đề",
    translated: "đã dịch",
    errors: "lỗi",
    expandTable: "Mở rộng bảng",
    collapseTable: "Thu gọn bảng",
    waitingToTranslate: "Đang chờ dịch...",
    translating: "Đang dịch..."
  },
  batchErrorDisplay: {
    failedBatches: "{count} nhóm {batches} thất bại",
    batch: "nhóm",
    batches: "nhóm",
    description: "Mỗi nhóm chứa tối đa 10 phụ đề. Thử lại các nhóm thất bại để hoàn thành việc dịch.",
    retryBatch: "Thử lại nhóm"
  },
  errors: {
    apiKeyRequired: "Cần có khóa API. Vui lòng cung cấp khóa API Gemini hợp lệ.",
    fileRequired: "Vui lòng chọn tệp SRT để dịch.",
    translationError: "Lỗi dịch",
    translationErrorDescription: "Đã xảy ra lỗi trong quá trình dịch:",
    rateLimit: "Đã vượt quá giới hạn tần suất. Vui lòng đợi một lát trước khi thử lại.",
    forbidden: "Truy cập API bị cấm. Vui lòng kiểm tra khóa API của bạn.",
    unauthorized: "Truy cập API không được ủy quyền. Khóa API của bạn có thể không hợp lệ.",
    serverError: "Lỗi máy chủ từ API Gemini. Vui lòng thử lại sau."
  },
  export: {
    exportTranslated: "Xuất SRT đã dịch",
    downloading: "Đang tải xuống...",
    noTranslatedSubtitles: "Không có phụ đề đã dịch để xuất."
  }
};

export default vi; 