"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import StructureRenderer from "../../components/StructureRenderer";
import AddAirplaneModal, { FlightData } from "../../components/AddAirplaneModal";
import AddHotelModal from "../../components/AddHotelModal";
import AddTransportModal from "../../components/AddTransportModal";
import EditFlightModal from "../../components/EditFlightModal";
import EditHotelModal from "../../components/EditHotelModal";
import EditAirplaneSectionModal from "../../components/EditAirplaneSectionModal";
import EditHotelSectionModal from "../../components/EditHotelSectionModal";
import EditTransportRowModal from "../../components/EditTransportRowModal";
import EditTransportTableModal from "../../components/EditTransportTableModal";
import EditTransportSectionModal from "../../components/EditTransportSectionModal";
import VersionHistoryModal from "../../components/VersionHistoryModal";
import type { ExtractResponse, SeparatedStructure, Section, Table, UserElement } from "../../types/ExtractTypes";
import { isLegacyStructure, migrateToSeparatedStructure } from "../../utils/structureMigration";
import { isAuthenticated } from "../../services/AuthApi";
import { getDocument, updateDocument, saveDocument } from "../../services/HistoryApi";
import ProtectedRoute from "../../components/ProtectedRoute";
import { exportToPDF } from "../../utils/pdfExport";

function DocumentViewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [structure, setStructure] = useState<SeparatedStructure | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [originalFilename, setOriginalFilename] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  // Modal states
  const [showAddAirplaneModal, setShowAddAirplaneModal] = useState(false);
  const [showAddHotelModal, setShowAddHotelModal] = useState(false);
  const [showAddTransportModal, setShowAddTransportModal] = useState(false);
  const [editingAirplaneId, setEditingAirplaneId] = useState<string | null>(null);
  const [editingFlightIndex, setEditingFlightIndex] = useState<number | null>(null);
  const [showEditFlightModal, setShowEditFlightModal] = useState(false);
  const [showEditSectionModal, setShowEditSectionModal] = useState(false);
  const [editingHotelId, setEditingHotelId] = useState<string | null>(null);
  const [editingHotelIndex, setEditingHotelIndex] = useState<number | null>(null);
  const [showEditHotelModal, setShowEditHotelModal] = useState(false);
  const [showEditHotelSectionModal, setShowEditHotelSectionModal] = useState(false);
  const [editingTransportId, setEditingTransportId] = useState<string | null>(null);
  const [editingTransportTableIndex, setEditingTransportTableIndex] = useState<number | null>(null);
  const [editingTransportRowIndex, setEditingTransportRowIndex] = useState<number | null>(null);
  const [showEditTransportRowModal, setShowEditTransportRowModal] = useState(false);
  const [showEditTransportTableModal, setShowEditTransportTableModal] = useState(false);
  const [showEditTransportSectionModal, setShowEditTransportSectionModal] = useState(false);
  const [showVersionHistoryModal, setShowVersionHistoryModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Load structure from sessionStorage or history
  useEffect(() => {
    const loadStructure = async () => {
      // Check if loading from history
      const docIdParam = searchParams?.get("docId");
      if (docIdParam && isAuthenticated()) {
        try {
          const response = await getDocument(docIdParam);
          const doc = response.document;
          setDocumentId(doc.id);
          setOriginalFilename(doc.original_filename || "");
          
          if (doc.extracted_data) {
            const extractedData = doc.extracted_data as ExtractResponse;
            const normalizedStructure = normalizeToSeparatedStructure(extractedData);
            setStructure(normalizedStructure);
          }
        } catch (err) {
          console.error("Failed to load document:", err);
          alert("Failed to load document");
        }
        return;
      }

      // Load from sessionStorage
      if (typeof window !== "undefined") {
        const storedData = sessionStorage.getItem("documentView.extractedData");
        const storedFilename = sessionStorage.getItem("documentView.originalFilename");
        const storedDocId = sessionStorage.getItem("documentView.documentId");

        if (storedData) {
          try {
            const extractedData = JSON.parse(storedData) as ExtractResponse;
            const normalizedStructure = normalizeToSeparatedStructure(extractedData);
            setStructure(normalizedStructure);
            
            if (storedFilename) {
              setOriginalFilename(storedFilename);
            }
            if (storedDocId) {
              setDocumentId(storedDocId);
            }
          } catch (err) {
            console.error("Failed to parse stored data:", err);
          }
        }
      }
    };

    loadStructure();
  }, [searchParams]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showDropdown]);

  // Normalize ExtractResponse to SeparatedStructure
  const normalizeToSeparatedStructure = (data: ExtractResponse): SeparatedStructure => {
    if (isLegacyStructure(data)) {
      return migrateToSeparatedStructure(data);
    }
    
    // If already SeparatedStructure, return as is
    if ('generated' in data && 'user' in data) {
      return data as SeparatedStructure;
    }

    // Convert ExtractResponse to SeparatedStructure
    return {
      generated: {
        sections: data.sections || [],
        tables: data.tables || [],
      },
      user: {
        elements: [],
      },
      layout: [
        ...(data.sections || []).map(s => s.id),
        ...(data.tables || []).map(t => t.id),
      ],
      meta: data.meta || {},
    };
  };

  // Save structure to history
  const handleSave = useCallback(async () => {
    if (!structure) return;

    setIsSaving(true);
    setSaveStatus("idle");

    try {
      const extractedData: ExtractResponse = {
        sections: structure.generated.sections,
        tables: structure.generated.tables,
        meta: structure.meta,
      };

      if (documentId) {
        // Update existing document
        await updateDocument(documentId, {
          extracted_data: extractedData,
          metadata: {
            sectionsCount: structure.generated.sections.length,
            tablesCount: structure.generated.tables.length,
            userElementsCount: structure.user.elements.length,
            updatedAt: new Date().toISOString(),
          },
        });
      } else {
        // Create new document
        const docTitle = originalFilename?.replace(/\.pdf$/i, "") || "Untitled Document";
        const response = await saveDocument({
          title: docTitle,
          original_filename: originalFilename,
          file_path: "",
          extracted_data: extractedData,
          metadata: {
            sectionsCount: structure.generated.sections.length,
            tablesCount: structure.generated.tables.length,
            userElementsCount: structure.user.elements.length,
            createdAt: new Date().toISOString(),
          },
        });
        
        if (response.document?.id) {
          setDocumentId(response.document.id);
        }
      }

      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      console.error("Failed to save:", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setIsSaving(false);
    }
  }, [structure, documentId, originalFilename]);

  // Export to PDF
  const handleExportPDF = useCallback(async () => {
    if (!structure || !contentRef.current) return;

    try {
      const filename = originalFilename?.replace(/\.pdf$/i, "") || "document";
      await exportToPDF(contentRef.current, filename);
    } catch (err) {
      console.error("Failed to export PDF:", err);
      alert("Failed to export PDF");
    }
  }, [structure, originalFilename]);

  // Section/Table edit handlers
  const handleSectionEdit = useCallback((section: Section) => {
    if (!structure) return;

    setStructure({
      ...structure,
      generated: {
        ...structure.generated,
        sections: structure.generated.sections.map(s => 
          s.id === section.id ? section : s
        ),
      },
    });
  }, [structure]);

  const handleTableEdit = useCallback((table: Table) => {
    if (!structure) return;

    setStructure({
      ...structure,
      generated: {
        ...structure.generated,
        tables: structure.generated.tables.map(t => 
          t.id === table.id ? table : t
        ),
      },
    });
  }, [structure]);

  // Section/Table delete handlers
  const handleSectionDelete = useCallback((section: Section) => {
    if (!structure) return;
    if (!confirm("Are you sure you want to delete this section?")) return;

    setStructure({
      ...structure,
      generated: {
        ...structure.generated,
        sections: structure.generated.sections.filter(s => s.id !== section.id),
      },
      layout: structure.layout.filter(id => id !== section.id),
    });
  }, [structure]);

  const handleTableDelete = useCallback((table: Table) => {
    if (!structure) return;
    if (!confirm("Are you sure you want to delete this table?")) return;

    setStructure({
      ...structure,
      generated: {
        ...structure.generated,
        tables: structure.generated.tables.filter(t => t.id !== table.id),
      },
      layout: structure.layout.filter(id => id !== table.id),
    });
  }, [structure]);

  // Section/Table add after handlers
  const handleSectionAddAfter = useCallback((section: Section) => {
    // Open a modal or prompt to add a new section after this one
    // For now, we'll create an empty section
    if (!structure) return;

    const newId = `gen_sec_${Date.now()}`;
    const newSection: Section = {
      type: "section",
      id: newId,
      title: "New Section",
      content: "",
      order: section.order + 1,
      parent_id: section.parent_id,
    };

    // Insert after the current section in layout
    const sectionIndex = structure.layout.indexOf(section.id);
    const newLayout = [...structure.layout];
    if (sectionIndex !== -1) {
      newLayout.splice(sectionIndex + 1, 0, newId);
    } else {
      newLayout.push(newId);
    }

    setStructure({
      ...structure,
      generated: {
        ...structure.generated,
        sections: [...structure.generated.sections, newSection],
      },
      layout: newLayout,
    });
  }, [structure]);

  const handleTableAddAfter = useCallback((table: Table) => {
    // Open a modal or prompt to add a new table after this one
    // For now, we'll create an empty table
    if (!structure) return;

    const newId = `gen_tbl_${Date.now()}`;
    const newTable: Table = {
      type: "table",
      id: newId,
      columns: ["Column 1", "Column 2"],
      rows: [["", ""]],
      order: table.order + 1,
      section_id: table.section_id,
    };

    // Insert after the current table in layout
    const tableIndex = structure.layout.indexOf(table.id);
    const newLayout = [...structure.layout];
    if (tableIndex !== -1) {
      newLayout.splice(tableIndex + 1, 0, newId);
    } else {
      newLayout.push(newId);
    }

    setStructure({
      ...structure,
      generated: {
        ...structure.generated,
        tables: [...structure.generated.tables, newTable],
      },
      layout: newLayout,
    });
  }, [structure]);

  const handleUserElementEdit = useCallback((element: UserElement) => {
    if (element.type === "airplane") {
      setEditingAirplaneId(element.id);
      setShowEditSectionModal(true);
    } else if (element.type === "hotel") {
      setEditingHotelId(element.id);
      setShowEditHotelSectionModal(true);
    } else if (element.type === "transport") {
      setEditingTransportId(element.id);
      setShowEditTransportSectionModal(true);
    }
  }, []);

  const handleUserElementDelete = useCallback((id: string) => {
    if (!structure) return;

    setStructure({
      ...structure,
      user: {
        elements: structure.user.elements.filter(el => el.id !== id),
      },
      layout: structure.layout.filter(layoutId => layoutId !== id),
    });
  }, [structure]);

  // Add airplane section or flight to existing section
  const handleAddAirplane = useCallback((data: {
    title?: string;
    showTitle?: boolean;
    noticeMessage?: string;
    showNotice?: boolean;
    flights: FlightData[];
    direction?: "rtl" | "ltr";
    language?: "ar" | "en";
  }) => {
    if (!structure) return;

    // If editingAirplaneId is set, add flights to existing section
    if (editingAirplaneId) {
      setStructure({
        ...structure,
        user: {
          elements: structure.user.elements.map(el => {
            if (el.id === editingAirplaneId && el.type === 'airplane') {
              return {
                ...el,
                data: {
                  ...el.data,
                  flights: [...(el.data.flights || []), ...data.flights],
                },
              };
            }
            return el;
          }),
        },
      });
      setEditingAirplaneId(null);
    } else {
      // Create new airplane section
      const newId = `user_airplane_${Date.now()}`;
      const newElement: UserElement = {
        id: newId,
        type: "airplane",
        data: {
          flights: data.flights || [],
          title: data.title,
          showTitle: data.showTitle,
          noticeMessage: data.noticeMessage,
          showNotice: data.showNotice,
          direction: data.direction,
          language: data.language,
        },
        order: structure.user.elements.length,
      };

      setStructure({
        ...structure,
        user: {
          elements: [...structure.user.elements, newElement],
        },
        layout: [...structure.layout, newId],
      });
    }

    setShowAddAirplaneModal(false);
  }, [structure, editingAirplaneId]);

  // Add hotel section or hotel to existing section
  const handleAddHotel = useCallback((data: {
    title?: string;
    showTitle?: boolean;
    hotels: any[];
    direction?: "rtl" | "ltr";
    language?: "ar" | "en";
    labels?: any;
  }) => {
    if (!structure) return;

    // If editingHotelId is set, add hotels to existing section
    if (editingHotelId) {
      setStructure({
        ...structure,
        user: {
          elements: structure.user.elements.map(el => {
            if (el.id === editingHotelId && el.type === 'hotel') {
              return {
                ...el,
                data: {
                  ...el.data,
                  hotels: [...(el.data.hotels || []), ...(data.hotels || [])],
                },
              };
            }
            return el;
          }),
        },
      });
      setEditingHotelId(null);
    } else {
      // Create new hotel section
      const newId = `user_hotel_${Date.now()}`;
      const newElement: UserElement = {
        id: newId,
        type: "hotel",
        data: {
          hotels: data.hotels || [],
          title: data.title,
          showTitle: data.showTitle,
          direction: data.direction,
          language: data.language,
          labels: data.labels,
        },
        order: structure.user.elements.length,
      };

      setStructure({
        ...structure,
        user: {
          elements: [...structure.user.elements, newElement],
        },
        layout: [...structure.layout, newId],
      });
    }

    setShowAddHotelModal(false);
  }, [structure, editingHotelId]);

  // Add transport section
  const handleAddTransport = useCallback((data: any) => {
    if (!structure) return;

    const newId = `user_transport_${Date.now()}`;
    const newElement: UserElement = {
      id: newId,
      type: "transport" as any,
      data: {
        tables: [data],
        title: data.title,
        showTitle: data.showTitle,
      },
      order: structure.user.elements.length,
    };

    setStructure({
      ...structure,
      user: {
        elements: [...structure.user.elements, newElement],
      },
      layout: [...structure.layout, newId],
    });

    setShowAddTransportModal(false);
  }, [structure]);

  // Airplane section handlers
  const handleEditFlight = useCallback((sectionId: string, flightIndex: number) => {
    const element = structure?.user.elements.find(el => el.id === sectionId);
    if (!element || element.type !== 'airplane') return;

    setEditingAirplaneId(sectionId);
    setEditingFlightIndex(flightIndex);
    setShowEditFlightModal(true);
  }, [structure]);

  const handleRemoveFlight = useCallback((sectionId: string, flightIndex: number) => {
    if (!structure) return;

    setStructure({
      ...structure,
      user: {
        elements: structure.user.elements.map(el => {
          if (el.id === sectionId && el.type === 'airplane') {
            const flights = [...(el.data.flights || [])];
            flights.splice(flightIndex, 1);
            return {
              ...el,
              data: {
                ...el.data,
                flights,
              },
            };
          }
          return el;
        }),
      },
    });
  }, [structure]);

  const handleAddFlightToSection = useCallback((sectionId: string) => {
    setEditingAirplaneId(sectionId);
    setEditingFlightIndex(null);
    // If adding to existing section, we'll handle it differently
    // For now, just open the add modal - we'll check if sectionId exists when submitting
    setShowAddAirplaneModal(true);
  }, []);

  // Hotel section handlers
  const handleEditHotel = useCallback((sectionId: string, hotelIndex: number) => {
    const element = structure?.user.elements.find(el => el.id === sectionId);
    if (!element || element.type !== 'hotel') return;

    setEditingHotelId(sectionId);
    setEditingHotelIndex(hotelIndex);
    setShowEditHotelModal(true);
  }, [structure]);

  const handleRemoveHotel = useCallback((sectionId: string, hotelIndex: number) => {
    if (!structure) return;

    setStructure({
      ...structure,
      user: {
        elements: structure.user.elements.map(el => {
          if (el.id === sectionId && el.type === 'hotel') {
            const hotels = [...(el.data.hotels || [])];
            hotels.splice(hotelIndex, 1);
            return {
              ...el,
              data: {
                ...el.data,
                hotels,
              },
            };
          }
          return el;
        }),
      },
    });
  }, [structure]);

  const handleAddHotelToSection = useCallback((sectionId: string) => {
    setEditingHotelId(sectionId);
    setEditingHotelIndex(null);
    setShowAddHotelModal(true);
  }, []);

  // Transport section handlers
  const handleEditTransportRow = useCallback((sectionId: string, tableIndex: number, rowIndex: number) => {
    setEditingTransportId(sectionId);
    setEditingTransportTableIndex(tableIndex);
    setEditingTransportRowIndex(rowIndex);
    setShowEditTransportRowModal(true);
  }, []);

  const handleRemoveTransportRow = useCallback((sectionId: string, tableIndex: number, rowIndex: number) => {
    if (!structure) return;

    setStructure({
      ...structure,
      user: {
        elements: structure.user.elements.map(el => {
          if (el.id === sectionId && el.type === 'transport') {
            const tables = [...(el.data.tables || [])];
            if (tables[tableIndex]) {
              const rows = [...tables[tableIndex].rows];
              rows.splice(rowIndex, 1);
              tables[tableIndex] = {
                ...tables[tableIndex],
                rows,
              };
            }
            return {
              ...el,
              data: {
                ...el.data,
                tables,
              },
            };
          }
          return el;
        }),
      },
    });
  }, [structure]);

  const handleAddTransportRow = useCallback((sectionId: string, tableIndex: number) => {
    setEditingTransportId(sectionId);
    setEditingTransportTableIndex(tableIndex);
    setEditingTransportRowIndex(null);
    // Note: We need to create a modal or handler for adding transport rows
    // For now, this will be handled by the transport section's onAddRow
  }, []);

  const handleEditTransportTable = useCallback((sectionId: string, tableIndex: number) => {
    setEditingTransportId(sectionId);
    setEditingTransportTableIndex(tableIndex);
    setShowEditTransportTableModal(true);
  }, []);

  const handleDeleteTransportTable = useCallback((sectionId: string, tableIndex: number) => {
    if (!structure) return;

    setStructure({
      ...structure,
      user: {
        elements: structure.user.elements.map(el => {
          if (el.id === sectionId && el.type === 'transport') {
            const tables = [...(el.data.tables || [])];
            tables.splice(tableIndex, 1);
            return {
              ...el,
              data: {
                ...el.data,
                tables,
              },
            };
          }
          return el;
        }),
      },
    });
  }, [structure]);

  if (!structure) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A4C639] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation Bar */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
              <Image
                src="/logoHappylife.jpg"
                alt="HappyLife Travel & Tourism"
                width={150}
                height={50}
                className="object-contain"
                priority
              />
            </Link>
            <div className="flex items-center gap-4 relative">
              {/* Dropdown Menu */}
              <div className="relative dropdown-container">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="px-4 py-2 bg-[#A4C639] text-white rounded-lg hover:bg-[#8FB02E] transition-colors text-sm flex items-center gap-2"
                >
                  <span>Actions</span>
                  <svg 
                    className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    <button
                      onClick={() => {
                        setShowAddAirplaneModal(true);
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Add Airplane
                    </button>
                    <button
                      onClick={() => {
                        setShowAddHotelModal(true);
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Add Hotel
                    </button>
                    <button
                      onClick={() => {
                        setShowAddTransportModal(true);
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      Add Transport
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    {documentId && (
                      <button
                        onClick={() => {
                          setShowVersionHistoryModal(true);
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Versions
                      </button>
                    )}
                    <button
                      onClick={() => {
                        handleExportPDF();
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export PDF
                    </button>
                    <button
                      onClick={() => {
                        handleSave();
                        setShowDropdown(false);
                      }}
                      disabled={isSaving}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[#A4C639]/10 hover:text-[#A4C639] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                    {saveStatus === "success" && (
                      <div className="px-4 py-2 text-sm text-green-600">✓ Saved</div>
                    )}
                    {saveStatus === "error" && (
                      <div className="px-4 py-2 text-sm text-red-600">✗ Error</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Header Image */}
      <div className="w-full relative overflow-hidden">
        <img
          src="/happylifeHeader.jpeg"
          alt="HappyLife Header"
          className="w-full h-auto object-cover block"
          style={{ maxHeight: "520px" }}
          loading="eager"
        />
      </div>

      {/* Main Document Container - Enhanced Professional Design */}
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          {/* Document Container with Professional Styling */}
          <div 
            ref={contentRef} 
            className="
              bg-white 
              rounded-xl 
              shadow-2xl 
              border border-gray-200
              overflow-hidden
              transition-all duration-300
              hover:shadow-3xl
              print:shadow-none
              print:border-0
              print:rounded-none
            "
            style={{
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
          >
            {/* Document Header Section */}
            {originalFilename && (
              <div className="
                bg-gradient-to-r from-[#A4C639] to-[#8FB02E]
                px-6 sm:px-8 lg:px-12
                py-6 sm:py-8
                border-b-4 border-[#8FB02E]
              ">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex-1 min-w-0">
                    <h1 className="
                      text-xl sm:text-2xl lg:text-3xl 
                      font-bold 
                      text-white 
                      truncate
                      drop-shadow-lg
                    ">
                      {originalFilename}
                    </h1>
                    {documentId && (
                      <p className="text-sm sm:text-base text-white/90 mt-2">
                        Document ID: <span className="font-mono text-xs">{documentId.slice(0, 8)}...</span>
                      </p>
                    )}
                  </div>
                  {documentId && (
                    <div className="flex items-center gap-2">
                      <span className="
                        px-3 py-1 
                        bg-white/20 
                        backdrop-blur-sm
                        rounded-full 
                        text-xs sm:text-sm 
                        text-white 
                        font-semibold
                        border border-white/30
                      ">
                        Saved
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Document Content Area - Enhanced Padding & Spacing */}
            <div className="
              px-4 sm:px-6 lg:px-12 
              py-6 sm:py-8 lg:py-12
              print:px-8
              print:py-6
            ">
              {/* Loading State */}
              {!structure && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A4C639] mb-4"></div>
                  <p className="text-gray-500 text-sm">Loading document...</p>
                </div>
              )}

              {/* Empty State */}
              {structure && 
               structure.generated.sections.length === 0 && 
               structure.generated.tables.length === 0 && 
               structure.user.elements.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <svg 
                    className="w-16 h-16 text-gray-300 mb-4" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500 text-lg font-medium mb-2">No content yet</p>
                  <p className="text-gray-400 text-sm">Start by adding sections, tables, or custom elements</p>
                </div>
              )}

              {/* Document Content */}
              {structure && (
                <div className="
                  space-y-6 sm:space-y-8 lg:space-y-10
                  print:space-y-6
                ">
                  <StructureRenderer
                    structure={structure}
                    editable={true}
                    onSectionEdit={handleSectionEdit}
                    onTableEdit={handleTableEdit}
                    onSectionDelete={handleSectionDelete}
                    onTableDelete={handleTableDelete}
                    onSectionAddAfter={handleSectionAddAfter}
                    onTableAddAfter={handleTableAddAfter}
                    onUserElementEdit={handleUserElementEdit}
                    onUserElementDelete={handleUserElementDelete}
                    onEditFlight={handleEditFlight}
                    onRemoveFlight={handleRemoveFlight}
                    onAddFlight={handleAddFlightToSection}
                    onEditHotel={handleEditHotel}
                    onRemoveHotel={handleRemoveHotel}
                    onAddHotel={handleAddHotelToSection}
                    onEditTransportRow={handleEditTransportRow}
                    onRemoveTransportRow={handleRemoveTransportRow}
                    onAddTransportRow={handleAddTransportRow}
                    onEditTransportTable={handleEditTransportTable}
                    onDeleteTransportTable={handleDeleteTransportTable}
                  />
                </div>
              )}
            </div>

            {/* Document Footer Section */}
            <div className="
              bg-gray-50 
              border-t border-gray-200
              px-6 sm:px-8 lg:px-12
              py-4 sm:py-6
              print:hidden
            ">
              <div className="flex items-center justify-between flex-wrap gap-4 text-xs sm:text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {structure?.generated.sections.length || 0} Sections
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {structure?.generated.tables.length || 0} Tables
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {structure?.user.elements.length || 0} Custom Elements
                  </span>
                </div>
                {originalFilename && (
                  <div className="text-gray-400">
                    Last updated: {new Date().toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Image */}
      <div className="w-full relative overflow-hidden mt-8 sm:mt-12">
        <img
          src="/happylifeFooter.jpg"
          alt="HappyLife Footer"
          className="w-full h-auto object-cover block"
          style={{ maxHeight: "100px" }}
          loading="lazy"
        />
      </div>

      {/* Modals */}
      <AddAirplaneModal
        isOpen={showAddAirplaneModal}
        onClose={() => setShowAddAirplaneModal(false)}
        onSubmit={handleAddAirplane}
      />

      <AddHotelModal
        isOpen={showAddHotelModal}
        onClose={() => setShowAddHotelModal(false)}
        onSubmit={handleAddHotel}
      />

      <AddTransportModal
        isOpen={showAddTransportModal}
        onClose={() => setShowAddTransportModal(false)}
        onSubmit={handleAddTransport}
      />

      {/* Edit Modals */}
      {editingAirplaneId !== null && editingFlightIndex !== null && (
        <EditFlightModal
          isOpen={showEditFlightModal}
          onClose={() => {
            setShowEditFlightModal(false);
            setEditingAirplaneId(null);
            setEditingFlightIndex(null);
          }}
          onSubmit={(updatedFlight) => {
            if (!structure || editingAirplaneId === null || editingFlightIndex === null) return;

            setStructure({
              ...structure,
              user: {
                elements: structure.user.elements.map(el => {
                  if (el.id === editingAirplaneId && el.type === 'airplane') {
                    const flights = [...(el.data.flights || [])];
                    flights[editingFlightIndex] = updatedFlight;
                    return {
                      ...el,
                      data: {
                        ...el.data,
                        flights,
                      },
                    };
                  }
                  return el;
                }),
              },
            });

            setShowEditFlightModal(false);
            setEditingAirplaneId(null);
            setEditingFlightIndex(null);
          }}
          initialFlight={(() => {
            const element = structure?.user.elements.find(el => el.id === editingAirplaneId);
            if (element && element.type === 'airplane' && editingFlightIndex !== null) {
              return element.data.flights?.[editingFlightIndex];
            }
            return undefined;
          })()}
        />
      )}

      {editingAirplaneId !== null && (
        <EditAirplaneSectionModal
          isOpen={showEditSectionModal}
          onClose={() => {
            setShowEditSectionModal(false);
            setEditingAirplaneId(null);
          }}
          onSubmit={(props) => {
            if (!structure || editingAirplaneId === null) return;

            setStructure({
              ...structure,
              user: {
                elements: structure.user.elements.map(el => {
                  if (el.id === editingAirplaneId && el.type === 'airplane') {
                    return {
                      ...el,
                      data: {
                        ...el.data,
                        ...props,
                      },
                    };
                  }
                  return el;
                }),
              },
            });

            setShowEditSectionModal(false);
            setEditingAirplaneId(null);
          }}
          initialData={(() => {
            const element = structure?.user.elements.find(el => el.id === editingAirplaneId);
            if (element && element.type === 'airplane') {
              return {
                title: element.data.title,
                showTitle: element.data.showTitle,
                noticeMessage: element.data.noticeMessage,
                showNotice: element.data.showNotice,
                direction: element.data.direction,
                language: element.data.language,
              };
            }
            return undefined;
          })()}
        />
      )}

      {editingHotelId !== null && editingHotelIndex !== null && (
        <EditHotelModal
          isOpen={showEditHotelModal}
          onClose={() => {
            setShowEditHotelModal(false);
            setEditingHotelId(null);
            setEditingHotelIndex(null);
          }}
          onSubmit={(updatedHotel) => {
            if (!structure || editingHotelId === null || editingHotelIndex === null) return;

            setStructure({
              ...structure,
              user: {
                elements: structure.user.elements.map(el => {
                  if (el.id === editingHotelId && el.type === 'hotel') {
                    const hotels = [...(el.data.hotels || [])];
                    hotels[editingHotelIndex] = updatedHotel;
                    return {
                      ...el,
                      data: {
                        ...el.data,
                        hotels,
                      },
                    };
                  }
                  return el;
                }),
              },
            });

            setShowEditHotelModal(false);
            setEditingHotelId(null);
            setEditingHotelIndex(null);
          }}
          initialHotel={(() => {
            const element = structure?.user.elements.find(el => el.id === editingHotelId);
            if (element && element.type === 'hotel' && editingHotelIndex !== null) {
              return element.data.hotels?.[editingHotelIndex];
            }
            return undefined;
          })()}
        />
      )}

      {editingHotelId !== null && (
        <EditHotelSectionModal
          isOpen={showEditHotelSectionModal}
          onClose={() => {
            setShowEditHotelSectionModal(false);
            setEditingHotelId(null);
          }}
          onSubmit={(props) => {
            if (!structure || editingHotelId === null) return;

            setStructure({
              ...structure,
              user: {
                elements: structure.user.elements.map(el => {
                  if (el.id === editingHotelId && el.type === 'hotel') {
                    return {
                      ...el,
                      data: {
                        ...el.data,
                        ...props,
                      },
                    };
                  }
                  return el;
                }),
              },
            });

            setShowEditHotelSectionModal(false);
            setEditingHotelId(null);
          }}
          initialData={(() => {
            const element = structure?.user.elements.find(el => el.id === editingHotelId);
            if (element && element.type === 'hotel') {
              return {
                title: element.data.title,
                showTitle: element.data.showTitle,
              };
            }
            return undefined;
          })()}
        />
      )}

      {editingTransportId !== null && editingTransportTableIndex !== null && editingTransportRowIndex !== null && (
        <EditTransportRowModal
          isOpen={showEditTransportRowModal}
          onClose={() => {
            setShowEditTransportRowModal(false);
            setEditingTransportId(null);
            setEditingTransportTableIndex(null);
            setEditingTransportRowIndex(null);
          }}
          onSubmit={(updatedRow) => {
            if (!structure || editingTransportId === null || editingTransportTableIndex === null || editingTransportRowIndex === null) return;

            setStructure({
              ...structure,
              user: {
                elements: structure.user.elements.map(el => {
                  if (el.id === editingTransportId && el.type === 'transport') {
                    const tables = [...(el.data.tables || [])];
                    if (tables[editingTransportTableIndex]) {
                      const rows = [...tables[editingTransportTableIndex].rows];
                      rows[editingTransportRowIndex] = updatedRow;
                      tables[editingTransportTableIndex] = {
                        ...tables[editingTransportTableIndex],
                        rows,
                      };
                    }
                    return {
                      ...el,
                      data: {
                        ...el.data,
                        tables,
                      },
                    };
                  }
                  return el;
                }),
              },
            });

            setShowEditTransportRowModal(false);
            setEditingTransportId(null);
            setEditingTransportTableIndex(null);
            setEditingTransportRowIndex(null);
          }}
          initialRow={(() => {
            const element = structure?.user.elements.find(el => el.id === editingTransportId);
            if (element && element.type === 'transport' && editingTransportTableIndex !== null && editingTransportRowIndex !== null) {
              return element.data.tables?.[editingTransportTableIndex]?.rows?.[editingTransportRowIndex];
            }
            return undefined;
          })()}
          columns={(() => {
            const element = structure?.user.elements.find(el => el.id === editingTransportId);
            if (element && element.type === 'transport' && editingTransportTableIndex !== null) {
              return element.data.tables?.[editingTransportTableIndex]?.columns || [];
            }
            return [];
          })()}
          language={(() => {
            const element = structure?.user.elements.find(el => el.id === editingTransportId);
            if (element && element.type === 'transport') {
              return element.data.language || 'ar';
            }
            return 'ar';
          })()}
        />
      )}

      {editingTransportId !== null && editingTransportTableIndex !== null && (
        <EditTransportTableModal
          isOpen={showEditTransportTableModal}
          onClose={() => {
            setShowEditTransportTableModal(false);
            setEditingTransportId(null);
            setEditingTransportTableIndex(null);
          }}
          onSubmit={(updatedTable) => {
            if (!structure || editingTransportId === null || editingTransportTableIndex === null) return;

            setStructure({
              ...structure,
              user: {
                elements: structure.user.elements.map(el => {
                  if (el.id === editingTransportId && el.type === 'transport') {
                    const tables = [...(el.data.tables || [])];
                    tables[editingTransportTableIndex] = updatedTable;
                    return {
                      ...el,
                      data: {
                        ...el.data,
                        tables,
                      },
                    };
                  }
                  return el;
                }),
              },
            });

            setShowEditTransportTableModal(false);
            setEditingTransportId(null);
            setEditingTransportTableIndex(null);
          }}
          initialTable={(() => {
            const element = structure?.user.elements.find(el => el.id === editingTransportId);
            if (element && element.type === 'transport' && editingTransportTableIndex !== null) {
              return element.data.tables?.[editingTransportTableIndex];
            }
            return undefined;
          })()}
          language={(() => {
            const element = structure?.user.elements.find(el => el.id === editingTransportId);
            if (element && element.type === 'transport') {
              return element.data.language || 'ar';
            }
            return 'ar';
          })()}
        />
      )}

      {editingTransportId !== null && (
        <EditTransportSectionModal
          isOpen={showEditTransportSectionModal}
          onClose={() => {
            setShowEditTransportSectionModal(false);
            setEditingTransportId(null);
          }}
          onSubmit={(props) => {
            if (!structure || editingTransportId === null) return;

            setStructure({
              ...structure,
              user: {
                elements: structure.user.elements.map(el => {
                  if (el.id === editingTransportId && el.type === 'transport') {
                    return {
                      ...el,
                      data: {
                        ...el.data,
                        ...props,
                      },
                    };
                  }
                  return el;
                }),
              },
            });

            setShowEditTransportSectionModal(false);
            setEditingTransportId(null);
          }}
          onDelete={() => {
            handleUserElementDelete(editingTransportId);
            setShowEditTransportSectionModal(false);
            setEditingTransportId(null);
          }}
          initialData={(() => {
            const element = structure?.user.elements.find(el => el.id === editingTransportId);
            if (element && element.type === 'transport') {
              return {
                title: element.data.title,
                showTitle: element.data.showTitle,
                direction: element.data.direction,
                language: element.data.language,
              };
            }
            return undefined;
          })()}
        />
      )}

      {/* Version History Modal */}
      {documentId && (
        <VersionHistoryModal
          isOpen={showVersionHistoryModal}
          docId={documentId}
          currentVersion={1}
          totalVersions={1}
          onClose={() => setShowVersionHistoryModal(false)}
          onRestore={async () => {
            // Reload document after restore
            if (documentId) {
              try {
                const response = await getDocument(documentId);
                const doc = response.document;
                if (doc.extracted_data) {
                  const extractedData = doc.extracted_data as ExtractResponse;
                  const normalizedStructure = normalizeToSeparatedStructure(extractedData);
                  setStructure(normalizedStructure);
                }
                setShowVersionHistoryModal(false);
              } catch (err) {
                console.error("Failed to reload document:", err);
                alert("Failed to reload document");
              }
            }
          }}
        />
      )}
    </div>
  );
}

export default function DocumentView() {
  return (
    <ProtectedRoute>
      <DocumentViewContent />
    </ProtectedRoute>
  );
}

