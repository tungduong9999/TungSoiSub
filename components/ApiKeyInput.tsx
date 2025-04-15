"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, CheckCircle2, Key, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

// Tên key để lưu trong localStorage
const STORAGE_KEY = "gemini_api_key";
const SAVE_KEY_PREFERENCE = "save_gemini_api_key";

interface ApiKeyInputProps {
  onApiKeyChange: (apiKey: string) => void;
}

export default function ApiKeyInput({ onApiKeyChange }: ApiKeyInputProps) {
  const [apiKey, setApiKey] = useState<string>("");
  const [saveKey, setSaveKey] = useState<boolean>(false);
  const [isKeyValid, setIsKeyValid] = useState<boolean | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Tải API key từ localStorage khi component được khởi tạo
  useEffect(() => {
    const savedKey = localStorage.getItem(STORAGE_KEY);
    const savePreference = localStorage.getItem(SAVE_KEY_PREFERENCE) === "true";
    
    if (savedKey) {
      setApiKey(savedKey);
      setSaveKey(savePreference);
      setIsKeyValid(true);
      setIsCollapsed(true); // Thu gọn section nếu đã có API key
      onApiKeyChange(savedKey); // Thông báo key đã được tải lên
    }
  }, [onApiKeyChange]);

  // Xác thực API key bằng cách gọi một request kiểm tra đơn giản
  const validateApiKey = async (key: string) => {
    if (!key.trim()) {
      setIsKeyValid(false);
      return false;
    }

    setIsValidating(true);

    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      // Gửi một prompt đơn giản để kiểm tra key có hoạt động không
      const result = await model.generateContent("Hello, test");
      const response = await result.response;
      const text = response.text();
      
      setIsKeyValid(true);
      return true;
    } catch (error) {
      console.error("API key validation error:", error);
      setIsKeyValid(false);
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleSaveKey = async () => {
    const isValid = await validateApiKey(apiKey);

    if (isValid) {
      // Lưu key vào localStorage nếu người dùng chọn lưu
      if (saveKey) {
        localStorage.setItem(STORAGE_KEY, apiKey);
        localStorage.setItem(SAVE_KEY_PREFERENCE, "true");
      } else {
        // Xóa key khỏi localStorage nếu người dùng không chọn lưu
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(SAVE_KEY_PREFERENCE, "false");
      }

      // Thông báo cho component cha biết key đã thay đổi
      onApiKeyChange(apiKey);
      
      // Thu gọn section sau khi lưu thành công
      setIsCollapsed(true);
    }
  };

  const handleClearKey = () => {
    setApiKey("");
    setIsKeyValid(null);
    setSaveKey(false);
    setIsCollapsed(false);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SAVE_KEY_PREFERENCE);
    onApiKeyChange("");
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-300">
      <div 
        className="p-4 flex items-start justify-between cursor-pointer hover:bg-gray-50"
        onClick={toggleCollapse}
      >
        <div className="flex items-start gap-3">
          <Key className="w-5 h-5 text-blue-500 mt-1" />
          <div>
            <h2 className="text-lg font-medium">Gemini API Key</h2>
            {isKeyValid === true && isCollapsed ? (
              <p className="text-sm text-green-600 flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                API key configured and ready to use
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                Enter your Gemini API key to translate subtitles. 
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline inline-flex items-center ml-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  Get a key <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            toggleCollapse();
          }}
        >
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </div>
      
      {!isCollapsed && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-gray-100">
          <div className="relative">
            <Input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Gemini API key..."
              className={`pr-20 ${isKeyValid === true ? 'border-green-500' : isKeyValid === false ? 'border-red-500' : ''}`}
            />
            <Button
              variant="ghost"
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-0 top-0 h-full px-3 py-2 text-xs"
            >
              {showKey ? "Hide" : "Show"}
            </Button>
          </div>
          
          {isKeyValid === true && (
            <div className="flex items-center text-green-600 text-sm">
              <CheckCircle2 className="h-4 w-4 mr-1" />
              API key is valid
            </div>
          )}
          
          {isKeyValid === false && (
            <div className="flex items-center text-red-600 text-sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              Invalid API key. Please check and try again.
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="save-key" 
              checked={saveKey}
              onCheckedChange={(checked) => setSaveKey(checked as boolean)}
            />
            <label
              htmlFor="save-key"
              className="text-sm text-gray-600 leading-none cursor-pointer"
            >
              Save API key in this browser
            </label>
          </div>
          
          <div className="flex justify-end gap-2 mt-2">
            {apiKey && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleClearKey}
                disabled={!apiKey || isValidating}
              >
                Clear
              </Button>
            )}
            <Button 
              size="sm"
              onClick={handleSaveKey}
              disabled={!apiKey || isValidating}
              className={isValidating ? "opacity-80" : ""}
            >
              {isValidating ? "Validating..." : isKeyValid === true ? "Update API Key" : "Save & Use Key"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 