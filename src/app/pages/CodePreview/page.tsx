"use client";

import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import CodeEditor from "../../components/CodeEditor";
import PreviewRenderer from "../../components/PreviewRenderer";
import ToggleSwitch from "../../components/ToggleSwitch";
import CustomizationPanel, { PanelContext } from "../../components/CustomizationPanel";
import CreateTableModal from "../../components/CreateTableModal";
import AddAirplaneModal, { FlightData } from "../../components/AddAirplaneModal";
import EditFlightModal from "../../components/EditFlightModal";
import EditAirplaneSectionModal from "../../components/EditAirplaneSectionModal";;
import AddHotelModal from "../../components/AddHotelModal";
import EditHotelModal from "../../components/EditHotelModal";
import EditHotelSectionModal from "../../components/EditHotelSectionModal";
import { getElementInfo } from "../../utils/jsxParser";
import { addSection, addNewTable, updateTableCell, updateTableColumnHeader } from "../../utils/codeManipulator";
import { extractAllTablesFromDOM, updateCodeWithTableData } from "../../utils/extractTableData";
import { 
  findAirplaneSection, 
  updateFlightInComponent, 
  addFlightToComponent, 
  removeFlightFromComponent,
  removeAirplaneSection,
  updateAirplaneSectionProps,
  extractFlightsFromComponent
} from "../../utils/airplaneSectionManipulator";
import {
  findHotelSection,
  updateHotelInComponent,
  addHotelToComponent,
  removeHotelFromComponent,
  removeHotelSection,
  updateHotelSectionProps,
  extractHotelsFromComponent
} from "../../utils/hotelSectionManipulator";
import { Hotel } from "../../Templates/HotelsSection";
import { guardGeneratedContent } from "../../utils/contentGuards";
import { isAuthenticated } from "../../services/AuthApi";
import { saveDocument, updateDocument, getDocument } from "../../services/HistoryApi";
import ProtectedRoute from "../../components/ProtectedRoute";
import VersionHistoryModal from "../../components/VersionHistoryModal";

type Mode = "code" | "preview" | "split";

// Enhanced starter template showcasing DynamicTable, Section, and Header components
// Import components at the top of the generated template
const STARTER_TEMPLATE = `export default function Template() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto w-[794px] bg-white text-gray-900 shadow-lg print:shadow-none">
        {/* Header */}
        <div className="bg-linear-to-r from-[#A4C639] to-[#8FB02E] px-10 py-6">
          <div className="flex items-center justify-between">
            <div className="bg-white px-4 py-2 rounded">
              <h1 className="text-2xl font-bold text-[#A4C639]">
                HappyLife Travel & Tourism
              </h1>
            </div>
          </div>
        </div>

        {/* Main Title */}
        <div className="text-center py-6 px-10">
          <h1 className="text-3xl font-bold text-[#A4C639] underline decoration-2">
            Travel Package Template
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            Start editing this template or upload a PDF to generate a custom one
          </p>
        </div>

        {/* Content Section */}
        <div className="px-10 pb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Welcome to the Template Editor
          </h2>
          <p className="text-gray-700 mb-4">
            This is a simple starter template. You can:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Edit this code directly in the Code view</li>
            <li>Upload a PDF to generate a custom template with editable fields</li>
            <li>Export your template as code or PDF</li>
          </ul>
        </div>

        {/* Example Content */}
        <div className="px-10 pb-8">
          <h3 className="font-bold text-gray-900 mb-3">
            Example Section
          </h3>
          <p className="text-sm text-gray-700">
            Replace this with your own content. When you upload a PDF, 
            the AI will generate a template with your content and add 
            interactive editing features automatically.
          </p>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 px-10 py-4 text-center text-xs text-gray-600">
          <p>Created with HappyLife PDF Template Generator</p>
        </div>
      </div>
    </div>
  );
}`;

