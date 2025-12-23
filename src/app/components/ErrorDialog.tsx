"use client";

import React from "react";
import { X, AlertCircle, AlertTriangle, XCircle } from "lucide-react";

export type ErrorSeverity = "error" | "warning" | "info";

interface ErrorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  severity?: ErrorSeverity;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
}

const ErrorDialog: React.FC<ErrorDialogProps> = ({
  isOpen,
  onClose,
  title,
  message,
  severity = "error",
  actionButton,
}) => {
  if (!isOpen) return null;

  const getSeverityConfig = () => {
    switch (severity) {
      case "warning":
        return {
          icon: AlertTriangle,
          bgColor: "from-amber-500 to-orange-500",
          borderColor: "border-amber-200",
          textColor: "text-amber-900",
          bgLight: "bg-amber-50",
        };
      case "info":
        return {
          icon: AlertCircle,
          bgColor: "from-blue-500 to-indigo-500",
          borderColor: "border-blue-200",
          textColor: "text-blue-900",
          bgLight: "bg-blue-50",
        };
      default: // error
        return {
          icon: XCircle,
          bgColor: "from-red-500 to-rose-500",
          borderColor: "border-red-200",
          textColor: "text-red-900",
          bgLight: "bg-red-50",
        };
    }
  };

  const config = getSeverityConfig();
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header with gradient */}
        <div className={`bg-gradient-to-r ${config.bgColor} p-6 rounded-t-2xl`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className={`rounded-lg ${config.bgLight} border ${config.borderColor} p-4 mb-6`}>
            <p className={`text-sm ${config.textColor} leading-relaxed`}>
              {message}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {actionButton && (
              <button
                onClick={() => {
                  actionButton.onClick();
                  onClose();
                }}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white rounded-lg font-medium hover:from-[#B8A040] hover:to-[#A69035] transition-all shadow-md hover:shadow-lg"
              >
                {actionButton.label}
              </button>
            )}
            <button
              onClick={onClose}
              className={`${actionButton ? 'flex-1' : 'w-full'} px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors`}
            >
              {actionButton ? "Cancel" : "Close"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorDialog;
