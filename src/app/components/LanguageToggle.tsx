"use client";

import React from "react";
import { useLanguage, Language } from "../contexts/LanguageContext";
import { Globe } from "lucide-react";

interface LanguageToggleProps {
  variant?: "icon" | "full" | "compact";
  className?: string;
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({ 
  variant = "compact",
  className = "" 
}) => {
  const { language, setLanguage, t, isRTL } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ar" : "en");
  };

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
  };

  // Icon only variant
  if (variant === "icon") {
    return (
      <button
        onClick={toggleLanguage}
        className={`p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center ${className}`}
        title={language === "en" ? "Switch to Arabic" : "Switch to English"}
        aria-label={language === "en" ? "Switch to Arabic" : "Switch to English"}
      >
        <Globe className="w-5 h-5 text-gray-600" />
      </button>
    );
  }

  // Compact variant - shows current language with toggle
  if (variant === "compact") {
    return (
      <button
        onClick={toggleLanguage}
        className={`flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 ${className}`}
        title={language === "en" ? "Switch to Arabic" : "Switch to English"}
      >
        <Globe className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">
          {language === "en" ? "EN" : "عربي"}
        </span>
        <div className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${
          language === "ar" ? "bg-gradient-to-r from-[#C4B454] to-[#B8A040]" : "bg-gray-300"
        }`}>
          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
            language === "ar" ? (isRTL ? "left-0.5" : "right-0.5 translate-x-0") : (isRTL ? "right-0.5" : "left-0.5")
          }`} style={{
            transform: language === "ar" ? "translateX(20px)" : "translateX(0)"
          }} />
        </div>
      </button>
    );
  }

  // Full variant - shows both options
  return (
    <div className={`flex items-center gap-1 p-1 bg-gray-100 rounded-xl ${className}`}>
      <button
        onClick={() => handleLanguageSelect("en")}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
          language === "en"
            ? "bg-white shadow-md text-gray-900"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        <span className="text-sm font-medium">English</span>
      </button>
      <button
        onClick={() => handleLanguageSelect("ar")}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
          language === "ar"
            ? "bg-white shadow-md text-gray-900"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        <span className="text-sm font-medium">العربية</span>
      </button>
    </div>
  );
};

export default LanguageToggle;