function CodePageContent() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("preview");
  const [code, setCode] = useState<string>(STARTER_TEMPLATE);
  const [values, setValues] = useState<Record<string, string>>({});
  const [externalWarnings, setExternalWarnings] = useState<string[]>([]);
  const [sourceMetadata, setSourceMetadata] = useState<{
    filename?: string;
    uploadedAt?: string;
  } | null>(null);
  const [processedTables, setProcessedTables] = useState<Array<{
    tableId: string;
    jsx: string;
  }>>([]);
  const [panelContext, setPanelContext] = useState<PanelContext>(null);
  const [isCreateTableModalOpen, setIsCreateTableModalOpen] = useState(false);
  const [showTableCreatedToast, setShowTableCreatedToast] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [totalVersions, setTotalVersions] = useState<number>(1);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [showAddAirplaneModal, setShowAddAirplaneModal] = useState(false);
  const [editingAirplaneId, setEditingAirplaneId] = useState<string | null>(null);
  const [editingFlightIndex, setEditingFlightIndex] = useState<number | null>(null);
  const [showEditFlightModal, setShowEditFlightModal] = useState(false);
  const [showEditSectionModal, setShowEditSectionModal] = useState(false);
  const [showAddHotelModal, setShowAddHotelModal] = useState(false);
  const [editingHotelId, setEditingHotelId] = useState<string | null>(null);
  const [editingHotelIndex, setEditingHotelIndex] = useState<number | null>(null);
  const [showEditHotelModal, setShowEditHotelModal] = useState(false);
  const [showEditHotelSectionModal, setShowEditHotelSectionModal] = useState(false);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<string>(code);
  
  // Event delegation for airplane section actions
  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return;
    
    const handleAirplaneSectionClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Find the button that was clicked (or its parent button)
      const button = target.closest('button[data-action]') as HTMLButtonElement;
      if (!button) return;
      
      const action = button.getAttribute('data-action');
      const sectionId = button.getAttribute('data-airplane-section-id');
      const flightIndexStr = button.getAttribute('data-flight-index');
      
      // Verify we have required attributes
      if (!action || !sectionId) return;
      
      // CRITICAL: Verify ID starts with user_airplane_ to prevent modifying generated content
      if (!sectionId.startsWith('user_airplane_')) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Attempted to ${action} on non-user airplane section: ${sectionId}`);
        }
        alert('Cannot modify generated content. Only user-created airplane sections can be edited.');
        return;
      }
      
      // Prevent default and stop propagation
      e.preventDefault();
      e.stopPropagation();
      
      // Route to appropriate handler
      switch (action) {
        case 'edit-flight': {
          const flightIndex = flightIndexStr ? parseInt(flightIndexStr, 10) : null;
          if (flightIndex === null || isNaN(flightIndex)) {
            console.error('Invalid flight index for edit-flight action');
            return;
          }
          setEditingAirplaneId(sectionId);
          setEditingFlightIndex(flightIndex);
          setShowEditFlightModal(true);
          if (process.env.NODE_ENV === 'development') {
            console.log(`Opening edit flight modal for section ${sectionId}, flight ${flightIndex}`);
          }
          break;
        }
        case 'remove-flight': {
          const flightIndex = flightIndexStr ? parseInt(flightIndexStr, 10) : null;
          if (flightIndex === null || isNaN(flightIndex)) {
            console.error('Invalid flight index for remove-flight action');
            return;
          }
          handleRemoveFlight(sectionId, flightIndex);
          break;
        }
        case 'add-flight': {
          handleAddFlight(sectionId);
          break;
        }
        case 'edit-section': {
          setEditingAirplaneId(sectionId);
          setEditingFlightIndex(null);
          setShowEditSectionModal(true);
          if (process.env.NODE_ENV === 'development') {
            console.log(`Opening edit section modal for section ${sectionId}`);
          }
          break;
        }
        case 'delete-section': {
          handleDeleteSection(sectionId);
          break;
        }
        default:
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Unknown airplane section action: ${action}`);
          }
      }
    };
    
    const handleHotelSectionClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Find the button that was clicked (or its parent button)
      const button = target.closest('button[data-action]') as HTMLButtonElement;
      if (!button) return;
      
      const action = button.getAttribute('data-action');
      const sectionId = button.getAttribute('data-hotels-section-id');
      const hotelIndexStr = button.getAttribute('data-hotel-index');
      
      // Verify we have required attributes
      if (!action || !sectionId) return;
      
      // CRITICAL: Verify ID starts with user_hotel_ to prevent modifying generated content
      if (!sectionId.startsWith('user_hotel_')) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Attempted to ${action} on non-user hotel section: ${sectionId}`);
        }
        alert('Cannot modify generated content. Only user-created hotel sections can be edited.');
        return;
      }
      
      // Prevent default and stop propagation
      e.preventDefault();
      e.stopPropagation();
      
      // Route to appropriate handler
      switch (action) {
        case 'edit-hotel': {
          const hotelIndex = hotelIndexStr ? parseInt(hotelIndexStr, 10) : null;
          if (hotelIndex === null || isNaN(hotelIndex)) {
            console.error('Invalid hotel index for edit-hotel action');
            return;
          }
          setEditingHotelId(sectionId);
          setEditingHotelIndex(hotelIndex);
          setShowEditHotelModal(true);
          if (process.env.NODE_ENV === 'development') {
            console.log(`Opening edit hotel modal for section ${sectionId}, hotel ${hotelIndex}`);
          }
          break;
        }
        case 'remove-hotel': {
          const hotelIndex = hotelIndexStr ? parseInt(hotelIndexStr, 10) : null;
          if (hotelIndex === null || isNaN(hotelIndex)) {
            console.error('Invalid hotel index for remove-hotel action');
            return;
          }
          handleRemoveHotel(sectionId, hotelIndex);
          break;
        }
        case 'add-hotel': {
          handleAddHotel(sectionId);
          break;
        }
        case 'edit-section': {
          setEditingHotelId(sectionId);
          setEditingHotelIndex(null);
          setShowEditHotelSectionModal(true);
          if (process.env.NODE_ENV === 'development') {
            console.log(`Opening edit section modal for section ${sectionId}`);
          }
          break;
        }
        case 'delete-section': {
          handleDeleteHotelSection(sectionId);
          break;
        }
        default:
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Unknown hotel section action: ${action}`);
          }
      }
    };
    
    container.addEventListener('click', handleAirplaneSectionClick);
    container.addEventListener('click', handleHotelSectionClick);
    
    return () => {
      container.removeEventListener('click', handleAirplaneSectionClick);
      container.removeEventListener('click', handleHotelSectionClick);
    };
  }, [code]);
  
  // Handler functions for airplane section actions
  const handleRemoveFlight = useCallback((id: string, flightIndex: number) => {
    try {
      // CRITICAL: Verify ID prefix - this is the primary isolation guard
      if (!id.startsWith('user_airplane_')) {
        const errorMsg = `SECURITY: Attempted to remove flight from non-user airplane section: ${id}. Only user_airplane_* sections can be modified.`;
        console.error(errorMsg);
        alert('Cannot modify generated content. Only user-created airplane sections can be edited.');
        return;
      }
      
      // Additional guard using contentGuards utility
      guardGeneratedContent(id, 'remove flight from');
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[AIRPLANE CRUD] Removing flight ${flightIndex} from airplane section ${id}`);
        console.log(`[ISOLATION CHECK] ID prefix verified: user_airplane_`);
      }
      
      const section = findAirplaneSection(codeRef.current, id);
      if (!section) {
        alert('Airplane section not found');
        return;
      }
      
      // Log what we're about to modify (for debugging)
      if (process.env.NODE_ENV === 'development') {
        console.log(`[AIRPLANE CRUD] Found section at index ${section.startIndex}-${section.endIndex}`);
        console.log(`[ISOLATION CHECK] Component contains ID: ${section.component.includes(id)}`);
      }
      
      const updatedComponent = removeFlightFromComponent(section.component, flightIndex);
      const updatedCode = codeRef.current.substring(0, section.startIndex) + 
        updatedComponent + 
        codeRef.current.substring(section.endIndex);
      
      // Verify the updated code still doesn't contain any generated table deletions
      if (process.env.NODE_ENV === 'development') {
        const originalTableCount = (codeRef.current.match(/<DynamicTable/g) || []).length;
        const updatedTableCount = (updatedCode.match(/<DynamicTable/g) || []).length;
        if (originalTableCount !== updatedTableCount) {
          console.warn(`[ISOLATION WARNING] Table count changed: ${originalTableCount} -> ${updatedTableCount}`);
        } else {
          console.log(`[ISOLATION CHECK] Table count preserved: ${originalTableCount}`);
        }
      }
      
      setCode(updatedCode);
    } catch (error) {
      console.error('[AIRPLANE CRUD ERROR] Error removing flight:', error);
      if (error instanceof Error && error.message.includes('generated content')) {
        alert('Cannot modify generated content. This operation is blocked for security.');
      } else {
        alert(error instanceof Error ? error.message : 'Failed to remove flight');
      }
    }
  }, []);
  
  const handleAddFlight = useCallback((id: string) => {
    try {
      // CRITICAL: Verify ID prefix
      if (!id.startsWith('user_airplane_')) {
        const errorMsg = `SECURITY: Attempted to add flight to non-user airplane section: ${id}`;
        console.error(errorMsg);
        alert('Cannot modify generated content. Only user-created airplane sections can be edited.');
        return;
      }
      
      guardGeneratedContent(id, 'add flight to');
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[AIRPLANE CRUD] Adding flight to airplane section ${id}`);
      }
      
      const section = findAirplaneSection(codeRef.current, id);
      if (!section) {
        alert('Airplane section not found');
        return;
      }
      
      const newFlight: FlightData = {
        date: new Date().toISOString().split('T')[0],
        fromAirport: "",
        toAirport: "",
        travelers: { adults: 1, children: 0, infants: 0 },
        luggage: "20 كيلو"
      };
      const updatedComponent = addFlightToComponent(section.component, newFlight);
      const updatedCode = codeRef.current.substring(0, section.startIndex) + 
        updatedComponent + 
        codeRef.current.substring(section.endIndex);
      setCode(updatedCode);
    } catch (error) {
      console.error('[AIRPLANE CRUD ERROR] Error adding flight:', error);
      if (error instanceof Error && error.message.includes('generated content')) {
        alert('Cannot modify generated content. This operation is blocked for security.');
      } else {
        alert(error instanceof Error ? error.message : 'Failed to add flight');
      }
    }
  }, []);
  
  const handleDeleteSection = useCallback((id: string) => {
    // CRITICAL: Verify ID prefix - primary isolation guard
    if (!id.startsWith('user_airplane_')) {
      const errorMsg = `SECURITY: Attempted to delete non-user airplane section: ${id}`;
      console.error(errorMsg);
      alert('Cannot delete generated content. Only user-created sections can be deleted.');
      return;
    }
    
    // Additional guard
    try {
      guardGeneratedContent(id, 'delete');
    } catch (error) {
      console.error('[ISOLATION GUARD]', error);
      alert('Cannot delete generated content. This operation is blocked.');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this airplane section?')) {
      return;
    }
    
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[AIRPLANE CRUD] Deleting airplane section ${id}`);
        console.log(`[ISOLATION CHECK] ID prefix verified: user_airplane_`);
        
        // Count tables before deletion
        const originalTableCount = (codeRef.current.match(/<DynamicTable/g) || []).length;
        const originalSectionCount = (codeRef.current.match(/<AirplaneSection/g) || []).length;
        console.log(`[ISOLATION CHECK] Before deletion - Tables: ${originalTableCount}, AirplaneSections: ${originalSectionCount}`);
      }
      
      const section = findAirplaneSection(codeRef.current, id);
      if (!section) {
        alert('Airplane section not found');
        return;
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[AIRPLANE CRUD] Found section to delete at index ${section.startIndex}-${section.endIndex}`);
        console.log(`[ISOLATION CHECK] Component preview: ${section.component.substring(0, 100)}...`);
      }
      
      const updatedCode = removeAirplaneSection(codeRef.current, id);
      
      // Verify isolation after deletion
      if (process.env.NODE_ENV === 'development') {
        const updatedTableCount = (updatedCode.match(/<DynamicTable/g) || []).length;
        const updatedSectionCount = (updatedCode.match(/<AirplaneSection/g) || []).length;
        console.log(`[ISOLATION CHECK] After deletion - Tables: ${updatedTableCount}, AirplaneSections: ${updatedSectionCount}`);
        
        if (updatedTableCount !== (codeRef.current.match(/<DynamicTable/g) || []).length) {
          console.error(`[ISOLATION ERROR] Table count changed during airplane section deletion!`);
          console.error(`Original: ${(codeRef.current.match(/<DynamicTable/g) || []).length}, Updated: ${updatedTableCount}`);
          alert('ERROR: Deletion affected generated tables. Operation cancelled.');
          return;
        }
        
        if (updatedSectionCount !== (codeRef.current.match(/<AirplaneSection/g) || []).length - 1) {
          console.warn(`[ISOLATION WARNING] AirplaneSection count mismatch. Expected: ${(codeRef.current.match(/<AirplaneSection/g) || []).length - 1}, Got: ${updatedSectionCount}`);
        }
      }
      
      setCode(updatedCode);
    } catch (error) {
      console.error('[AIRPLANE CRUD ERROR] Error deleting section:', error);
      if (error instanceof Error && error.message.includes('generated content')) {
        alert('Cannot delete generated content. This operation is blocked for security.');
      } else {
        alert(error instanceof Error ? error.message : 'Failed to delete section');
      }
    }
  }, []);
  
  // Handler for editing a flight
  const handleEditFlightSubmit = useCallback((updatedFlight: FlightData) => {
    if (!editingAirplaneId || editingFlightIndex === null) {
      return;
    }
    
    try {
      // CRITICAL: Verify ID prefix
      if (!editingAirplaneId.startsWith('user_airplane_')) {
        const errorMsg = `SECURITY: Attempted to edit flight in non-user airplane section: ${editingAirplaneId}`;
        console.error(errorMsg);
        alert('Cannot modify generated content. Only user-created airplane sections can be edited.');
        return;
      }
      
      guardGeneratedContent(editingAirplaneId, 'edit flight in');
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[AIRPLANE CRUD] Updating flight ${editingFlightIndex} in airplane section ${editingAirplaneId}`);
      }
      
      const section = findAirplaneSection(codeRef.current, editingAirplaneId);
      if (!section) {
        alert('Airplane section not found');
        return;
      }
      
      const updatedComponent = updateFlightInComponent(section.component, editingFlightIndex, updatedFlight);
      const updatedCode = codeRef.current.substring(0, section.startIndex) + 
        updatedComponent + 
        codeRef.current.substring(section.endIndex);
      setCode(updatedCode);
      
      setShowEditFlightModal(false);
      setEditingAirplaneId(null);
      setEditingFlightIndex(null);
    } catch (error) {
      console.error('[AIRPLANE CRUD ERROR] Error updating flight:', error);
      if (error instanceof Error && error.message.includes('generated content')) {
        alert('Cannot modify generated content. This operation is blocked for security.');
      } else {
        alert(error instanceof Error ? error.message : 'Failed to update flight');
      }
    }
  }, [editingAirplaneId, editingFlightIndex]);
  
  // Handler for editing section properties
  const handleEditSectionSubmit = useCallback((props: {
    title?: string;
    showTitle?: boolean;
    noticeMessage?: string;
    showNotice?: boolean;
    direction?: "rtl" | "ltr";
    language?: "ar" | "en";
  }) => {
    if (!editingAirplaneId) {
      return;
    }
    
    try {
      // CRITICAL: Verify ID prefix
      if (!editingAirplaneId.startsWith('user_airplane_')) {
        const errorMsg = `SECURITY: Attempted to edit non-user airplane section: ${editingAirplaneId}`;
        console.error(errorMsg);
        alert('Cannot modify generated content. Only user-created airplane sections can be edited.');
        return;
      }
      
      guardGeneratedContent(editingAirplaneId, 'edit');
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[AIRPLANE CRUD] Updating section properties for airplane section ${editingAirplaneId}`);
      }
      
      const section = findAirplaneSection(codeRef.current, editingAirplaneId);
      if (!section) {
        alert('Airplane section not found');
        return;
      }
      
      const updatedComponent = updateAirplaneSectionProps(section.component, props);
      const updatedCode = codeRef.current.substring(0, section.startIndex) + 
        updatedComponent + 
        codeRef.current.substring(section.endIndex);
      setCode(updatedCode);
      
      setShowEditSectionModal(false);
      setEditingAirplaneId(null);
    } catch (error) {
      console.error('[AIRPLANE CRUD ERROR] Error updating section:', error);
      if (error instanceof Error && error.message.includes('generated content')) {
        alert('Cannot modify generated content. This operation is blocked for security.');
      } else {
        alert(error instanceof Error ? error.message : 'Failed to update section');
      }
    }
  }, [editingAirplaneId]);
  
  // Get initial flight data for edit modal
  const getInitialFlightData = useCallback((): FlightData | null => {
    if (!editingAirplaneId || editingFlightIndex === null) {
      return null;
    }
    
    try {
      const section = findAirplaneSection(codeRef.current, editingAirplaneId);
      if (!section) {
        return null;
      }
      
      const flights = extractFlightsFromComponent(section.component);
      if (editingFlightIndex >= 0 && editingFlightIndex < flights.length) {
        return flights[editingFlightIndex];
      }
    } catch (error) {
      console.error('Error extracting flight data:', error);
    }
    
    return null;
  }, [editingAirplaneId, editingFlightIndex]);
  
  // Get initial section data for edit modal
  const getInitialSectionData = useCallback((): {
    title?: string;
    showTitle?: boolean;
    noticeMessage?: string;
    showNotice?: boolean;
    direction?: "rtl" | "ltr";
    language?: "ar" | "en";
  } | null => {
    if (!editingAirplaneId) {
      return null;
    }
    
    try {
      const section = findAirplaneSection(codeRef.current, editingAirplaneId);
      if (!section) {
        return null;
      }
      
      const component = section.component;
      const data: any = {};
      
      // Extract title
      const titleMatch = component.match(/title=["']([^"']*)["']/);
      if (titleMatch) {
        data.title = titleMatch[1].replace(/\\"/g, '"');
      }
      
      // Extract showTitle
      const showTitleMatch = component.match(/showTitle=\{?([^}]*)\}?/);
      if (showTitleMatch) {
        data.showTitle = showTitleMatch[1].trim() === 'true';
      }
      
      // Extract noticeMessage
      const noticeMatch = component.match(/noticeMessage=["']([^"']*)["']/);
      if (noticeMatch) {
        data.noticeMessage = noticeMatch[1].replace(/\\"/g, '"');
      }
      
      // Extract showNotice
      const showNoticeMatch = component.match(/showNotice=\{?([^}]*)\}?/);
      if (showNoticeMatch) {
        data.showNotice = showNoticeMatch[1].trim() === 'true';
      }
      
      // Extract direction
      const directionMatch = component.match(/direction=["']([^"']*)["']/);
      if (directionMatch) {
        data.direction = directionMatch[1] as "rtl" | "ltr";
      }
      
      // Extract language
      const languageMatch = component.match(/language=["']([^"']*)["']/);
      if (languageMatch) {
        data.language = languageMatch[1] as "ar" | "en";
      }
      
      return data;
    } catch (error) {
      console.error('Error extracting section data:', error);
    }
    
    return null;
  }, [editingAirplaneId]);

  // Handler functions for hotel section actions
  const handleRemoveHotel = useCallback((id: string, hotelIndex: number) => {
    try {
      // CRITICAL: Verify ID prefix - this is the primary isolation guard
      if (!id.startsWith('user_hotel_')) {
        const errorMsg = `SECURITY: Attempted to remove hotel from non-user hotel section: ${id}. Only user_hotel_* sections can be modified.`;
        console.error(errorMsg);
        alert('Cannot modify generated content. Only user-created hotel sections can be edited.');
        return;
      }
      
      // Additional guard using contentGuards utility
      guardGeneratedContent(id, 'remove hotel from');
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[HOTEL CRUD] Removing hotel ${hotelIndex} from hotel section ${id}`);
        console.log(`[ISOLATION CHECK] ID prefix verified: user_hotel_`);
      }
      
      const section = findHotelSection(codeRef.current, id);
      if (!section) {
        alert('Hotel section not found');
        return;
      }
      
      // Log what we're about to modify (for debugging)
      if (process.env.NODE_ENV === 'development') {
        console.log(`[HOTEL CRUD] Found section at index ${section.startIndex}-${section.endIndex}`);
        console.log(`[ISOLATION CHECK] Component contains ID: ${section.component.includes(id)}`);
      }
      
      const updatedComponent = removeHotelFromComponent(section.component, hotelIndex);
      const updatedCode = codeRef.current.substring(0, section.startIndex) + 
        updatedComponent + 
        codeRef.current.substring(section.endIndex);
      
      // Verify the updated code still doesn't contain any generated table deletions
      if (process.env.NODE_ENV === 'development') {
        const originalTableCount = (codeRef.current.match(/<DynamicTable/g) || []).length;
        const updatedTableCount = (updatedCode.match(/<DynamicTable/g) || []).length;
        if (originalTableCount !== updatedTableCount) {
          console.warn(`[ISOLATION WARNING] Table count changed: ${originalTableCount} -> ${updatedTableCount}`);
        } else {
          console.log(`[ISOLATION CHECK] Table count preserved: ${originalTableCount}`);
        }
      }
      
      setCode(updatedCode);
    } catch (error) {
      console.error('[HOTEL CRUD ERROR] Error removing hotel:', error);
      if (error instanceof Error && error.message.includes('generated content')) {
        alert('Cannot modify generated content. This operation is blocked for security.');
      } else {
        alert(error instanceof Error ? error.message : 'Failed to remove hotel');
      }
    }
  }, []);
  
  const handleAddHotel = useCallback((id: string) => {
    try {
      // CRITICAL: Verify ID prefix
      if (!id.startsWith('user_hotel_')) {
        const errorMsg = `SECURITY: Attempted to add hotel to non-user hotel section: ${id}`;
        console.error(errorMsg);
        alert('Cannot modify generated content. Only user-created hotel sections can be edited.');
        return;
      }
      
      guardGeneratedContent(id, 'add hotel to');
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[HOTEL CRUD] Adding hotel to hotel section ${id}`);
      }
      
      const section = findHotelSection(codeRef.current, id);
      if (!section) {
        alert('Hotel section not found');
        return;
      }
      
      const newHotel: Hotel = {
        city: "",
        nights: 1,
        hotelName: "",
        hasDetailsLink: false,
        roomDescription: {
          includesAll: "شامل الافطار",
          bedType: "سرير اضافي/ عدد: 2",
          roomType: ""
        },
        checkInDate: new Date().toISOString().split('T')[0],
        checkOutDate: new Date().toISOString().split('T')[0],
        dayInfo: {
          checkInDay: "اليوم الاول",
          checkOutDay: "اليوم الثاني"
        }
      };
      const updatedComponent = addHotelToComponent(section.component, newHotel);
      const updatedCode = codeRef.current.substring(0, section.startIndex) + 
        updatedComponent + 
        codeRef.current.substring(section.endIndex);
      setCode(updatedCode);
    } catch (error) {
      console.error('[HOTEL CRUD ERROR] Error adding hotel:', error);
      if (error instanceof Error && error.message.includes('generated content')) {
        alert('Cannot modify generated content. This operation is blocked for security.');
      } else {
        alert(error instanceof Error ? error.message : 'Failed to add hotel');
      }
    }
  }, []);
  
  const handleDeleteHotelSection = useCallback((id: string) => {
    // CRITICAL: Verify ID prefix - primary isolation guard
    if (!id.startsWith('user_hotel_')) {
      const errorMsg = `SECURITY: Attempted to delete non-user hotel section: ${id}`;
      console.error(errorMsg);
      alert('Cannot delete generated content. Only user-created sections can be deleted.');
      return;
    }
    
    // Additional guard
    try {
      guardGeneratedContent(id, 'delete');
    } catch (error) {
      console.error('[ISOLATION GUARD]', error);
      alert('Cannot delete generated content. This operation is blocked.');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this hotel section?')) {
      return;
    }
    
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[HOTEL CRUD] Deleting hotel section ${id}`);
        console.log(`[ISOLATION CHECK] ID prefix verified: user_hotel_`);
        
        // Count tables before deletion
        const originalTableCount = (codeRef.current.match(/<DynamicTable/g) || []).length;
        const originalSectionCount = (codeRef.current.match(/<HotelsSection/g) || []).length;
        console.log(`[ISOLATION CHECK] Before deletion - Tables: ${originalTableCount}, HotelsSections: ${originalSectionCount}`);
      }
      
      const section = findHotelSection(codeRef.current, id);
      if (!section) {
        alert('Hotel section not found');
        return;
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[HOTEL CRUD] Found section to delete at index ${section.startIndex}-${section.endIndex}`);
        console.log(`[ISOLATION CHECK] Component preview: ${section.component.substring(0, 100)}...`);
      }
      
      const updatedCode = removeHotelSection(codeRef.current, id);
      
      // Verify isolation after deletion
      if (process.env.NODE_ENV === 'development') {
        const updatedTableCount = (updatedCode.match(/<DynamicTable/g) || []).length;
        const updatedSectionCount = (updatedCode.match(/<HotelsSection/g) || []).length;
        console.log(`[ISOLATION CHECK] After deletion - Tables: ${updatedTableCount}, HotelsSections: ${updatedSectionCount}`);
        
        if (updatedTableCount !== (codeRef.current.match(/<DynamicTable/g) || []).length) {
          console.error(`[ISOLATION ERROR] Table count changed during hotel section deletion!`);
          console.error(`Original: ${(codeRef.current.match(/<DynamicTable/g) || []).length}, Updated: ${updatedTableCount}`);
          alert('ERROR: Deletion affected generated tables. Operation cancelled.');
          return;
        }
        
        if (updatedSectionCount !== (codeRef.current.match(/<HotelsSection/g) || []).length - 1) {
          console.warn(`[ISOLATION WARNING] HotelsSection count mismatch. Expected: ${(codeRef.current.match(/<HotelsSection/g) || []).length - 1}, Got: ${updatedSectionCount}`);
        }
      }
      
      setCode(updatedCode);
    } catch (error) {
      console.error('[HOTEL CRUD ERROR] Error deleting section:', error);
      if (error instanceof Error && error.message.includes('generated content')) {
        alert('Cannot delete generated content. This operation is blocked for security.');
      } else {
        alert(error instanceof Error ? error.message : 'Failed to delete section');
      }
    }
  }, []);
  
  // Handler for editing a hotel
  const handleEditHotelSubmit = useCallback((updatedHotel: Hotel) => {
    if (!editingHotelId || editingHotelIndex === null) {
      return;
    }
    
    try {
      // CRITICAL: Verify ID prefix
      if (!editingHotelId.startsWith('user_hotel_')) {
        const errorMsg = `SECURITY: Attempted to edit hotel in non-user hotel section: ${editingHotelId}`;
        console.error(errorMsg);
        alert('Cannot modify generated content. Only user-created hotel sections can be edited.');
        return;
      }
      
      guardGeneratedContent(editingHotelId, 'edit hotel in');
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[HOTEL CRUD] Updating hotel ${editingHotelIndex} in hotel section ${editingHotelId}`);
      }
      
      const section = findHotelSection(codeRef.current, editingHotelId);
      if (!section) {
        alert('Hotel section not found');
        return;
      }
      
      const updatedComponent = updateHotelInComponent(section.component, editingHotelIndex, updatedHotel);
      const updatedCode = codeRef.current.substring(0, section.startIndex) + 
        updatedComponent + 
        codeRef.current.substring(section.endIndex);
      setCode(updatedCode);
      
      setShowEditHotelModal(false);
      setEditingHotelId(null);
      setEditingHotelIndex(null);
    } catch (error) {
      console.error('[HOTEL CRUD ERROR] Error updating hotel:', error);
      if (error instanceof Error && error.message.includes('generated content')) {
        alert('Cannot modify generated content. This operation is blocked for security.');
      } else {
        alert(error instanceof Error ? error.message : 'Failed to update hotel');
      }
    }
  }, [editingHotelId, editingHotelIndex]);
  
  // Handler for editing section properties
  const handleEditHotelSectionSubmit = useCallback((props: {
    title?: string;
    showTitle?: boolean;
    direction?: "rtl" | "ltr";
    language?: "ar" | "en";
    labels?: {
      nights: string;
      includes: string;
      checkIn: string;
      checkOut: string;
      details: string;
      count: string;
    };
  }) => {
    if (!editingHotelId) {
      return;
    }
    
    try {
      // CRITICAL: Verify ID prefix
      if (!editingHotelId.startsWith('user_hotel_')) {
        const errorMsg = `SECURITY: Attempted to edit non-user hotel section: ${editingHotelId}`;
        console.error(errorMsg);
        alert('Cannot modify generated content. Only user-created hotel sections can be edited.');
        return;
      }
      
      guardGeneratedContent(editingHotelId, 'edit');
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[HOTEL CRUD] Updating section properties for hotel section ${editingHotelId}`);
      }
      
      const section = findHotelSection(codeRef.current, editingHotelId);
      if (!section) {
        alert('Hotel section not found');
        return;
      }
      
      const updatedComponent = updateHotelSectionProps(section.component, props);
      const updatedCode = codeRef.current.substring(0, section.startIndex) + 
        updatedComponent + 
        codeRef.current.substring(section.endIndex);
      setCode(updatedCode);
      
      setShowEditHotelSectionModal(false);
      setEditingHotelId(null);
    } catch (error) {
      console.error('[HOTEL CRUD ERROR] Error updating section:', error);
      if (error instanceof Error && error.message.includes('generated content')) {
        alert('Cannot modify generated content. This operation is blocked for security.');
      } else {
        alert(error instanceof Error ? error.message : 'Failed to update section');
      }
    }
  }, [editingHotelId]);
  
  // Get initial hotel data for edit modal
  const getInitialHotelData = useCallback((): Hotel | null => {
    if (!editingHotelId || editingHotelIndex === null) {
      return null;
    }
    
    try {
      const section = findHotelSection(codeRef.current, editingHotelId);
      if (!section) {
        return null;
      }
      
      const hotels = extractHotelsFromComponent(section.component);
      if (editingHotelIndex >= 0 && editingHotelIndex < hotels.length) {
        return hotels[editingHotelIndex];
      }
    } catch (error) {
      console.error('Error extracting hotel data:', error);
    }
    
    return null;
  }, [editingHotelId, editingHotelIndex]);
  
  // Get initial section data for edit modal
  const getInitialHotelSectionData = useCallback((): {
    title?: string;
    showTitle?: boolean;
    direction?: "rtl" | "ltr";
    language?: "ar" | "en";
    labels?: {
      nights: string;
      includes: string;
      checkIn: string;
      checkOut: string;
      details: string;
      count: string;
    };
  } | null => {
    if (!editingHotelId) {
      return null;
    }
    
    try {
      const section = findHotelSection(codeRef.current, editingHotelId);
      if (!section) {
        return null;
      }
      
      const component = section.component;
      const data: any = {};
      
      // Extract title
      const titleMatch = component.match(/title=["']([^"']*)["']/);
      if (titleMatch) {
        data.title = titleMatch[1].replace(/\\"/g, '"');
      }
      
      // Extract showTitle
      const showTitleMatch = component.match(/showTitle=\{?([^}]*)\}?/);
      if (showTitleMatch) {
        data.showTitle = showTitleMatch[1].trim() === 'true';
      }
      
      // Extract direction
      const directionMatch = component.match(/direction=["']([^"']*)["']/);
      if (directionMatch) {
        data.direction = directionMatch[1] as "rtl" | "ltr";
      }
      
      // Extract language
      const languageMatch = component.match(/language=["']([^"']*)["']/);
      if (languageMatch) {
        data.language = languageMatch[1] as "ar" | "en";
      }
      
      // Extract labels
      const labelsMatch = component.match(/labels\s*=\s*\{[\s\S]*?\}/);
      if (labelsMatch) {
        const labelsStr = labelsMatch[0];
        const nightsMatch = labelsStr.match(/nights\s*:\s*["']([^"']*)["']/);
        const includesMatch = labelsStr.match(/includes\s*:\s*["']([^"']*)["']/);
        const checkInMatch = labelsStr.match(/checkIn\s*:\s*["']([^"']*)["']/);
        const checkOutMatch = labelsStr.match(/checkOut\s*:\s*["']([^"']*)["']/);
        const detailsMatch = labelsStr.match(/details\s*:\s*["']([^"']*)["']/);
        const countMatch = labelsStr.match(/count\s*:\s*["']([^"']*)["']/);
        
        if (nightsMatch || includesMatch || checkInMatch || checkOutMatch || detailsMatch || countMatch) {
          data.labels = {
            nights: nightsMatch ? nightsMatch[1].replace(/\\"/g, '"') : "ليالي",
            includes: includesMatch ? includesMatch[1].replace(/\\"/g, '"') : "شامل الافطار",
            checkIn: checkInMatch ? checkInMatch[1].replace(/\\"/g, '"') : "تاريخ الدخول",
            checkOut: checkOutMatch ? checkOutMatch[1].replace(/\\"/g, '"') : "تاريخ الخروج",
            details: detailsMatch ? detailsMatch[1].replace(/\\"/g, '"') : "للتفاصيل",
            count: countMatch ? countMatch[1].replace(/\\"/g, '"') : "عدد"
          };
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error extracting hotel section data:', error);
    }
    
    return null;
  }, [editingHotelId]);
  
  // Keep code ref updated
  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if we're loading a specific document
    const docIdParam = searchParams?.get("docId");
    if (docIdParam && isAuthenticated()) {
      loadDocument(docIdParam);
      return;
    }

    const storedCode = sessionStorage.getItem("codePreview.initialCode");
    const storedWarnings = sessionStorage.getItem("codePreview.warnings");
    const storedMetadata = sessionStorage.getItem("codePreview.metadata");
    const storedTables = sessionStorage.getItem("codePreview.processedTables");
    const storedDocId = sessionStorage.getItem("codePreview.documentId");

    if (storedDocId) {
      setDocumentId(storedDocId);
      sessionStorage.removeItem("codePreview.documentId");
    }

    if (storedCode) {
      // Clean and fix import paths when loading from storage
      import("../../utils/parseGptCode").then(({ cleanJSXCode }) => {
        const cleanedCode = cleanJSXCode(storedCode);
        setCode(cleanedCode);
      });
      sessionStorage.removeItem("codePreview.initialCode");
    }

    if (storedWarnings) {
      try {
        const parsed = JSON.parse(storedWarnings);
        if (Array.isArray(parsed)) {
          setExternalWarnings(parsed as string[]);
        }
      } catch {
        // ignore parse errors
      }
      sessionStorage.removeItem("codePreview.warnings");
    }

    if (storedMetadata) {
      try {
        const parsed = JSON.parse(storedMetadata);
        setSourceMetadata(parsed);
      } catch {
        // ignore parse errors
      }
      sessionStorage.removeItem("codePreview.metadata");
    }

    if (storedTables) {
      try {
        const parsed = JSON.parse(storedTables);
        if (Array.isArray(parsed)) {
          setProcessedTables(parsed);
        }
      } catch {
        // ignore parse errors
      }
      sessionStorage.removeItem("codePreview.processedTables");
    }
  }, [searchParams]);

  const loadDocument = async (docId: string) => {
    try {
      const response = await getDocument(docId);
      const doc = response.document;
      
      setDocumentId(doc.id);
      setCurrentVersion(doc.current_version || 1);
      setTotalVersions(doc.total_versions || 1);
      if (doc.jsx_code) {
        setCode(doc.jsx_code);
      }
      if (doc.metadata) {
        setSourceMetadata({
          filename: doc.metadata.filename || doc.original_filename,
          uploadedAt: doc.created_at,
        });
        if (doc.metadata.warnings) {
          setExternalWarnings(doc.metadata.warnings);
        }
      }
    } catch (err) {
      console.error("Failed to load document:", err);
      alert("Failed to load document");
    }
  };

  const handleRestore = async () => {
    if (!documentId) return;
    try {
      const response = await getDocument(documentId);
      const doc = response.document;
      
      setCurrentVersion(doc.current_version || 1);
      setTotalVersions(doc.total_versions || 1);
      if (doc.jsx_code) {
        setCode(doc.jsx_code);
      }
      if (doc.metadata) {
        setSourceMetadata({
          filename: doc.metadata.filename || doc.original_filename,
          uploadedAt: doc.created_at,
        });
      }
    } catch (err) {
      console.error("Failed to refresh document after restore:", err);
    }
  };

  const setValue = useCallback((id: string, v: string) => {
    setValues((prev) => ({ ...prev, [id]: v }));
  }, []);

  // Add data attributes to preview elements for the edit icons
  useEffect(() => {
    if (mode !== "preview" && mode !== "split") return;
    
    const container = previewContainerRef.current;
    if (!container) return;
    
    const handleDoubleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      
      // Don't trigger if clicking on add button
      if (target.closest('.section-add-btn')) return;
      
      const elementInfo = getElementInfo(target);
      
      // Double click for sections only (not tables)
      if (elementInfo.type === 'section' && elementInfo.sectionIndex !== undefined) {
        setPanelContext({ type: 'section', index: elementInfo.sectionIndex });
      }
    };
    
    container.addEventListener('dblclick', handleDoubleClick);
    
    return () => {
      container.removeEventListener('dblclick', handleDoubleClick);
    };
  }, [mode, code]);
  useEffect(() => {
    if (mode !== "preview" && mode !== "split") return;
    
    const container = previewContainerRef.current;
    if (!container) return;
    
    // Wait for content to render
    const timeout = setTimeout(() => {
      // Parse code to get structure
      import('../../utils/jsxParser').then(({ parseJSXCode }) => {
        const parsed = parseJSXCode(code);
        
        // Clean up existing buttons and remove old event listeners
        const existingButtons = container.querySelectorAll('.section-add-btn, .table-edit-btn');
        existingButtons.forEach(btn => btn.remove());
        
        // Remove old setup flags and clone elements to remove event listeners
        const existingSections = container.querySelectorAll('[data-section-setup]');
        existingSections.forEach(section => {
          (section as HTMLElement).removeAttribute('data-section-setup');
        });
        const existingTables = container.querySelectorAll('[data-table-setup]');
        existingTables.forEach(table => {
          (table as HTMLElement).removeAttribute('data-table-setup');
        });
        
        // Find all sections (section elements or divs that look like sections)
        const sections = container.querySelectorAll('section, [class*="section"]');
        let sectionIndex = 0;
        sections.forEach((section) => {
          // Only mark as section if it's likely a SectionTemplate (has title or content structure)
          const hasTitle = section.querySelector('h1, h2, h3, h4, h5, h6');
          const hasContent = section.textContent && section.textContent.trim().length > 0;
          
          if (hasTitle || hasContent) {
            if (sectionIndex < parsed.sections.length) {
              const sectionEl = section as HTMLElement;
              
              sectionEl.setAttribute('data-section-index', sectionIndex.toString());
              sectionEl.setAttribute('data-section-setup', 'true');
              sectionEl.style.cursor = 'pointer';
              sectionEl.style.position = 'relative';
              sectionEl.style.transition = 'all 0.3s ease';
              sectionEl.style.opacity = '1';
              sectionEl.style.transform = 'translateY(0)';
              sectionEl.style.marginBottom = '24px'; // Space for add button
              sectionEl.title = 'Double-click to edit section';
              
              let addButton: HTMLButtonElement | null = null;
              
              // Add hover effect and "+" button
              sectionEl.addEventListener('mouseenter', function() {
                this.style.outline = '2px dashed #A4C639';
                this.style.outlineOffset = '2px';
                this.style.transform = 'translateY(-2px)';
                
                // Create and show add button
                if (!addButton) {
                  addButton = document.createElement('button');
                  addButton.className = 'section-add-btn';
                  addButton.style.cssText = 'position: absolute; left: 50%; bottom: -16px; transform: translate(-50%, 0) scale(0.8); width: 32px; height: 32px; background: #A4C639; color: white; border-radius: 50%; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; z-index: 10; opacity: 0; transition: all 0.3s ease; cursor: pointer; border: none;';
                  addButton.innerHTML = '<svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>';
                  addButton.title = 'Add new section';
                  
                  addButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const sectionIdx = parseInt(sectionEl.getAttribute('data-section-index') || '0', 10);
                    // Use current code from ref (always latest)
                    const currentCode = codeRef.current;
                    const newCode = addSection(currentCode, {
                      title: "New Section",
                      content: "Section content here",
                      type: "section",
                    }, sectionIdx + 1);
                    setCode(newCode);
                  });
                  
                  addButton.addEventListener('mouseenter', function() {
                    this.style.background = '#8FB02E';
                    this.style.transform = 'translate(-50%, 0) scale(1.1)';
                  });
                  
                  addButton.addEventListener('mouseleave', function() {
                    this.style.background = '#A4C639';
                    this.style.transform = 'translate(-50%, 0) scale(1)';
                  });
                  
                  sectionEl.appendChild(addButton);
                }
                addButton.style.opacity = '1';
                addButton.style.transform = 'translate(-50%, 0) scale(1)';
              });
              
              sectionEl.addEventListener('mouseleave', function(e) {
                // Don't hide if mouse is moving to the add button
                const relatedTarget = e.relatedTarget as HTMLElement;
                if (relatedTarget && (relatedTarget === addButton || relatedTarget.closest('.section-add-btn'))) {
                  return;
                }
                
                this.style.outline = '';
                this.style.outlineOffset = '';
                this.style.transform = 'translateY(0)';
                
                // Hide add button
                if (addButton) {
                  addButton.style.opacity = '0';
                  addButton.style.transform = 'translate(-50%, 0) scale(0.8)';
                }
              });
              
              // Keep button visible when hovering over it
              if (addButton) {
                addButton.addEventListener('mouseenter', function() {
                  this.style.opacity = '1';
                  this.style.transform = 'translate(-50%, 0) scale(1.1)';
                });
              }
              
              
              sectionIndex++;
            }
          }
        });
        
        // Find all tables (only actual table elements)
        const tables = container.querySelectorAll('table');
        console.log('Found', tables.length, 'table elements in DOM, parsed', parsed.tables.length, 'tables from code');
        let tableIndex = 0;
        tables.forEach((table, domIndex) => {
          // Only process actual table elements
          if (table.tagName === 'TABLE' && tableIndex < parsed.tables.length) {
            const tableElement = table.closest('div') || table;
            const tableEl = tableElement as HTMLElement;
            
            // Skip tables inside AirplaneSection component
            const isInsideAirplaneSection = table.closest('[data-airplane-section-id]') !== null;
            if (isInsideAirplaneSection) {
              console.log(`Skipping table ${tableIndex} - inside AirplaneSection`);
              tableIndex++;
              return;
            }
            
            console.log(`Setting up table ${tableIndex} (DOM index ${domIndex})`);
            tableEl.setAttribute('data-table-index', tableIndex.toString());
            tableEl.setAttribute('data-table-setup', 'true');
            tableEl.style.cursor = 'pointer';
            tableEl.style.transition = 'all 0.3s ease';
            tableEl.style.opacity = '1';
            tableEl.style.position = 'relative';
            tableEl.title = 'Click the gear icon to manage table';
            let editButton: HTMLButtonElement | null = null;
            
            // Add hover effect and edit button
            tableEl.addEventListener('mouseenter', function() {
              this.style.outline = '2px dashed #A4C639';
              this.style.outlineOffset = '2px';
              this.style.transform = 'translateY(-2px)';
              
              // Create and show edit button
              if (!editButton) {
                editButton = document.createElement('button');
                editButton.className = 'table-edit-btn';
                editButton.style.cssText = 'position: absolute; right: 8px; top: 8px; width: 36px; height: 36px; background: #A4C639; color: white; border-radius: 50%; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; z-index: 20; opacity: 0; transition: all 0.3s ease; cursor: pointer; border: 2px solid white;';
                editButton.innerHTML = '<svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>';
                editButton.title = 'Edit table structure';
                
                editButton.addEventListener('click', (e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  const tblIdx = parseInt(tableEl.getAttribute('data-table-index') || '0', 10);
                  console.log('Clicked table index:', tblIdx, 'Total tables:', parsed.tables.length);
                  setPanelContext({ type: 'table', index: tblIdx });
                });
                
                editButton.addEventListener('mouseenter', function() {
                  this.style.background = '#8FB02E';
                  this.style.transform = 'scale(1.1)';
                });
                
                editButton.addEventListener('mouseleave', function() {
                  this.style.background = '#A4C639';
                  this.style.transform = 'scale(1)';
                });
                
                tableEl.appendChild(editButton);
              }
              editButton.style.opacity = '1';
            });
            
            tableEl.addEventListener('mouseleave', function(e) {
              // Don't hide if mouse is moving to the edit button
              const relatedTarget = e.relatedTarget as HTMLElement;
              if (relatedTarget && (relatedTarget === editButton || relatedTarget.closest('.table-edit-btn'))) {
                return;
              }
              
              this.style.outline = '';
              this.style.outlineOffset = '';
              this.style.transform = 'translateY(0)';
              
              // Hide edit button
              if (editButton) {
                editButton.style.opacity = '0';
              }
            });
            
            // Keep button visible when hovering over it
            if (editButton) {
              editButton.addEventListener('mouseenter', function() {
                this.style.opacity = '1';
              });
            }
            
            tableIndex++;
          }
        });
      });
    }, 300); // Increased timeout to ensure content is rendered
    
    return () => {
      clearTimeout(timeout);
      // Clean up add buttons and edit buttons on unmount
      const container = previewContainerRef.current;
      if (container) {
        const existingButtons = container.querySelectorAll('.section-add-btn, .table-edit-btn');
        existingButtons.forEach(btn => btn.remove());
      }
    };
  }, [mode, code, values]);
  
  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
  }, []);

  const handleCreateTable = useCallback((config: {
    title: string;
    columns: string[];
    rowCount: number;
  }) => {
    const newCode = addNewTable(codeRef.current, config);
    setCode(newCode);
    setShowTableCreatedToast(true);
    setTimeout(() => setShowTableCreatedToast(false), 3000);
  }, []);

  const handleExportCode = useCallback(() => {
    // Replace all default values in the code with current values
    let updatedCode = code;
    
    Object.entries(values).forEach(([key, value]) => {
      // Escape special regex characters in the key
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Find and replace the default value with the new value
      const regex = new RegExp(
        `value={values\\['${escapedKey}'\\]\\s*\\|\\|\\s*['"]([^'"]*?)['"]`,
        'g'
      );
      updatedCode = updatedCode.replace(regex, `value={values['${key}'] || '${value.replace(/'/g, "\\'")}'`);
    });

    // Create blob and download
    const blob = new Blob([updatedCode], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template-${new Date().toISOString().split('T')[0]}.jsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [code, values]);

  const handleExportPDF = useCallback(async () => {
    // Use html2pdf.js for programmatic download (NO browser print dialog)
    const previewElement = document.querySelector('.preview-content') as HTMLElement;
    
    if (!previewElement) {
      alert('Preview content not found');
      return;
    }

    try {
      // Import the export function
      const { exportToPDF } = await import('@/app/utils/pdfExport');
      
      await exportToPDF(previewElement, 'document', {
        format: 'a4',
        orientation: 'portrait',
        margin: 10,
        image: {
          type: 'png',
          quality: 0.98,
        },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        },
      });
    } catch (error) {
      console.error('PDF export error:', error);
      alert(error instanceof Error ? error.message : 'Failed to export PDF');
    }
  }, []);

  const handleAddAirplaneClick = useCallback(() => {
    setShowAddAirplaneModal(true);
    setShowMenuDropdown(false);
  }, []);

  const handleAddAirplaneSubmit = useCallback((data: {
    title?: string;
    showTitle?: boolean;
    noticeMessage?: string;
    showNotice?: boolean;
    flights: FlightData[];
    direction?: "rtl" | "ltr";
    language?: "ar" | "en";
  }) => {
    // Generate unique ID for user element
    const elementId = `user_airplane_${Date.now()}`;
    
    let updatedCode = code;
    
    // Check if import already exists, if not add it
    if (!updatedCode.includes("import AirplaneSection")) {
      // Find the last import statement or function declaration
      const importMatch = updatedCode.match(/^(\s*import[^;]+;[\s\S]*?)(const|export|function)/m);
      if (importMatch) {
        updatedCode = updatedCode.replace(importMatch[1], 
          importMatch[1] + `\nimport AirplaneSection from '@/app/Templates/airplaneSection';\n`);
      } else {
        // Add at the beginning if no imports found
        updatedCode = `import AirplaneSection from '@/app/Templates/airplaneSection';\n` + updatedCode;
      }
    }
    
    // Format flights data for JSX
    const flightsString = data.flights.map(flight => `{
            date: "${flight.date}",
            fromAirport: "${flight.fromAirport.replace(/"/g, '\\"')}",
            toAirport: "${flight.toAirport.replace(/"/g, '\\"')}",
            travelers: { adults: ${flight.travelers.adults}, children: ${flight.travelers.children}, infants: ${flight.travelers.infants} },
            luggage: "${flight.luggage.replace(/"/g, '\\"')}"
          }`).join(',\n          ');
    
    // Create the component JSX
    const airplaneComponent = `        <AirplaneSection
          id="${elementId}"
          editable={true}
          flights={[\n          ${flightsString}\n          ]}
          ${data.title ? `title="${data.title.replace(/"/g, '\\"')}"` : ''}
          showTitle={${data.showTitle !== false}}
          ${data.noticeMessage ? `noticeMessage="${data.noticeMessage.replace(/"/g, '\\"')}"` : ''}
          showNotice={${data.showNotice !== false}}
          direction="${data.direction || 'rtl'}"
          language="${data.language || 'ar'}"
        />`;
    
    // Try to find header image to insert after it
    // Pattern 1: Look for img tag with header in src/alt (most common pattern)
    let insertionPoint = -1;
    let indent = '        ';
    
    // Pattern 1: After header image tag (happylifeHeader, headerImage, etc.)
    const headerImagePatterns = [
      /(<img[^>]*(?:src=["'][^"']*(?:header|Header|happylifeHeader)[^"']*["']|alt=["'][^"']*(?:header|Header)[^"']*["'])[^>]*\/?>)/i,
      /(<img[^>]*\/?>)/  // Any img tag as fallback
    ];
    
    for (const pattern of headerImagePatterns) {
      const headerImageMatch = updatedCode.match(pattern);
      if (headerImageMatch && headerImageMatch.index !== undefined) {
        insertionPoint = headerImageMatch.index + headerImageMatch[0].length;
        // Get the indentation from the line after the image
        const afterImage = updatedCode.substring(insertionPoint);
        const nextLineMatch = afterImage.match(/^\s*\n(\s*)/);
        if (nextLineMatch && nextLineMatch[1]) {
          indent = nextLineMatch[1];
        }
        break;
      }
    }
    
    // Pattern 2: If no image found, look for header div or comment
    if (insertionPoint === -1) {
      const headerCommentPattern = /(\{\/\*.*Header.*\*\/[\s\S]*?<\/div>[\s\S]*?\n)/i;
      const headerCommentMatch = updatedCode.match(headerCommentPattern);
      if (headerCommentMatch && headerCommentMatch.index !== undefined) {
        insertionPoint = headerCommentMatch.index + headerCommentMatch[0].length;
        indent = '        ';
      }
    }
    
    // Pattern 3: Look for BaseTemplate children area (after opening tag)
    if (insertionPoint === -1) {
      const baseTemplatePattern = /<BaseTemplate[^>]*>\s*\n(\s*)/;
      const baseTemplateMatch = updatedCode.match(baseTemplatePattern);
      if (baseTemplateMatch && baseTemplateMatch.index !== undefined) {
        insertionPoint = baseTemplateMatch.index + baseTemplateMatch[0].length;
        indent = baseTemplateMatch[1] || '        ';
      }
    }
    
    // Pattern 4: Find first main content div after return statement
    if (insertionPoint === -1) {
      const returnMatch = updatedCode.match(/return\s*\(/);
      if (returnMatch && returnMatch.index !== undefined) {
        const afterReturn = updatedCode.substring(returnMatch.index + returnMatch[0].length);
        // Find first div with content/main/px classes (typical content area)
        const contentDivMatch = afterReturn.match(/(\s*<div[^>]*className=["'][^"']*(?:content|main|px-|py-|w-\[794px\])[^"']*["'][^>]*>)/);
        if (contentDivMatch && contentDivMatch.index !== undefined) {
          insertionPoint = returnMatch.index + returnMatch[0].length + contentDivMatch.index + contentDivMatch[0].length;
          indent = '        ';
        }
      }
    }
    
    if (insertionPoint !== -1) {
      // Insert after header image/div
      const before = updatedCode.substring(0, insertionPoint);
      const after = updatedCode.substring(insertionPoint);
      // Add proper newline and indent, then insert component
      updatedCode = before + '\n' + indent + airplaneComponent + after;
    } else {
      // Fallback: Insert after the return statement's first div
      const returnMatch = updatedCode.match(/(return\s*\([\s\S]*?<div[^>]*>[\s\S]*?<\/div>[\s\S]*?\n)/);
      if (returnMatch && returnMatch.index !== undefined) {
        insertionPoint = returnMatch.index + returnMatch[0].length;
        updatedCode = updatedCode.substring(0, insertionPoint) + 
          indent + airplaneComponent + '\n' + 
          updatedCode.substring(insertionPoint);
      } else {
        // Last resort: append before the last closing div
        const lastDivIndex = updatedCode.lastIndexOf('</div>');
        if (lastDivIndex !== -1) {
          updatedCode = updatedCode.slice(0, lastDivIndex) + 
            `\n        ${airplaneComponent}\n      ` + 
            updatedCode.slice(lastDivIndex);
        }
      }
    }
    
    setCode(updatedCode);
    setShowAddAirplaneModal(false);
  }, [code]);

  const handleAddHotelClick = useCallback(() => {
    setShowAddHotelModal(true);
    setShowMenuDropdown(false);
  }, []);

  const handleAddHotelSubmit = useCallback((data: {
    title?: string;
    showTitle?: boolean;
    hotels: Hotel[];
    direction?: "rtl" | "ltr";
    language?: "ar" | "en";
    labels?: {
      nights: string;
      includes: string;
      checkIn: string;
      checkOut: string;
      details: string;
      count: string;
    };
  }) => {
    // Generate unique ID for user element
    const elementId = `user_hotel_${Date.now()}`;
    
    let updatedCode = code;
    
    // Check if import already exists, if not add it
    if (!updatedCode.includes("import HotelsSection")) {
      // Find the last import statement or function declaration
      const importMatch = updatedCode.match(/^(\s*import[^;]+;[\s\S]*?)(const|export|function)/m);
      if (importMatch) {
        updatedCode = updatedCode.replace(importMatch[1], 
          importMatch[1] + `\nimport HotelsSection from '@/app/Templates/HotelsSection';\n`);
      } else {
        // Add at the beginning if no imports found
        updatedCode = `import HotelsSection from '@/app/Templates/HotelsSection';\n` + updatedCode;
      }
    }
    
    // Format hotels data for JSX (matching airplane section pattern)
    const hotelsString = data.hotels.map(hotel => {
      const parts: string[] = [];
      parts.push(`city: "${hotel.city.replace(/"/g, '\\"')}"`);
      parts.push(`nights: ${hotel.nights}`);
      if (hotel.cityBadge) {
        parts.push(`cityBadge: "${hotel.cityBadge.replace(/"/g, '\\"')}"`);
      }
      parts.push(`hotelName: "${hotel.hotelName.replace(/"/g, '\\"')}"`);
      if (hotel.hasDetailsLink !== undefined) {
        parts.push(`hasDetailsLink: ${hotel.hasDetailsLink}`);
      }
      if (hotel.detailsLink) {
        parts.push(`detailsLink: "${hotel.detailsLink.replace(/"/g, '\\"')}"`);
      }
      const roomTypePart = hotel.roomDescription.roomType 
        ? `,\n              roomType: "${hotel.roomDescription.roomType.replace(/"/g, '\\"')}"`
        : '';
      parts.push(`roomDescription: {
              includesAll: "${hotel.roomDescription.includesAll.replace(/"/g, '\\"')}",
              bedType: "${hotel.roomDescription.bedType.replace(/"/g, '\\"')}"${roomTypePart}
            }`);
      parts.push(`checkInDate: "${hotel.checkInDate}"`);
      parts.push(`checkOutDate: "${hotel.checkOutDate}"`);
      parts.push(`dayInfo: {
              checkInDay: "${hotel.dayInfo.checkInDay.replace(/"/g, '\\"')}",
              checkOutDay: "${hotel.dayInfo.checkOutDay.replace(/"/g, '\\"')}"
            }`);
      
      return `{\n            ${parts.join(',\n            ')}\n          }`;
    }).join(',\n          ');
    
    // Format labels for JSX - only include if provided (component has defaults based on language)
    // Since HotelsSection has default labels, we can omit this prop to use defaults
    // NOTE: We avoid using labels={{}} syntax because PreviewRenderer's fixDoubleBraces
    // incorrectly transforms it. Since component has defaults, we simply don't include it.
    const labelsProp = ''; // Always use component defaults to avoid fixDoubleBraces issue
    
    // Create the component JSX (matching airplane section pattern)
    const titleProp = data.title ? `\n          title="${data.title.replace(/"/g, '\\"')}"` : '';
    const hotelComponent = `        <HotelsSection
          id="${elementId}"
          editable={true}
          hotels={[\n          ${hotelsString}\n          ]}${titleProp}
          showTitle={${data.showTitle !== false}}${labelsProp}
          direction="${data.direction || 'rtl'}"
          language="${data.language || 'ar'}"
        />`;
    
    // Try to find header image to insert after it (same pattern as airplane)
    let insertionPoint = -1;
    let indent = '        ';
    
    // Pattern 1: After header image tag
    const headerImagePatterns = [
      /(<img[^>]*(?:src=["'][^"']*(?:header|Header|happylifeHeader)[^"']*["']|alt=["'][^"']*(?:header|Header)[^"']*["'])[^>]*\/?>)/i,
      /(<img[^>]*\/?>)/  // Any img tag as fallback
    ];
    
    for (const pattern of headerImagePatterns) {
      const headerImageMatch = updatedCode.match(pattern);
      if (headerImageMatch && headerImageMatch.index !== undefined) {
        insertionPoint = headerImageMatch.index + headerImageMatch[0].length;
        const afterImage = updatedCode.substring(insertionPoint);
        const nextLineMatch = afterImage.match(/^\s*\n(\s*)/);
        if (nextLineMatch && nextLineMatch[1]) {
          indent = nextLineMatch[1];
        }
        break;
      }
    }
    
    // Pattern 2: If no image found, look for header div or comment
    if (insertionPoint === -1) {
      const headerCommentPattern = /(\{\/\*.*Header.*\*\/[\s\S]*?<\/div>[\s\S]*?\n)/i;
      const headerCommentMatch = updatedCode.match(headerCommentPattern);
      if (headerCommentMatch && headerCommentMatch.index !== undefined) {
        insertionPoint = headerCommentMatch.index + headerCommentMatch[0].length;
        indent = '        ';
      }
    }
    
    // Pattern 3: Look for BaseTemplate children area
    if (insertionPoint === -1) {
      const baseTemplatePattern = /<BaseTemplate[^>]*>\s*\n(\s*)/;
      const baseTemplateMatch = updatedCode.match(baseTemplatePattern);
      if (baseTemplateMatch && baseTemplateMatch.index !== undefined) {
        insertionPoint = baseTemplateMatch.index + baseTemplateMatch[0].length;
        indent = baseTemplateMatch[1] || '        ';
      }
    }
    
    // Pattern 4: Look for return statement
    if (insertionPoint === -1) {
      const returnPattern = /return\s*\(\s*\n(\s*)/;
      const returnMatch = updatedCode.match(returnPattern);
      if (returnMatch && returnMatch.index !== undefined) {
        insertionPoint = returnMatch.index + returnMatch[0].length;
        indent = returnMatch[1] || '        ';
      }
    }
    
    // Insert the component
    if (insertionPoint !== -1) {
      const before = updatedCode.substring(0, insertionPoint);
      const after = updatedCode.substring(insertionPoint);
      updatedCode = before + '\n' + indent + hotelComponent + '\n' + after;
    } else {
      // Fallback: append at the end before closing tag
      const lastBrace = updatedCode.lastIndexOf('}');
      if (lastBrace !== -1) {
        updatedCode = updatedCode.substring(0, lastBrace) + '\n        ' + hotelComponent + '\n' + updatedCode.substring(lastBrace);
      } else {
        updatedCode = updatedCode + '\n        ' + hotelComponent;
      }
    }
    
    setCode(updatedCode);
    setShowAddHotelModal(false);
  }, [code]);

  const handleSave = useCallback(async () => {
    if (!isAuthenticated()) {
      alert("Please login to save documents");
      return;
    }

    setIsSaving(true);
    setSaveStatus("idle");

    try {
      // Extract table data from the rendered DOM to capture user edits
      let updatedCode = code;
      let updatedExtractedData = null;
      
      try {
        // Extract tables from the preview container
        const extractedTables = extractAllTablesFromDOM(previewContainerRef.current);
        
        // CRITICAL: Validate that only DynamicTable components were extracted
        // Count DynamicTable components in the code to ensure alignment
        let expectedTableCount = 0;
        try {
          const { parseJSXCode } = require('../../utils/jsxParser');
          const parsed = parseJSXCode(code);
          expectedTableCount = parsed.tables.length;
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`[SAVE VALIDATION] Expected ${expectedTableCount} DynamicTable(s) in code, extracted ${extractedTables.length} table(s)`);
          }
          
          // Validation: Ensure extracted tables count matches DynamicTable components
          if (extractedTables.length > expectedTableCount) {
            const warningMsg = `[SAVE VALIDATION WARNING] Extracted ${extractedTables.length} tables but only ${expectedTableCount} DynamicTable components found in code. Some tables may be from AirplaneSection components.`;
            console.warn(warningMsg);
            if (process.env.NODE_ENV === 'development') {
              alert(`Warning: ${extractedTables.length - expectedTableCount} extra table(s) detected. This may indicate airplane section tables were incorrectly extracted.`);
            }
            // Trim to expected count to prevent overwriting
            extractedTables.splice(expectedTableCount);
          } else if (extractedTables.length < expectedTableCount && extractedTables.length > 0) {
            const warningMsg = `[SAVE VALIDATION WARNING] Only extracted ${extractedTables.length} tables but ${expectedTableCount} DynamicTable components found in code. Some tables may have been skipped.`;
            console.warn(warningMsg);
          }
        } catch (parseError) {
          console.warn('[SAVE VALIDATION] Could not parse JSX code to validate table count:', parseError);
        }
        
        if (extractedTables.length > 0) {
          // Additional validation: Ensure no airplane section tables were extracted
          // This is a safety check - the extraction function should already filter these
          const hasAirplaneSectionTables = extractedTables.some((table, index) => {
            // Check if any extracted table has airplane section characteristics
            // (This is a secondary check - the main filtering happens in extractAllTablesFromDOM)
            if (process.env.NODE_ENV === 'development') {
              const tableEl = previewContainerRef.current?.querySelectorAll('table')[index];
              if (tableEl && tableEl.closest('[data-airplane-section-id]')) {
                console.error(`[SAVE VALIDATION ERROR] Table ${index} appears to be inside AirplaneSection - this should have been filtered!`);
                return true;
              }
            }
            return false;
          });
          
          if (hasAirplaneSectionTables) {
            console.error('[SAVE VALIDATION ERROR] Airplane section tables detected in extracted tables! This should not happen.');
            throw new Error('Airplane section tables were incorrectly extracted. Save aborted to prevent data corruption.');
          }
          
          // Update JSX code with extracted table data using updateTableCell function
          updatedCode = updateCodeWithTableData(code, extractedTables, updateTableCell, updateTableColumnHeader);
          
          // Also update extracted_data structure if it exists
          const extractedDataStr = sessionStorage.getItem("codePreview.extractedData");
          if (extractedDataStr) {
            try {
              updatedExtractedData = JSON.parse(extractedDataStr);
              
              // Update tables in extracted_data
              if (updatedExtractedData.tables && Array.isArray(updatedExtractedData.tables)) {
                extractedTables.forEach((extractedTable, index) => {
                  if (index < updatedExtractedData.tables.length) {
                    // Update headers and rows
                    updatedExtractedData.tables[index].columns = extractedTable.headers;
                    updatedExtractedData.tables[index].rows = extractedTable.rows;
                    if (extractedTable.title) {
                      updatedExtractedData.tables[index].title = extractedTable.title;
                    }
                  }
                });
              }
            } catch (parseError) {
              console.error("Error parsing extracted data:", parseError);
            }
          }
          
          // Update code state if it changed
          if (updatedCode !== code) {
            setCode(updatedCode);
          }
        }
      } catch (extractError) {
        console.error("Error extracting table data:", extractError);
        // Continue with save even if extraction fails
      }
      
      const extractedData = sessionStorage.getItem("codePreview.extractedData");
      const filePath = sessionStorage.getItem("codePreview.filePath");
      const originalFilename = sessionStorage.getItem("codePreview.originalFilename");

      if (documentId) {
        // Prompt for version name if creating a new version
        const versionName = prompt("Enter a name for this version (optional):");
        
        // Update existing document
        const updateResponse = await updateDocument(documentId, {
          jsx_code: updatedCode,
          extracted_data: updatedExtractedData || (extractedData ? JSON.parse(extractedData) : {}),
          metadata: {
            ...sourceMetadata,
            lastSaved: new Date().toISOString(),
            ...(versionName && versionName.trim() ? { version_name: versionName.trim() } : {}),
          },
        });
        // Update version info after save
        if (updateResponse.document) {
          setCurrentVersion(updateResponse.document.current_version || 1);
          setTotalVersions(updateResponse.document.total_versions || 1);
        }
      } else {
        // Create new document
        const title = sourceMetadata?.filename?.replace(/\.pdf$/i, "") || "Untitled Document";
        const response = await saveDocument({
          title,
          original_filename: originalFilename || "document.pdf",
          file_path: filePath || "",
          extracted_data: updatedExtractedData || (extractedData ? JSON.parse(extractedData) : {}),
          jsx_code: updatedCode,
          metadata: {
            ...sourceMetadata,
            savedAt: new Date().toISOString(),
          },
        });
        
        if (response.document?.id) {
          setDocumentId(response.document.id);
          setCurrentVersion(response.document.current_version || 1);
          setTotalVersions(response.document.total_versions || 1);
        }
      }

      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      console.error("Save failed:", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setIsSaving(false);
    }
  }, [code, documentId, sourceMetadata]);

  const header = useMemo(() => (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
            <Image
              src="/logoHappylife.jpg"
              alt="HappyLife Travel & Tourism"
              width={140}
              height={47}
              className="object-contain"
              priority
            />
          </Link>
          
          <div className="flex items-center gap-2">
            <div className="text-center px-4">
              <h1 className="text-lg font-bold text-gray-900">Template Editor</h1>
              <p className="text-xs text-gray-600">Design & Export Professional Documents</p>
              {sourceMetadata?.filename && (
                <p className="text-xs text-gray-500 mt-1">
                  <span className="font-medium">{sourceMetadata.filename}</span>
                  {sourceMetadata.uploadedAt && (
                    <span className="text-gray-400">
                      {" • "}
                      {new Date(sourceMetadata.uploadedAt).toLocaleString()}
                    </span>
                  )}
                  {totalVersions > 1 && (
                    <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded font-semibold text-xs">
                      v{currentVersion}/{totalVersions}
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowMenuDropdown(!showMenuDropdown)}
                className="px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-lg font-medium hover:from-gray-800 hover:to-gray-900 transition-all shadow-md hover:shadow-lg flex items-center gap-2 text-sm"
                title="Menu"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                Menu
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showMenuDropdown && (
                <>
                  {/* Backdrop to close dropdown */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowMenuDropdown(false)}
                  />
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    {/* Add Airplane */}
                    <button
                      onClick={handleAddAirplaneClick}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                      </svg>
                      <span>Add Airplane</span>
                    </button>
                    
                    {/* Add Hotel */}
                    <button
                      onClick={handleAddHotelClick}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.006 3.705a.75.75 0 00-.512-1.41L6 6.838V3a.75.75 0 00-.75-.75h-1.5A.75.75 0 003 3v4.93l-1.006.365a.75.75 0 00.512 1.41l16.5-6z" />
                        <path fillRule="evenodd" d="M3.019 11.115L18 5.667V9.09l4.006 1.456a.75.75 0 11-.512 1.41l-.494-.18v8.475h.75a.75.75 0 010 1.5H2.25a.75.75 0 010-1.5H3v-9.129l.019-.007zM18 20.25v-9.565l1.5.545v9.02H18zm-9-6a.75.75 0 00-.75.75v4.5c0 .414.336.75.75.75h3a.75.75 0 00.75-.75V15a.75.75 0 00-.75-.75H9z" clipRule="evenodd" />
                      </svg>
                      <span>Add Hotel</span>
                    </button>
                    
                    <div className="border-t border-gray-200 my-1"></div>
                    
                    {/* Export Code */}
                    <button
                      onClick={() => {
                        handleExportCode();
                        setShowMenuDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
                    >
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      <span>Export Code</span>
                    </button>
                    
                    {/* Export PDF */}
                    <button
                      onClick={() => {
                        handleExportPDF();
                        setShowMenuDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
                    >
                      <svg className="w-4 h-4 text-[#A4C639]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Export PDF</span>
                    </button>
                    
                    {/* Versions - only show if authenticated and has versions */}
                    {isAuthenticated() && documentId && totalVersions > 1 && (
                      <>
                        <div className="border-t border-gray-200 my-1"></div>
                        <button
                          onClick={() => {
                            setShowVersionHistory(true);
                            setShowMenuDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
                        >
                          <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Versions</span>
                          <span className="ml-auto px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-semibold">
                            v{currentVersion}/{totalVersions}
                          </span>
                        </button>
                      </>
                    )}
                    
                    {/* Save - only show if authenticated */}
                    {isAuthenticated() && (
                      <>
                        <div className="border-t border-gray-200 my-1"></div>
                        <button
                          onClick={() => {
                            handleSave();
                            setShowMenuDropdown(false);
                          }}
                          disabled={isSaving}
                          className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 transition-colors ${
                            saveStatus === "success"
                              ? "text-green-700 bg-green-50 hover:bg-green-100"
                              : saveStatus === "error"
                              ? "text-red-700 bg-red-50 hover:bg-red-100"
                              : "text-purple-700 hover:bg-gray-100"
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {isSaving ? (
                            <>
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Saving...</span>
                            </>
                          ) : saveStatus === "success" ? (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Saved!</span>
                            </>
                          ) : saveStatus === "error" ? (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              <span>Failed</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                              </svg>
                              <span>Save</span>
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
            
            <ToggleSwitch mode={mode} onChange={(next: Mode) => setMode(next)} />
          </div>
        </div>
      </div>
    </div>
  ), [mode, handleExportCode, handleExportPDF, handleSave, handleAddAirplaneClick, handleAddAirplaneSubmit, handleAddHotelClick, handleAddHotelSubmit, sourceMetadata, isSaving, saveStatus, documentId, totalVersions, currentVersion, showMenuDropdown]);

  return (
    <div className="min-h-screen bg-linear-to-br from-cyan-50 via-blue-50 to-lime-50 text-gray-900">
      {header}
      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        {externalWarnings.length > 0 && (
          <div className="mb-6 rounded border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            <h2 className="text-sm font-semibold text-yellow-900">
              Backend Validation Warnings
            </h2>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {externalWarnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
        {processedTables.length > 0 && (
          <div className="mb-6 rounded border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">
            <h2 className="text-sm font-semibold text-green-900 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Processed Tables ({processedTables.length})
            </h2>
            <p className="mt-2 text-green-700">
              {processedTables.length} table(s) were automatically extracted, repaired, and converted to JSX during processing.
            </p>
            <details className="mt-3">
              <summary className="cursor-pointer text-green-800 font-medium hover:text-green-900">
                View processed table details
              </summary>
              <div className="mt-2 space-y-2">
                {processedTables.map((table, index) => (
                  <div key={index} className="bg-white rounded p-3 border border-green-200">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-green-900">{table.tableId}</span>
                      <span className="text-xs text-green-600">
                        {table.jsx.length} chars JSX
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
        {mode === "code" ? (
          <div className="rounded-xl border border-gray-200 shadow-lg overflow-hidden bg-white">
            <div className="bg-linear-to-r from-gray-800 to-gray-900 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="ml-4 text-sm text-gray-300 font-mono">template.jsx</span>
              </div>
              <span className="text-xs text-gray-400">React Template</span>
            </div>
            <CodeEditor code={code} onChange={setCode} />
          </div>
        ) : (
          <div className="min-h-[70vh] bg-white rounded-xl shadow-lg p-8 max-w-full overflow-hidden relative">
            {/* Create New Table Button */}
            <button
              onClick={() => setIsCreateTableModalOpen(true)}
              className="absolute top-4 right-4 z-10 px-4 py-2 bg-gradient-to-r from-[#A4C639] to-[#8FB02E] text-white rounded-lg font-medium hover:from-[#8FB02E] hover:to-[#7A9124] transition-all shadow-md hover:shadow-lg flex items-center gap-2 text-sm"
              title="Create a new table"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Table
            </button>

            {/* Success Toast */}
            {showTableCreatedToast && (
              <div className="fixed top-24 right-6 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Table created successfully!
              </div>
            )}

            <div 
              ref={previewContainerRef}
              className="preview-content max-w-full"
            >
              <PreviewRenderer code={code} values={values} setValue={setValue} />
            </div>
          </div>
        )}
      </div>
      
      {/* Customization Panel */}
      {panelContext && (
        <CustomizationPanel
          code={code}
          onCodeChange={handleCodeChange}
          context={panelContext}
          onClose={() => setPanelContext(null)}
        />
      )}

      {/* Create Table Modal */}
      <CreateTableModal
        isOpen={isCreateTableModalOpen}
        onClose={() => setIsCreateTableModalOpen(false)}
        onCreateTable={handleCreateTable}
      />

      {/* Version History Modal */}
      {documentId && (
        <VersionHistoryModal
          isOpen={showVersionHistory}
          docId={documentId}
          currentVersion={currentVersion}
          totalVersions={totalVersions}
          onClose={() => setShowVersionHistory(false)}
          onRestore={handleRestore}
        />
      )}

      {/* Add Airplane Modal */}
      <AddAirplaneModal
        isOpen={showAddAirplaneModal}
        onClose={() => setShowAddAirplaneModal(false)}
        onSubmit={handleAddAirplaneSubmit}
      />
      
      {/* Edit Flight Modal */}
      <EditFlightModal
        isOpen={showEditFlightModal}
        onClose={() => {
          setShowEditFlightModal(false);
          setEditingAirplaneId(null);
          setEditingFlightIndex(null);
        }}
        onSubmit={handleEditFlightSubmit}
        initialFlight={getInitialFlightData()}
      />
      
      {/* Edit Airplane Section Modal */}
      <EditAirplaneSectionModal
        isOpen={showEditSectionModal}
        onClose={() => {
          setShowEditSectionModal(false);
          setEditingAirplaneId(null);
        }}
        onSubmit={handleEditSectionSubmit}
        initialData={getInitialSectionData()}
      />

      {/* Add Hotel Modal */}
      <AddHotelModal
        isOpen={showAddHotelModal}
        onClose={() => setShowAddHotelModal(false)}
        onSubmit={handleAddHotelSubmit}
      />
      
      {/* Edit Hotel Modal */}
      <EditHotelModal
        isOpen={showEditHotelModal}
        onClose={() => {
          setShowEditHotelModal(false);
          setEditingHotelId(null);
          setEditingHotelIndex(null);
        }}
        onSubmit={handleEditHotelSubmit}
        initialHotel={getInitialHotelData()}
      />
      
      {/* Edit Hotel Section Modal */}
      <EditHotelSectionModal
        isOpen={showEditHotelSectionModal}
        onClose={() => {
          setShowEditHotelSectionModal(false);
          setEditingHotelId(null);
        }}
        onSubmit={handleEditHotelSectionSubmit}
        initialData={getInitialHotelSectionData()}
      />

      <style jsx>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default function CodePage() {
  return (
    <ProtectedRoute>
      <CodePageContent />
    </ProtectedRoute>
  );
}

