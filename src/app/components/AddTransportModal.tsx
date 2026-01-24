"use client";

import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import type { TransportTable, TransportRow, TransportColumn } from '../types/TransportTypes';
import {
  getTransportTemplates,
  saveTransportTemplate,
  deleteTransportTemplate,
  Template,
} from "@/app/services/TemplatesApi";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

interface AddTransportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title?: string;
    showTitle?: boolean;
    tables: TransportTable[];
    direction?: "rtl" | "ltr";
    language?: "ar" | "en";
  }) => void;
}

export default function AddTransportModal({
  isOpen,
  onClose,
  onSubmit,
}: AddTransportModalProps) {
  const [title, setTitle] = useState("المواصلات");
  const [showTitle, setShowTitle] = useState(true);
  const [direction, setDirection] = useState<"rtl" | "ltr">("rtl");
  const [language, setLanguage] = useState<"ar" | "en">("ar");
  const [tables, setTables] = useState<TransportTable[]>([
    {
      id: `table_${Date.now()}`,
      title: "",
      backgroundColor: 'dark-blue',
      columns: [
        { key: 'day', label: language === 'ar' ? 'يوم' : 'Day' },
        { key: 'date', label: language === 'ar' ? 'التاريخ' : 'Date' },
        { key: 'from', label: language === 'ar' ? 'من' : 'From' },
        { key: 'to', label: language === 'ar' ? 'إلى' : 'To' },
        { key: 'carType', label: language === 'ar' ? 'نوع السياره' : 'Car Type' },
        { key: 'description', label: language === 'ar' ? 'الوصف' : 'Description' },
      ],
      rows: [
        {
          day: "",
          date: new Date().toISOString().split('T')[0],
          from: "",
          to: "",
          fromLink: "",
          toLink: "",
          carType: "",
          description: "",
        }
      ]
    }
  ]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // Template-related state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [showTemplateSelection, setShowTemplateSelection] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [showDeleteTemplateModal, setShowDeleteTemplateModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch templates when modal opens
  const fetchTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const result = await getTransportTemplates();
      setTemplates(result.templates || []);
      // Always show template selection UI (including empty state)
      setShowTemplateSelection(true);
    } catch (err) {
      console.error("Failed to fetch templates:", err);
      setTemplates([]);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle("المواصلات");
      setShowTitle(true);
      setDirection("rtl");
      setLanguage("ar");
      setTables([
        {
          id: `table_${Date.now()}`,
          title: "",
          backgroundColor: 'dark-blue',
          columns: [
            { key: 'day', label: 'يوم' },
            { key: 'date', label: 'التاريخ' },
            { key: 'from', label: 'من' },
            { key: 'to', label: 'إلى' },
            { key: 'carType', label: 'نوع السياره' },
            { key: 'description', label: 'الوصف' },
          ],
          rows: [
            {
              day: "",
              date: new Date().toISOString().split('T')[0],
              from: "",
              to: "",
              fromLink: "",
              toLink: "",
              carType: "",
              description: "",
            }
          ]
        }
      ]);
      setErrors({});
      setShowTemplateSelection(false);
      setShowSaveTemplateModal(false);
      setTemplateName("");
      fetchTemplates();
    }
  }, [isOpen]);

  // Load template data into form
  const loadTemplate = (template: Template) => {
    const data = template.data as any;
    if (data.title !== undefined) setTitle(data.title || "المواصلات");
    if (data.showTitle !== undefined) setShowTitle(data.showTitle);
    if (data.direction) setDirection(data.direction);
    if (data.language) setLanguage(data.language);
    if (data.tables && data.tables.length > 0) {
      setTables(data.tables);
    }
    setShowTemplateSelection(false);
  };

  // Save current form as template
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error(language === 'ar' ? 'يرجى إدخال اسم القالب' : 'Please enter a template name');
      return;
    }

    try {
      const templateData = {
        title,
        showTitle,
        tables: tables.map(table => ({
          ...table,
          rows: table.rows.map(row => ({
            ...row,
            description: row.description || "",
          }))
        })),
        direction,
        language,
      };

      await saveTransportTemplate(templateName.trim(), templateData);
      setShowSaveTemplateModal(false);
      setTemplateName("");
      await fetchTemplates(); // Refresh templates list
      toast.success(language === 'ar' ? 'تم حفظ القالب بنجاح' : 'Template saved successfully');
    } catch (err) {
      console.error("Failed to save template:", err);
      toast.error(language === 'ar' ? 'فشل حفظ القالب' : 'Failed to save template');
    }
  };

  // Export current form as JSON
  const handleExportJSON = () => {
    const exportData = {
      name: title || "Transport Section",
      template_type: "transport",
      data: {
        title,
        showTitle,
        tables,
        direction,
        language,
      },
      exported_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transport-template-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import template from JSON file
  const handleImportJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      if (!importData.data || !importData.data.tables) {
        toast.error(language === 'ar' ? 'ملف JSON غير صالح' : 'Invalid JSON file');
        return;
      }

      // Load imported data into form
      const data = importData.data;
      if (data.title !== undefined) setTitle(data.title || "المواصلات");
      if (data.showTitle !== undefined) setShowTitle(data.showTitle);
      if (data.direction) setDirection(data.direction);
      if (data.language) setLanguage(data.language);
      if (data.tables && data.tables.length > 0) {
        setTables(data.tables);
      }

      toast.success(language === 'ar' ? 'تم استيراد القالب بنجاح' : 'Template imported successfully');
    } catch (err) {
      console.error("Failed to import template:", err);
      toast.error(language === 'ar' ? 'فشل استيراد القالب' : 'Failed to import template');
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Delete template
  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await deleteTransportTemplate(templateId);
      setShowDeleteTemplateModal(false);
      setTemplateToDelete(null);
      await fetchTemplates(); // Refresh templates list
      toast.success(language === 'ar' ? 'تم حذف القالب بنجاح' : 'Template deleted successfully');
    } catch (err) {
      console.error("Failed to delete template:", err);
      toast.error(language === 'ar' ? 'فشل حذف القالب' : 'Failed to delete template');
    }
  };

  // Update column labels when language changes
  useEffect(() => {
    const defaultLabels = language === 'ar' ? {
      day: 'يوم',
      date: 'التاريخ',
      from: 'من',
      to: 'إلى',
      carType: 'نوع السياره',
      description: 'الوصف'
    } : {
      day: 'Day',
      date: 'Date',
      from: 'From',
      to: 'To',
      carType: 'Car Type',
      description: 'Description'
    };

    setTables(prevTables => prevTables.map(table => ({
      ...table,
      columns: table.columns.map(col => {
        const defaultLabel = defaultLabels[col.key as keyof typeof defaultLabels];
        return {
          ...col,
          label: defaultLabel || col.label
        };
      })
    })));
  }, [language]);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    console.log('[AddTransportModal] Validating...');
    console.log('[AddTransportModal] Tables length:', tables.length);

    if (tables.length === 0) {
      newErrors.tables = "At least one table is required";
    }

    tables.forEach((table, tableIndex) => {
      console.log(`[AddTransportModal] Validating table ${tableIndex}:`, table);
      
      // Table title is optional - remove validation
      if (table.rows.length === 0) {
        newErrors[`table_${tableIndex}_rows`] = "At least one row is required";
      }
      table.rows.forEach((row, rowIndex) => {
        console.log(`[AddTransportModal] Validating row ${rowIndex}:`, row);
        
        table.columns.forEach((column) => {
          if (column.key === 'day' && !row.day?.trim()) {
            console.log(`[AddTransportModal] Day is missing in table ${tableIndex}, row ${rowIndex}`);
            newErrors[`table_${tableIndex}_row_${rowIndex}_day`] = "Day is required";
          }
          if (column.key === 'date' && !row.date) {
            console.log(`[AddTransportModal] Date is missing in table ${tableIndex}, row ${rowIndex}`);
            newErrors[`table_${tableIndex}_row_${rowIndex}_date`] = "Date is required";
          }
        });
      });
    });

    console.log('[AddTransportModal] Validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('[AddTransportModal] handleSubmit called');
    console.log('[AddTransportModal] Tables:', tables);
    console.log('[AddTransportModal] Title:', title);
    
    if (!validate()) {
      console.log('[AddTransportModal] Validation failed, errors:', errors);
      return;
    }

    console.log('[AddTransportModal] Validation passed, calling onSubmit');
    onSubmit({
      title: title.trim() || undefined,
      showTitle,
      tables,
      direction,
      language,
    });

    onClose();
  };

  const addTable = () => {
    setTables([
      ...tables,
      {
        id: `table_${Date.now()}_${Math.random()}`,
        title: "",
        backgroundColor: 'dark-blue',
        columns: [
          { key: 'day', label: language === 'ar' ? 'يوم' : 'Day' },
          { key: 'date', label: language === 'ar' ? 'التاريخ' : 'Date' },
          { key: 'from', label: language === 'ar' ? 'من' : 'From' },
          { key: 'to', label: language === 'ar' ? 'إلى' : 'To' },
          { key: 'carType', label: language === 'ar' ? 'نوع السياره' : 'Car Type' },
          { key: 'description', label: language === 'ar' ? 'الوصف' : 'Description' },
        ],
        rows: [
          {
            day: "",
            date: new Date().toISOString().split('T')[0],
            from: "",
            to: "",
            fromLink: "",
            toLink: "",
            carType: "",
            description: "",
          }
        ]
      }
    ]);
  };

  const removeTable = (index: number) => {
    if (tables.length > 1) {
      setTables(tables.filter((_, i) => i !== index));
    }
  };

  const updateTable = (index: number, field: keyof TransportTable | 'columns' | 'rows', value: any) => {
    const newTables = [...tables];
    if (field === 'columns') {
      newTables[index] = {
        ...newTables[index],
        columns: value
      };
    } else if (field === 'rows') {
      newTables[index] = {
        ...newTables[index],
        rows: value
      };
    } else {
      newTables[index] = {
        ...newTables[index],
        [field]: value
      };
    }
    setTables(newTables);
  };

  const addRow = (tableIndex: number) => {
    const newTables = [...tables];
    const table = newTables[tableIndex];
    const newRow: TransportRow = {
      day: "",
      date: new Date().toISOString().split('T')[0],
      from: "",
      to: "",
      fromLink: "",
      toLink: "",
      carType: "",
      description: "",
    };
    // Initialize all column values
    table.columns.forEach(col => {
      if (!newRow[col.key]) {
        newRow[col.key] = "";
      }
    });
    table.rows.push(newRow);
    setTables(newTables);
  };

  const removeRow = (tableIndex: number, rowIndex: number) => {
    const newTables = [...tables];
    if (newTables[tableIndex].rows.length > 1) {
      newTables[tableIndex].rows = newTables[tableIndex].rows.filter((_, i) => i !== rowIndex);
      setTables(newTables);
    }
  };

  const updateRow = (tableIndex: number, rowIndex: number, field: string, value: any) => {
    const newTables = [...tables];
    newTables[tableIndex].rows[rowIndex] = {
      ...newTables[tableIndex].rows[rowIndex],
      [field]: value
    };
    setTables(newTables);
  };

  const addColumn = (tableIndex: number) => {
    const newTables = [...tables];
    const newKey = `column_${Date.now()}`;
    newTables[tableIndex].columns.push({
      key: newKey,
      label: language === 'ar' ? 'عمود جديد' : 'New Column'
    });
    // Add empty value for this column in all rows
    newTables[tableIndex].rows.forEach(row => {
      row[newKey] = "";
    });
    setTables(newTables);
  };

  const removeColumn = (tableIndex: number, columnIndex: number) => {
    const newTables = [...tables];
    const column = newTables[tableIndex].columns[columnIndex];
    // Allow deletion of any column
    newTables[tableIndex].columns = newTables[tableIndex].columns.filter((_, i) => i !== columnIndex);
    // Remove column data from all rows
    newTables[tableIndex].rows.forEach(row => {
      delete row[column.key];
    });
    setTables(newTables);
  };

  const updateColumn = (tableIndex: number, columnIndex: number, field: 'key' | 'label', value: string) => {
    const newTables = [...tables];
    const column = newTables[tableIndex].columns[columnIndex];
    // Allow changing any column
    newTables[tableIndex].columns[columnIndex] = {
      ...column,
      [field]: value
    };
    setTables(newTables);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-lg"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
            </svg>
            Add Transport Section
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Template Selection Section */}
          {showTemplateSelection && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                  </svg>
                  {language === 'ar' ? 'القوالب المحفوظة' : 'Saved Templates'}
                </h3>
                {templates.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowTemplateSelection(false)}
                    className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                  >
                    {language === 'ar' ? 'إخفاء' : 'Hide'}
                  </button>
                )}
              </div>
 
              {templates.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-400 transition-all cursor-pointer group"
                        onClick={() => loadTemplate(template)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                              {template.name}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {(template.data as any)?.tables?.length || 0} {language === 'ar' ? 'جداول' : 'tables'}
                            </p>
                          </div>
                          <svg className="w-5 h-5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTemplateToDelete(template.id);
                              setShowDeleteTemplateModal(true);
                            }}
                            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded text-xs"
                            title={language === 'ar' ? 'حذف' : 'Delete'}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTemplateSelection(false)}
                    className="mt-4 w-full text-sm text-blue-600 hover:text-blue-700 font-semibold py-2 rounded-lg hover:bg-blue-100/50 transition-colors"
                  >
                    {language === 'ar' ? '+ بدء جديد' : '+ Start Fresh'}
                  </button>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">
                    {language === 'ar' ? 'لا توجد قوالب محفوظة' : 'No Saved Templates'}
                  </h4>
                  <p className="text-xs text-gray-500 mb-4 max-w-xs mx-auto">
                    {language === 'ar' 
                      ? 'ابدأ بإنشاء قسم مواصلات جديد وحفظه كقالب لاستخدام لاحق' 
                      : 'Create a new transport section and save it as a template for future use'}
                  </p>
                  <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 text-left text-xs text-blue-800 mb-4">
                    <p className="font-semibold mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2z" clipRule="evenodd" />
                      </svg>
                      {language === 'ar' ? 'نصيحة' : 'Quick Tip'}
                    </p>
                    {language === 'ar' 
                      ? 'ستتمكن من حفظ النماذج التي تنشئها وإعادة استخدامها بسرعة' 
                      : 'You can save the forms you create and reuse them quickly'}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTemplateSelection(false)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all shadow-md font-medium text-sm"
                  >
                    {language === 'ar' ? 'إنشاء القسم الأول' : 'Create Your First'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Section Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Section Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent"
              placeholder="Transportation"
            />
            <div className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="showTitle"
                checked={showTitle}
                onChange={(e) => setShowTitle(e.target.checked)}
                className="w-4 h-4 text-[#1E3A8A] rounded focus:ring-[#1E3A8A]"
              />
              <label htmlFor="showTitle" className="text-sm text-gray-700">
                Show Title
              </label>
            </div>
          </div>

          {/* Language & Direction */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => {
                  const newLang = e.target.value as "ar" | "en";
                  setLanguage(newLang);
                  setDirection(newLang === 'ar' ? 'rtl' : 'ltr');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent"
              >
                <option value="ar">Arabic</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Direction
              </label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as "rtl" | "ltr")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent"
              >
                <option value="rtl">Right to Left (RTL)</option>
                <option value="ltr">Left to Right (LTR)</option>
              </select>
            </div>
          </div>

          {/* Tables */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-semibold text-gray-700">
                Tables ({tables.length})
              </label>
              <button
                type="button"
                onClick={addTable}
                className="px-3 py-1.5 bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1E40AF] transition-colors text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Table
              </button>
            </div>
            
            <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
              {tables.map((table, tableIndex) => (
                <div key={table.id} className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-gray-700">Table {tableIndex + 1}</span>
                    {tables.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTable(tableIndex)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove Table
                      </button>
                    )}
                  </div>

                  {/* Table Title */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Table Title (Optional)
                    </label>
                    <input
                      type="text"
                      value={table.title}
                      onChange={(e) => updateTable(tableIndex, 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent text-sm"
                      placeholder={language === 'ar' ? 'عنوان الجدول' : 'Table Title'}
                    />
                  </div>

                  {/* Background Color */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Background Color
                    </label>
                    <select
                      value={table.backgroundColor}
                      onChange={(e) => updateTable(tableIndex, 'backgroundColor', e.target.value as 'dark-blue' | 'dark-red' | 'pink')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent text-sm"
                    >
                      <option value="dark-blue">Dark Blue</option>
                      <option value="dark-red">Dark Red</option>
                      <option value="pink">Pink</option>
                    </select>
                  </div>

                  {/* Columns */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-medium text-gray-600">
                        Columns ({table.columns.length})
                      </label>
                      <button
                        type="button"
                        onClick={() => addColumn(tableIndex)}
                        className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                      >
                        Add Column
                      </button>
                    </div>
                    <div className="space-y-2">
                      {table.columns.map((column, colIndex) => (
                        <div key={colIndex} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={column.key}
                            onChange={(e) => updateColumn(tableIndex, colIndex, 'key', e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Column Key"
                          />
                          <input
                            type="text"
                            value={column.label}
                            onChange={(e) => updateColumn(tableIndex, colIndex, 'label', e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Column Label"
                          />
                          <button
                            type="button"
                            onClick={() => removeColumn(tableIndex, colIndex)}
                            className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rows */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-medium text-gray-600">
                        Rows ({table.rows.length})
                      </label>
                      <button
                        type="button"
                        onClick={() => addRow(tableIndex)}
                        className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                      >
                        Add Row
                      </button>
                    </div>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {table.rows.map((row, rowIndex) => (
                        <div key={rowIndex} className="border border-gray-200 rounded p-3 bg-white">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-600">Row {rowIndex + 1}</span>
                            {table.rows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeRow(tableIndex, rowIndex)}
                                className="text-red-600 hover:text-red-700 text-xs"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {table.columns.map((column) => (
                              <div key={column.key}>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  {column.label}
                                </label>
                                {column.key === 'date' ? (
                                  <input
                                    type="date"
                                    value={row[column.key] || ''}
                                    onChange={(e) => updateRow(tableIndex, rowIndex, column.key, e.target.value)}
                                    className={`w-full px-2 py-1 border rounded text-sm ${
                                      errors[`table_${tableIndex}_row_${rowIndex}_${column.key}`] ? "border-red-500" : "border-gray-300"
                                    }`}
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    value={row[column.key] || ''}
                                    onChange={(e) => updateRow(tableIndex, rowIndex, column.key, e.target.value)}
                                    className={`w-full px-2 py-1 border rounded text-sm ${
                                      errors[`table_${tableIndex}_row_${rowIndex}_${column.key}`] ? "border-red-500" : "border-gray-300"
                                    }`}
                                    placeholder={column.label}
                                  />
                                )}
                                {errors[`table_${tableIndex}_row_${rowIndex}_${column.key}`] && (
                                  <p className="text-red-500 text-xs mt-1">{errors[`table_${tableIndex}_row_${rowIndex}_${column.key}`]}</p>
                                )}
                              </div>
                            ))}
                            {/* From Link field */}
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                From Link (Optional) 🔗
                              </label>
                              <input
                                type="url"
                                value={row.fromLink || ''}
                                onChange={(e) => updateRow(tableIndex, rowIndex, 'fromLink', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Location link"
                              />
                            </div>
                            
                            {/* To Link field */}
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                To Link (Optional) 🔗
                              </label>
                              <input
                                type="url"
                                value={row.toLink || ''}
                                onChange={(e) => updateRow(tableIndex, rowIndex, 'toLink', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Location link"
                              />
                            </div>
                            
                            {/* Note field */}
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Note (Optional) 🚗
                              </label>
                              <input
                                type="text"
                                value={row.note || ''}
                                onChange={(e) => updateRow(tableIndex, rowIndex, 'note', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Add note..."
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {errors[`table_${tableIndex}_rows`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`table_${tableIndex}_rows`]}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {errors.tables && (
              <p className="text-red-500 text-xs mt-2">{errors.tables}</p>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportJSON}
              className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
              title={language === 'ar' ? 'تصدير JSON' : 'Export JSON'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {language === 'ar' ? 'تصدير' : 'Export'}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
              title={language === 'ar' ? 'استيراد JSON' : 'Import JSON'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {language === 'ar' ? 'استيراد' : 'Import'}
            </button>
            <button
              type="button"
              onClick={() => setShowSaveTemplateModal(true)}
              className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
              title={language === 'ar' ? 'حفظ كقالب' : 'Save as Template'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {language === 'ar' ? 'حفظ' : 'Save'}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-5 py-2 bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] text-white rounded-lg hover:from-[#1E40AF] hover:to-[#1E3A8A] transition-all shadow-md hover:shadow-lg font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {language === 'ar' ? 'إضافة القسم' : 'Add Section'}
            </button>
          </div>
        </div>
        
        {/* Hidden file input for JSON import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImportJSON}
          className="hidden"
        />
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>

      {/* Save Template Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSaveTemplateModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {language === 'ar' ? 'حفظ كقالب' : 'Save as Template'}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'اسم القالب' : 'Template Name'}
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveTemplate();
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent"
                placeholder={language === 'ar' ? 'أدخل اسم القالب' : 'Enter template name'}
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveTemplateModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveTemplate}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1E40AF] transition-colors"
              >
                {language === 'ar' ? 'حفظ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Template Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteTemplateModal}
        onClose={() => {
          setShowDeleteTemplateModal(false);
          setTemplateToDelete(null);
        }}
        onConfirm={() => {
          if (templateToDelete) {
            handleDeleteTemplate(templateToDelete);
          }
        }}
        title={language === 'ar' ? 'حذف القالب' : 'Delete Template'}
        message={language === 'ar' ? 'هل أنت متأكد من حذف هذا القالب؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to delete this template? This action cannot be undone.'}
        confirmButtonText={language === 'ar' ? 'حذف' : 'Delete'}
      />
    </div>
  );
}

