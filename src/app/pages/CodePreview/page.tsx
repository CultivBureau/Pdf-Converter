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
import StructureRenderer from "../../components/StructureRenderer";
import CreateTableModal from "../../components/CreateTableModal";
import AddAirplaneModal, { FlightData } from "../../components/AddAirplaneModal";
import EditFlightModal from "../../components/EditFlightModal";
import EditAirplaneSectionModal from "../../components/EditAirplaneSectionModal";;
import AddHotelModal from "../../components/AddHotelModal";
import EditHotelModal from "../../components/EditHotelModal";
import EditHotelSectionModal from "../../components/EditHotelSectionModal";
import AddTransportModal from "../../components/AddTransportModal";
import EditTransportRowModal from "../../components/EditTransportRowModal";
import EditTransportTableModal from "../../components/EditTransportTableModal";
import EditTransportSectionModal from "../../components/EditTransportSectionModal";
import { Hotel } from "../../Templates/HotelsSection";
import { isAuthenticated } from "../../services/AuthApi";
import { saveDocument, updateDocument, getDocument } from "../../services/HistoryApi";
import ProtectedRoute from "../../components/ProtectedRoute";
import VersionHistoryModal from "../../components/VersionHistoryModal";
import type { SeparatedStructure, UserElement } from "../../types/ExtractTypes";

// Default empty structure
const defaultStructure: SeparatedStructure = {
  generated: {
    sections: [],
    tables: []
  },
  user: {
    elements: []
  },
  layout: [],
  meta: {}
};

function CodePageContent() {
  const searchParams = useSearchParams();
  const [structure, setStructure] = useState<SeparatedStructure>(defaultStructure);
  const [sourceMetadata, setSourceMetadata] = useState<{
    filename?: string;
    uploadedAt?: string;
  } | null>(null);
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
  const [showAddTransportModal, setShowAddTransportModal] = useState(false);
  const [editingTransportId, setEditingTransportId] = useState<string | null>(null);
  const [editingTransportTableIndex, setEditingTransportTableIndex] = useState<number | null>(null);
  const [editingTransportRowIndex, setEditingTransportRowIndex] = useState<number | null>(null);
  const [showEditTransportRowModal, setShowEditTransportRowModal] = useState(false);
  const [showEditTransportTableModal, setShowEditTransportTableModal] = useState(false);
  const [showEditTransportSectionModal, setShowEditTransportSectionModal] = useState(false);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  
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
      if (!action || !sectionId) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[HOTEL CLICK] Missing action or sectionId', { action, sectionId });
        }
        return;
      }
      
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
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[HOTEL CLICK] Action: ${action}, Section: ${sectionId}, Hotel Index: ${hotelIndexStr}`);
      }
      
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
    
    const handleTransportSectionClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Find the button that was clicked (or its parent button)
      const button = target.closest('button[data-action]') as HTMLButtonElement;
      if (!button) return;
      
      const action = button.getAttribute('data-action');
      const sectionId = button.getAttribute('data-transport-section-id');
      const tableIndexStr = button.getAttribute('data-table-index');
      const rowIndexStr = button.getAttribute('data-row-index');
      
      // Verify we have required attributes
      if (!action || !sectionId) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[TRANSPORT CLICK] Missing action or sectionId', { action, sectionId });
        }
        return;
      }
      
      // Type check: ensure sectionId is a string (getAttribute returns string | null)
      if (typeof sectionId !== 'string') {
        console.error('[TRANSPORT CLICK] Invalid sectionId type:', typeof sectionId, sectionId);
        return;
      }
      
      // Explicitly convert to string to ensure type safety
      const sectionIdString = String(sectionId);
      
      // CRITICAL: Verify ID starts with user_transport_ to prevent modifying generated content
      if (!sectionIdString.startsWith('user_transport_')) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Attempted to ${action} on non-user transport section: ${sectionIdString}`);
        }
        alert('Cannot modify generated content. Only user-created transport sections can be edited.');
        return;
      }
      
      // Prevent default and stop propagation
      e.preventDefault();
      e.stopPropagation();
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[TRANSPORT CLICK] Action: ${action}, Section: ${sectionIdString}, Table: ${tableIndexStr}, Row: ${rowIndexStr}`);
      }
      
      // Route to appropriate handler
      switch (action) {
        case 'edit-row': {
          const tableIndex = tableIndexStr ? parseInt(tableIndexStr, 10) : null;
          const rowIndex = rowIndexStr ? parseInt(rowIndexStr, 10) : null;
          if (tableIndex === null || isNaN(tableIndex) || rowIndex === null || isNaN(rowIndex)) {
            console.error('Invalid table/row index for edit-row action');
            return;
          }
          setEditingTransportId(sectionIdString);
          setEditingTransportTableIndex(tableIndex);
          setEditingTransportRowIndex(rowIndex);
          setShowEditTransportRowModal(true);
          break;
        }
        case 'remove-row': {
          const tableIndex = tableIndexStr ? parseInt(tableIndexStr, 10) : null;
          const rowIndex = rowIndexStr ? parseInt(rowIndexStr, 10) : null;
          if (tableIndex === null || isNaN(tableIndex) || rowIndex === null || isNaN(rowIndex)) {
            console.error('Invalid table/row index for remove-row action');
            return;
          }
          handleRemoveTransportRow(sectionIdString, tableIndex, rowIndex);
          break;
        }
        case 'add-row': {
          const tableIndex = tableIndexStr ? parseInt(tableIndexStr, 10) : null;
          if (tableIndex === null || isNaN(tableIndex)) {
            console.error('Invalid table index for add-row action');
            return;
          }
          handleAddTransportRow(sectionIdString, tableIndex);
          break;
        }
        case 'edit-table': {
          const tableIndex = tableIndexStr ? parseInt(tableIndexStr, 10) : null;
          if (tableIndex === null || isNaN(tableIndex)) {
            console.error('Invalid table index for edit-table action');
            return;
          }
          setEditingTransportId(sectionIdString);
          setEditingTransportTableIndex(tableIndex);
          setShowEditTransportTableModal(true);
          break;
        }
        case 'delete-table': {
          const tableIndex = tableIndexStr ? parseInt(tableIndexStr, 10) : null;
          if (tableIndex === null || isNaN(tableIndex)) {
            console.error('Invalid table index for delete-table action');
            return;
          }
          handleRemoveTransportTable(sectionIdString, tableIndex);
          break;
        }
        case 'edit-section': {
          setEditingTransportId(sectionIdString);
          setEditingTransportTableIndex(null);
          setEditingTransportRowIndex(null);
          setShowEditTransportSectionModal(true);
          break;
        }
        case 'delete-section': {
          handleDeleteTransportSection(sectionIdString);
          break;
        }
        default:
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Unknown transport section action: ${action}`);
          }
      }
    };
    
    container.addEventListener('click', handleAirplaneSectionClick);
    container.addEventListener('click', handleHotelSectionClick);
    container.addEventListener('click', handleTransportSectionClick);
    
    return () => {
      container.removeEventListener('click', handleAirplaneSectionClick);
      container.removeEventListener('click', handleHotelSectionClick);
      container.removeEventListener('click', handleTransportSectionClick);
    };
  }, []);
  
  // Handler functions for airplane section actions - Updated to work with JSON structure
  const handleRemoveFlight = useCallback((id: string, flightIndex: number) => {
    try {
      // Verify ID prefix
      if (!id.startsWith('user_airplane_')) {
        alert('Cannot modify generated content. Only user-created airplane sections can be edited.');
        return;
      }
      
      // Find the user element in JSON structure
      setStructure(prev => {
        const userElementIndex = prev.user.elements.findIndex(el => el.id === id && el.type === 'airplane');
        if (userElementIndex === -1) {
        alert('Airplane section not found');
          return prev;
        }
        
        const updatedElements = [...prev.user.elements];
        const element = updatedElements[userElementIndex];
        const flights = [...(element.data.flights || [])];
        flights.splice(flightIndex, 1);
        
        updatedElements[userElementIndex] = {
          ...element,
          data: {
            ...element.data,
            flights
          }
        };
        
        return {
          ...prev,
          user: {
            elements: updatedElements
          }
        };
      });
    } catch (error) {
      console.error('Error removing flight:', error);
        alert(error instanceof Error ? error.message : 'Failed to remove flight');
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
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[AIRPLANE CRUD] Adding flight to airplane section ${id}`);
      }
      
      const newFlight: FlightData = {
        date: new Date().toISOString().split('T')[0],
        fromAirport: "",
        toAirport: "",
        travelers: { adults: 1, children: 0, infants: 0 },
        luggage: "20 كيلو"
      };
      
      // Add flight to JSON structure
      setStructure(prev => {
        const userElementIndex = prev.user.elements.findIndex(el => el.id === id && el.type === 'airplane');
        if (userElementIndex === -1) {
          alert('Airplane section not found');
          return prev;
        }
        
        const updatedElements = [...prev.user.elements];
        const element = updatedElements[userElementIndex];
        const flights = [...(element.data.flights || []), newFlight];
        
        updatedElements[userElementIndex] = {
          ...element,
          data: {
            ...element.data,
            flights
          }
        };
        
        return {
          ...prev,
          user: {
            elements: updatedElements
          }
        };
      });
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
    // Verify ID prefix - only user-created elements can be deleted
    if (!id.startsWith('user_')) {
      alert('Cannot delete generated content. Only user-created sections can be deleted.');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this section?')) {
      return;
    }
    
    try {
      // Remove from JSON structure
      setStructure(prev => {
        // Remove from user.elements
        const updatedElements = prev.user.elements.filter(el => el.id !== id);
        
        // Remove from layout
        const updatedLayout = prev.layout.filter(layoutId => layoutId !== id);
        
        return {
          ...prev,
          user: {
            elements: updatedElements
          },
          layout: updatedLayout
        };
      });
    } catch (error) {
      console.error('Error deleting section:', error);
        alert(error instanceof Error ? error.message : 'Failed to delete section');
    }
  }, []);
  
  // Handler for editing a flight
  const handleEditFlightSubmit = useCallback((updatedFlight: FlightData) => {
    if (!editingAirplaneId || editingFlightIndex === null) {
      return;
    }
    
    try {
      // Verify ID prefix
      if (!editingAirplaneId.startsWith('user_airplane_')) {
        alert('Cannot modify generated content. Only user-created airplane sections can be edited.');
        return;
      }
      
      // Update flight in JSON structure
      setStructure(prev => {
        const userElementIndex = prev.user.elements.findIndex(
          el => el.id === editingAirplaneId && el.type === 'airplane'
        );
        
        if (userElementIndex === -1) {
          alert('Airplane section not found');
          return prev;
        }
        
        const updatedElements = [...prev.user.elements];
        const element = updatedElements[userElementIndex];
        const flights = [...(element.data.flights || [])];
        flights[editingFlightIndex] = updatedFlight;
        
        updatedElements[userElementIndex] = {
          ...element,
          data: {
            ...element.data,
            flights
          }
        };
        
        return {
          ...prev,
          user: {
            elements: updatedElements
          }
        };
      });
      
      setShowEditFlightModal(false);
      setEditingAirplaneId(null);
      setEditingFlightIndex(null);
    } catch (error) {
      console.error('Error updating flight:', error);
        alert(error instanceof Error ? error.message : 'Failed to update flight');
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
      // Verify ID prefix
      if (!editingAirplaneId.startsWith('user_airplane_')) {
        alert('Cannot modify generated content. Only user-created airplane sections can be edited.');
        return;
      }
      
      // Update section properties in JSON structure
      setStructure(prev => {
        const userElementIndex = prev.user.elements.findIndex(
          el => el.id === editingAirplaneId && el.type === 'airplane'
        );
        
        if (userElementIndex === -1) {
          alert('Airplane section not found');
          return prev;
        }
        
        const updatedElements = [...prev.user.elements];
        const element = updatedElements[userElementIndex];
        
        updatedElements[userElementIndex] = {
          ...element,
          data: {
            ...element.data,
            ...props
          }
        };
        
        return {
          ...prev,
          user: {
            elements: updatedElements
          }
        };
      });
      
      setShowEditSectionModal(false);
      setEditingAirplaneId(null);
    } catch (error) {
      console.error('Error updating section:', error);
        alert(error instanceof Error ? error.message : 'Failed to update section');
    }
  }, [editingAirplaneId]);
  
  // Get initial flight data for edit modal - Updated to read from JSON structure
  const getInitialFlightData = useCallback((): FlightData | null => {
    if (!editingAirplaneId || editingFlightIndex === null) {
      return null;
    }
    
    try {
      const element = structure.user.elements.find(
        el => el.id === editingAirplaneId && el.type === 'airplane'
      );
      
      if (!element || !element.data.flights) {
        return null;
      }
      
      const flights = element.data.flights;
      if (editingFlightIndex >= 0 && editingFlightIndex < flights.length) {
        return flights[editingFlightIndex];
      }
    } catch (error) {
      console.error('Error extracting flight data:', error);
    }
    
    return null;
  }, [editingAirplaneId, editingFlightIndex, structure]);
  
  // Get initial section data for edit modal - Updated to read from JSON structure
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
      const element = structure.user.elements.find(
        el => el.id === editingAirplaneId && el.type === 'airplane'
      );
      
      if (!element) {
        return null;
      }
      
      // Read directly from JSON structure
      return {
        title: element.data.title,
        showTitle: element.data.showTitle,
        noticeMessage: element.data.noticeMessage,
        showNotice: element.data.showNotice,
        direction: element.data.direction,
        language: element.data.language
      };
    } catch (error) {
      console.error('Error extracting section data:', error);
    }
    
    return null;
  }, [editingAirplaneId, structure]);

  // Handler functions for hotel section actions - Updated to work with JSON structure
  const handleRemoveHotel = useCallback((id: string, hotelIndex: number) => {
    try {
      // Verify ID prefix
      if (!id.startsWith('user_hotel_')) {
        alert('Cannot modify generated content. Only user-created hotel sections can be edited.');
        return;
      }
      
      // Remove hotel from JSON structure
      setStructure(prev => {
        const userElementIndex = prev.user.elements.findIndex(el => el.id === id && el.type === 'hotel');
        if (userElementIndex === -1) {
        alert('Hotel section not found');
          return prev;
        }
        
        const updatedElements = [...prev.user.elements];
        const element = updatedElements[userElementIndex];
        const hotels = [...(element.data.hotels || [])];
        hotels.splice(hotelIndex, 1);
        
        updatedElements[userElementIndex] = {
          ...element,
          data: {
            ...element.data,
            hotels
          }
        };
        
        return {
          ...prev,
          user: {
            elements: updatedElements
          }
        };
      });
    } catch (error) {
      console.error('Error removing hotel:', error);
        alert(error instanceof Error ? error.message : 'Failed to remove hotel');
    }
  }, []);
  
  const handleAddHotel = useCallback((id: string) => {
    try {
      // Verify ID prefix
      if (!id.startsWith('user_hotel_')) {
        alert('Cannot modify generated content. Only user-created hotel sections can be edited.');
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
      
      // Add hotel to JSON structure
      setStructure(prev => {
        const userElementIndex = prev.user.elements.findIndex(el => el.id === id && el.type === 'hotel');
        if (userElementIndex === -1) {
          alert('Hotel section not found');
          return prev;
        }
        
        const updatedElements = [...prev.user.elements];
        const element = updatedElements[userElementIndex];
        const hotels = [...(element.data.hotels || []), newHotel];
        
        updatedElements[userElementIndex] = {
          ...element,
          data: {
            ...element.data,
            hotels
          }
        };
        
        return {
          ...prev,
          user: {
            elements: updatedElements
          }
        };
      });
    } catch (error) {
      console.error('Error adding hotel:', error);
        alert(error instanceof Error ? error.message : 'Failed to add hotel');
    }
  }, []);
  
  const handleDeleteHotelSection = useCallback((id: string) => {
    // Verify ID prefix - only user-created elements can be deleted
    if (!id.startsWith('user_hotel_')) {
      alert('Cannot delete generated content. Only user-created sections can be deleted.');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this hotel section?')) {
      return;
    }
    
    try {
      // Remove from JSON structure (same as handleDeleteSection, but keeping separate for clarity)
      setStructure(prev => {
        const updatedElements = prev.user.elements.filter(el => el.id !== id);
        const updatedLayout = prev.layout.filter(layoutId => layoutId !== id);
        
        return {
          ...prev,
          user: {
            elements: updatedElements
          },
          layout: updatedLayout
        };
      });
    } catch (error) {
      console.error('Error deleting hotel section:', error);
        alert(error instanceof Error ? error.message : 'Failed to delete section');
    }
  }, []);
  
  // Handler for editing a hotel
  const handleEditHotelSubmit = useCallback((updatedHotel: Hotel) => {
    if (!editingHotelId || editingHotelIndex === null) {
      return;
    }
    
    try {
      // Verify ID prefix
      if (!editingHotelId.startsWith('user_hotel_')) {
        alert('Cannot modify generated content. Only user-created hotel sections can be edited.');
        return;
      }
      
      // Update hotel in JSON structure
      setStructure(prev => {
        const userElementIndex = prev.user.elements.findIndex(
          el => el.id === editingHotelId && el.type === 'hotel'
        );
        
        if (userElementIndex === -1) {
          alert('Hotel section not found');
          return prev;
        }
        
        const updatedElements = [...prev.user.elements];
        const element = updatedElements[userElementIndex];
        const hotels = [...(element.data.hotels || [])];
        hotels[editingHotelIndex] = updatedHotel;
        
        updatedElements[userElementIndex] = {
          ...element,
          data: {
            ...element.data,
            hotels
          }
        };
        
        return {
          ...prev,
          user: {
            elements: updatedElements
          }
        };
      });
      
      setShowEditHotelModal(false);
      setEditingHotelId(null);
      setEditingHotelIndex(null);
    } catch (error) {
      console.error('Error updating hotel:', error);
        alert(error instanceof Error ? error.message : 'Failed to update hotel');
    }
  }, [editingHotelId, editingHotelIndex]);
  
  // Handler for editing section properties
  const handleEditHotelSectionSubmit = useCallback((props: {
    title?: string;
    showTitle?: boolean;
  }) => {
    if (!editingHotelId) {
      return;
    }
    
    try {
      // Verify ID prefix
      if (!editingHotelId.startsWith('user_hotel_')) {
        alert('Cannot modify generated content. Only user-created hotel sections can be edited.');
        return;
      }
      
      // Update section properties in JSON structure
      setStructure(prev => {
        const userElementIndex = prev.user.elements.findIndex(
          el => el.id === editingHotelId && el.type === 'hotel'
        );
        
        if (userElementIndex === -1) {
          alert('Hotel section not found');
          return prev;
        }
        
        const updatedElements = [...prev.user.elements];
        const element = updatedElements[userElementIndex];
        
        updatedElements[userElementIndex] = {
          ...element,
          data: {
            ...element.data,
            ...props
          }
        };
        
        return {
          ...prev,
          user: {
            elements: updatedElements
          }
        };
      });
      
      setShowEditHotelSectionModal(false);
      setEditingHotelId(null);
    } catch (error) {
      console.error('Error updating hotel section:', error);
        alert(error instanceof Error ? error.message : 'Failed to update section');
    }
  }, [editingHotelId]);

  // Handler functions for transport section actions - Updated to work with JSON structure
  const handleRemoveTransportRow = useCallback((id: string, tableIndex: number, rowIndex: number) => {
    try {
      if (!id.startsWith('user_transport_')) {
        alert('Cannot modify generated content. Only user-created transport sections can be edited.');
        return;
      }
      
      // Remove row from JSON structure
      setStructure(prev => {
        const userElementIndex = prev.user.elements.findIndex(el => el.id === id && el.type === 'transport');
        if (userElementIndex === -1) {
          alert('Transport section not found');
          return prev;
        }
        
        const updatedElements = [...prev.user.elements];
        const element = updatedElements[userElementIndex];
        const tables = [...(element.data.tables || [])];
        
        if (tableIndex >= 0 && tableIndex < tables.length) {
          const table = tables[tableIndex];
          const rows = [...(table.rows || [])];
          rows.splice(rowIndex, 1);
          tables[tableIndex] = { ...table, rows };
        }
        
        updatedElements[userElementIndex] = {
          ...element,
          data: {
            ...element.data,
            tables
          }
        };
        
        return {
          ...prev,
          user: {
            elements: updatedElements
          }
        };
      });
    } catch (error) {
      console.error('Error removing transport row:', error);
      alert(error instanceof Error ? error.message : 'Failed to remove row');
    }
  }, []);

  const handleAddTransportRow = useCallback((id: string, tableIndex: number) => {
    try {
      if (!id.startsWith('user_transport_')) {
        alert('Cannot modify generated content. Only user-created transport sections can be edited.');
        return;
      }
      
      // Add row to JSON structure
      setStructure(prev => {
        const userElementIndex = prev.user.elements.findIndex(el => el.id === id && el.type === 'transport');
        if (userElementIndex === -1) {
        alert('Transport section not found');
          return prev;
        }
        
        const updatedElements = [...prev.user.elements];
        const element = updatedElements[userElementIndex];
        const tables = [...(element.data.tables || [])];
        
        if (tableIndex >= 0 && tableIndex < tables.length) {
      const table = tables[tableIndex];
      const newRow: any = {
        day: "",
        date: new Date().toISOString().split('T')[0],
        description: "",
        carType: "",
      };
      
      // Initialize all column values
          (table.columns || []).forEach((col: any) => {
        if (!newRow[col.key]) {
          newRow[col.key] = "";
        }
      });
      
          const rows = [...(table.rows || []), newRow];
          tables[tableIndex] = { ...table, rows };
        }
        
        updatedElements[userElementIndex] = {
          ...element,
          data: {
            ...element.data,
            tables
          }
        };
        
        return {
          ...prev,
          user: {
            elements: updatedElements
          }
        };
      });
    } catch (error) {
      console.error('Error adding transport row:', error);
      alert(error instanceof Error ? error.message : 'Failed to add row');
    }
  }, []);

  const handleRemoveTransportTable = useCallback((id: string, tableIndex: number) => {
    try {
      if (!id.startsWith('user_transport_')) {
        alert('Cannot modify generated content. Only user-created transport sections can be edited.');
        return;
      }
      
      if (!confirm('Are you sure you want to delete this table?')) {
        return;
      }
      
      // Remove table from JSON structure
      setStructure(prev => {
        const userElementIndex = prev.user.elements.findIndex(el => el.id === id && el.type === 'transport');
        if (userElementIndex === -1) {
          alert('Transport section not found');
          return prev;
        }
        
        const updatedElements = [...prev.user.elements];
        const element = updatedElements[userElementIndex];
        const tables = [...(element.data.tables || [])];
        tables.splice(tableIndex, 1);
        
        updatedElements[userElementIndex] = {
          ...element,
          data: {
            ...element.data,
            tables
          }
        };
        
        return {
          ...prev,
          user: {
            elements: updatedElements
          }
        };
      });
    } catch (error) {
      console.error('Error removing transport table:', error);
      alert(error instanceof Error ? error.message : 'Failed to remove table');
    }
  }, []);

  const handleDeleteTransportSection = useCallback((id: string) => {
    if (!id.startsWith('user_transport_')) {
      alert('Cannot delete generated content. Only user-created sections can be deleted.');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this transport section?')) {
      return;
    }
    
    try {
      // Remove from JSON structure (same as handleDeleteSection)
      setStructure(prev => {
        const updatedElements = prev.user.elements.filter(el => el.id !== id);
        const updatedLayout = prev.layout.filter(layoutId => layoutId !== id);
        
        return {
          ...prev,
          user: {
            elements: updatedElements
          },
          layout: updatedLayout
        };
      });
    } catch (error) {
      console.error('Error deleting transport section:', error);
        alert(error instanceof Error ? error.message : 'Failed to delete section');
    }
  }, []);

  // Handler for editing a transport row
  const handleEditTransportRowSubmit = useCallback((updatedRow: any) => {
    if (!editingTransportId || editingTransportTableIndex === null || editingTransportRowIndex === null) {
      return;
    }
    
    try {
      if (!editingTransportId.startsWith('user_transport_')) {
        const errorMsg = `SECURITY: Attempted to edit row in non-user transport section: ${editingTransportId}`;
        console.error(errorMsg);
        alert('Cannot modify generated content. Only user-created transport sections can be edited.');
        return;
      }
      
      // Update row in JSON structure
      setStructure(prev => {
        const userElementIndex = prev.user.elements.findIndex(
          el => el.id === editingTransportId && el.type === 'transport'
        );
        
        if (userElementIndex === -1) {
          alert('Transport section not found');
          return prev;
        }
        
        const updatedElements = [...prev.user.elements];
        const element = updatedElements[userElementIndex];
        const tables = [...(element.data.tables || [])];
        
        if (editingTransportTableIndex >= 0 && editingTransportTableIndex < tables.length) {
          const table = tables[editingTransportTableIndex];
          const rows = [...(table.rows || [])];
          if (editingTransportRowIndex >= 0 && editingTransportRowIndex < rows.length) {
            rows[editingTransportRowIndex] = updatedRow;
            tables[editingTransportTableIndex] = { ...table, rows };
          }
        }
        
        updatedElements[userElementIndex] = {
          ...element,
          data: {
            ...element.data,
            tables
          }
        };
        
        return {
          ...prev,
          user: {
            elements: updatedElements
          }
        };
      });
      
      setShowEditTransportRowModal(false);
      setEditingTransportId(null);
      setEditingTransportTableIndex(null);
      setEditingTransportRowIndex(null);
    } catch (error) {
      console.error('Error updating transport row:', error);
      alert(error instanceof Error ? error.message : 'Failed to update row');
    }
  }, [editingTransportId, editingTransportTableIndex, editingTransportRowIndex]);

  // Handler for editing a transport table
  const handleEditTransportTableSubmit = useCallback((updatedTable: any) => {
    if (!editingTransportId || editingTransportTableIndex === null) {
      return;
    }
    
    try {
      if (!editingTransportId.startsWith('user_transport_')) {
        alert('Cannot modify generated content. Only user-created transport sections can be edited.');
        return;
      }
      
      // Update table in JSON structure
      setStructure(prev => {
        const userElementIndex = prev.user.elements.findIndex(
          el => el.id === editingTransportId && el.type === 'transport'
        );
        
        if (userElementIndex === -1) {
          alert('Transport section not found');
          return prev;
        }
        
        const updatedElements = [...prev.user.elements];
        const element = updatedElements[userElementIndex];
        const tables = [...(element.data.tables || [])];
        
        if (editingTransportTableIndex >= 0 && editingTransportTableIndex < tables.length) {
          tables[editingTransportTableIndex] = updatedTable;
        }
        
        updatedElements[userElementIndex] = {
          ...element,
          data: {
            ...element.data,
            tables
          }
        };
        
        return {
          ...prev,
          user: {
            elements: updatedElements
          }
        };
      });
      
      setShowEditTransportTableModal(false);
      setEditingTransportId(null);
      setEditingTransportTableIndex(null);
    } catch (error) {
      console.error('Error updating transport table:', error);
      alert(error instanceof Error ? error.message : 'Failed to update table');
    }
  }, [editingTransportId, editingTransportTableIndex]);

  // Handler for editing section properties
  const handleEditTransportSectionSubmit = useCallback((props: {
    title?: string;
    showTitle?: boolean;
    direction?: "rtl" | "ltr";
    language?: "ar" | "en";
  }) => {
    if (!editingTransportId) {
      return;
    }
    
    try {
      if (!editingTransportId.startsWith('user_transport_')) {
        const errorMsg = `SECURITY: Attempted to edit non-user transport section: ${editingTransportId}`;
        console.error(errorMsg);
        alert('Cannot modify generated content. Only user-created transport sections can be edited.');
        return;
      }
      
      // Update section properties in JSON structure
      setStructure(prev => {
        const userElementIndex = prev.user.elements.findIndex(
          el => el.id === editingTransportId && el.type === 'transport'
        );
        
        if (userElementIndex === -1) {
          alert('Transport section not found');
          return prev;
        }
        
        const updatedElements = [...prev.user.elements];
        const element = updatedElements[userElementIndex];
        
        updatedElements[userElementIndex] = {
          ...element,
          data: {
            ...element.data,
            ...props
          }
        };
        
        return {
          ...prev,
          user: {
            elements: updatedElements
          }
        };
      });
      
      setShowEditTransportSectionModal(false);
      setEditingTransportId(null);
    } catch (error) {
      console.error('Error updating transport section:', error);
        alert(error instanceof Error ? error.message : 'Failed to update section');
    }
  }, [editingTransportId]);

  // Get initial transport row data for edit modal
  const getInitialTransportRowData = useCallback((): any | null => {
    if (!editingTransportId || editingTransportTableIndex === null || editingTransportRowIndex === null) {
      return null;
    }
    
    try {
      const element = structure.user.elements.find(
        el => el.id === editingTransportId && el.type === 'transport'
      );
      
      if (!element || !element.data.tables) {
        return null;
      }
      
      const tables = element.data.tables;
      if (editingTransportTableIndex >= 0 && editingTransportTableIndex < tables.length) {
        const table = tables[editingTransportTableIndex];
        if (editingTransportRowIndex >= 0 && editingTransportRowIndex < (table.rows || []).length) {
          return table.rows[editingTransportRowIndex];
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting initial transport row data:', error);
      return null;
    }
  }, [editingTransportId, editingTransportTableIndex, editingTransportRowIndex, structure]);

  // Get initial transport table data for edit modal - Updated to read from JSON structure
  const getInitialTransportTableData = useCallback((): any | null => {
    if (!editingTransportId || editingTransportTableIndex === null) {
      return null;
    }
    
    try {
      const element = structure.user.elements.find(
        el => el.id === editingTransportId && el.type === 'transport'
      );
      
      if (!element || !element.data.tables) {
        return null;
      }
      
      const tables = element.data.tables;
      if (editingTransportTableIndex >= 0 && editingTransportTableIndex < tables.length) {
        return tables[editingTransportTableIndex];
      }
      return null;
    } catch (error) {
      console.error('Error getting initial transport table data:', error);
      return null;
    }
  }, [editingTransportId, editingTransportTableIndex, structure]);

  // Get initial transport section data for edit modal - Updated to read from JSON structure
  const getInitialTransportSectionData = useCallback(() => {
    if (!editingTransportId) {
      return null;
    }
    
    try {
      const element = structure.user.elements.find(
        el => el.id === editingTransportId && el.type === 'transport'
      );
      
      if (!element) {
        return null;
      }
      
      return {
        title: element.data.title,
        showTitle: element.data.showTitle,
        direction: element.data.direction,
        language: element.data.language
      };
    } catch (error) {
      console.error('Error getting initial transport section data:', error);
      return null;
    }
  }, [editingTransportId, structure]);
  
  // Get initial hotel data for edit modal - Updated to read from JSON structure
  const getInitialHotelData = useCallback((): Hotel | null => {
    if (!editingHotelId || editingHotelIndex === null) {
      return null;
    }
    
    try {
      const element = structure.user.elements.find(
        el => el.id === editingHotelId && el.type === 'hotel'
      );
      
      if (!element || !element.data.hotels) {
        return null;
      }
      
      const hotels = element.data.hotels;
      if (editingHotelIndex >= 0 && editingHotelIndex < hotels.length) {
        return hotels[editingHotelIndex];
      }
    } catch (error) {
      console.error('Error extracting hotel data:', error);
    }
    
    return null;
  }, [editingHotelId, editingHotelIndex, structure]);
  
  // Get initial section data for edit modal - Updated to read from JSON structure
  const getInitialHotelSectionData = useCallback((): {
    title?: string;
    showTitle?: boolean;
  } | null => {
    if (!editingHotelId) {
      return null;
    }
    
    try {
      const element = structure.user.elements.find(
        el => el.id === editingHotelId && el.type === 'hotel'
      );
      
      if (!element) {
        return null;
      }
      
      return {
        title: element.data.title,
        showTitle: element.data.showTitle
      };
    } catch (error) {
      console.error('Error extracting hotel section data:', error);
    }
    
    return null;
  }, [editingHotelId, structure]);
  

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if we're loading a specific document
    const docIdParam = searchParams?.get("docId");
    if (docIdParam && isAuthenticated()) {
      loadDocument(docIdParam);
      return;
    }

    // Load from sessionStorage (from upload flow)
    const storedDocId = sessionStorage.getItem("codePreview.documentId");
    if (storedDocId) {
      setDocumentId(storedDocId);
      sessionStorage.removeItem("codePreview.documentId");
    }

    const storedMetadata = sessionStorage.getItem("codePreview.metadata");
    if (storedMetadata) {
      try {
        const parsed = JSON.parse(storedMetadata);
        setSourceMetadata(parsed);
      } catch {
        // ignore parse errors
      }
      sessionStorage.removeItem("codePreview.metadata");
    }

    // Load structured data from sessionStorage (v2 format)
    const storedExtractedData = sessionStorage.getItem("codePreview.extractedData");
    if (storedExtractedData) {
      try {
        const parsed = JSON.parse(storedExtractedData);
        // Ensure it's v2 format
        if (parsed && parsed.generated && parsed.user && parsed.layout) {
          setStructure(parsed as SeparatedStructure);
        } else if (parsed && (parsed.sections || parsed.tables)) {
          // Legacy format - migrate to v2
          setStructure({
            generated: {
              sections: parsed.sections || [],
              tables: parsed.tables || []
            },
            user: {
              elements: []
            },
            layout: [
              ...(parsed.sections || []).map((s: any) => s.id),
              ...(parsed.tables || []).map((t: any) => t.id)
            ],
            meta: parsed.meta || {}
          });
        }
      } catch {
        // ignore parse errors
      }
      sessionStorage.removeItem("codePreview.extractedData");
    }
  }, [searchParams]);

  const loadDocument = async (docId: string) => {
    try {
      const response = await getDocument(docId);
      const doc = response.document;
      
      setDocumentId(doc.id);
      setCurrentVersion(doc.current_version || 1);
      setTotalVersions(doc.total_versions || 1);
      
      // Load v2 structure from extracted_data
      if (doc.extracted_data) {
        // Ensure it's v2 format
        if (doc.extracted_data.generated && doc.extracted_data.user && doc.extracted_data.layout) {
          setStructure(doc.extracted_data as SeparatedStructure);
        } else if (doc.extracted_data.sections || doc.extracted_data.tables) {
          // Legacy format - migrate to v2
          setStructure({
            generated: {
              sections: doc.extracted_data.sections || [],
              tables: doc.extracted_data.tables || []
            },
            user: {
              elements: []
            },
            layout: [
              ...(doc.extracted_data.sections || []).map((s: any) => s.id),
              ...(doc.extracted_data.tables || []).map((t: any) => t.id)
            ],
            meta: doc.extracted_data.meta || {}
          });
        }
      }
      
      if (doc.metadata) {
        setSourceMetadata({
          filename: doc.metadata.filename || doc.original_filename,
          uploadedAt: doc.created_at,
        });
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
      
      // Reload structure - handle both v2 and legacy formats
      if (doc.extracted_data) {
        if (doc.extracted_data.generated && doc.extracted_data.user && doc.extracted_data.layout) {
          // v2 format
          setStructure(doc.extracted_data as SeparatedStructure);
        } else if (doc.extracted_data.sections || doc.extracted_data.tables) {
          // Legacy format - migrate to v2
          setStructure({
            generated: {
              sections: doc.extracted_data.sections || [],
              tables: doc.extracted_data.tables || []
            },
            user: {
              elements: []
            },
            layout: [
              ...(doc.extracted_data.sections || []).map((s: any) => s.id),
              ...(doc.extracted_data.tables || []).map((t: any) => t.id)
            ],
            meta: doc.extracted_data.meta || {}
          });
        }
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

  // Old JSX code manipulation hooks removed - now using JSON structure
  // Removed useEffect hooks that referenced mode, code, values, codeRef, parsed, setCode, etc.

  const handleCreateTable = useCallback((config: {
    title: string;
    columns: string[];
    rowCount: number;
  }) => {
    // Add new table to JSON structure
    const tableId = `gen_tbl_${Date.now()}`;
    const newTable = {
      id: tableId,
      title: config.title,
      columns: config.columns.map((col, idx) => ({
        key: `col_${idx}`,
        label: col
      })),
      rows: Array(config.rowCount).fill(null).map(() => 
        config.columns.reduce((acc, _, idx) => {
          acc[`col_${idx}`] = '';
          return acc;
        }, {} as Record<string, string>)
      ),
      order: structure.generated.tables.length
    };
    
    setStructure(prev => ({
      ...prev,
      generated: {
        ...prev.generated,
        tables: [...prev.generated.tables, newTable]
      },
      layout: [...prev.layout, tableId]
    }));
    
    setShowTableCreatedToast(true);
    setTimeout(() => setShowTableCreatedToast(false), 3000);
  }, [structure]);

  const handleExportCode = useCallback(() => {
    // Export JSON structure
    const jsonStr = JSON.stringify(structure, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [structure]);

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
    
    // Add to JSON structure
    const newElement: UserElement = {
      id: elementId,
      type: "airplane",
      data: {
        flights: data.flights,
        title: data.title,
        showTitle: data.showTitle,
        noticeMessage: data.noticeMessage,
        showNotice: data.showNotice,
        direction: data.direction || "rtl",
        language: data.language || "ar"
      }
    };
    
    setStructure(prev => ({
      ...prev,
      user: {
        elements: [...prev.user.elements, newElement]
      },
      layout: [elementId, ...prev.layout]
    }));
    
    setShowAddAirplaneModal(false);
  }, []);

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
    
    // Add to JSON structure
    const newElement: UserElement = {
      id: elementId,
      type: "hotel",
      data: {
        hotels: data.hotels,
        title: data.title,
        showTitle: data.showTitle,
        direction: data.direction || "rtl",
        language: data.language || "ar",
        labels: data.labels
      }
    };
    
    setStructure(prev => ({
      ...prev,
      user: {
        elements: [...prev.user.elements, newElement]
      },
      layout: [elementId, ...prev.layout]
    }));
    
    setShowAddHotelModal(false);
    
    /* OLD JSX CODE REMOVED - Now works with JSON structure */
  }, []);

  const handleAddTransportClick = useCallback(() => {
    setShowAddTransportModal(true);
    setShowMenuDropdown(false);
  }, []);

  const handleAddTransportSubmit = useCallback((data: {
    title?: string;
    showTitle?: boolean;
    tables: any[];
    direction?: "rtl" | "ltr";
    language?: "ar" | "en";
  }) => {
    // Generate unique ID for user element
    const elementId = `user_transport_${Date.now()}`;
    
    // Add to JSON structure
    const newElement: UserElement = {
      id: elementId,
      type: "transport",
      data: {
        title: data.title,
        showTitle: data.showTitle,
        tables: data.tables,
        direction: data.direction || "rtl",
        language: data.language || "ar"
      }
    };
    
    setStructure(prev => ({
      ...prev,
      user: {
        elements: [...prev.user.elements, newElement]
      },
      layout: [elementId, ...prev.layout]
    }));
    
    setShowAddTransportModal(false);
    
    /* OLD JSX CODE REMOVED - Now works with JSON structure */
  }, []);

  const handleSave = useCallback(async () => {
    if (!isAuthenticated()) {
      alert("Please login to save documents");
      return;
    }

    setIsSaving(true);
    setSaveStatus("idle");

    try {
      const filePath = sessionStorage.getItem("codePreview.filePath");
      const originalFilename = sessionStorage.getItem("codePreview.originalFilename");

      if (documentId) {
        // Update existing document with current structure
        const updateResponse = await updateDocument(documentId, {
          extracted_data: structure, // Save full v2 structure
          metadata: {
            ...sourceMetadata,
            lastSaved: new Date().toISOString(),
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
          extracted_data: structure, // Save full v2 structure
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
  }, [structure, documentId, sourceMetadata]);

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
                    
                    {/* Add Transport */}
                    <button
                      onClick={handleAddTransportClick}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                      </svg>
                      <span>Add Transport</span>
                    </button>
                    
                    {/* New Table */}
                    <button
                      onClick={() => {
                        setIsCreateTableModalOpen(true);
                        setShowMenuDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
                    >
                      <svg className="w-4 h-4 text-[#A4C639]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>New Table</span>
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
            
          </div>
        </div>
      </div>
    </div>
  ), [handleExportCode, handleExportPDF, handleSave, handleAddAirplaneClick, handleAddAirplaneSubmit, handleAddHotelClick, handleAddHotelSubmit, handleAddTransportClick, handleAddTransportSubmit, sourceMetadata, isSaving, saveStatus, documentId, totalVersions, currentVersion, showMenuDropdown]);

  return (
    <div className="min-h-screen bg-linear-to-br from-cyan-50 via-blue-50 to-lime-50 text-gray-900">
      {header}
      <div className="mx-auto w-full max-w-7xl px-6 py-8">
          <div className="min-h-[70vh] bg-white rounded-xl shadow-lg p-8 max-w-full overflow-hidden relative">
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
                <StructureRenderer 
              structure={structure}
                  showStats={false}
              editable={true}
              onSectionEdit={(section) => {
                // Update section in structure
                setStructure(prev => {
                  const updatedSections = prev.generated.sections.map(s => 
                    s.id === section.id ? section : s
                  );
                  return {
                    ...prev,
                    generated: {
                      ...prev.generated,
                      sections: updatedSections
                    }
                  };
                });
              }}
              onTableEdit={(table) => {
                // Update table in structure
                setStructure(prev => {
                  const updatedTables = prev.generated.tables.map(t => 
                    t.id === table.id ? table : t
                  );
                  return {
                    ...prev,
                    generated: {
                      ...prev.generated,
                      tables: updatedTables
                    }
                  };
                });
              }}
              onSectionDelete={(id) => {
                // Remove section from structure
                setStructure(prev => ({
                  ...prev,
                  generated: {
                    ...prev.generated,
                    sections: prev.generated.sections.filter(s => s.id !== id)
                  },
                  layout: prev.layout.filter(lid => lid !== id)
                }));
              }}
              onTableDelete={(id) => {
                // Remove table from structure
                setStructure(prev => ({
                  ...prev,
                  generated: {
                    ...prev.generated,
                    tables: prev.generated.tables.filter(t => t.id !== id)
                  },
                  layout: prev.layout.filter(lid => lid !== id)
                }));
              }}
              onSectionAddAfter={(afterId) => {
                // Add new section after the specified section
                const newSectionId = `gen_sec_${Date.now()}`;
                const newSection = {
                  id: newSectionId,
                  title: 'New Section',
                  content: 'Enter section content here...',
                  type: 'section' as const,
                  order: structure.generated.sections.length
                };
                
                setStructure(prev => {
                  // Find the index of the section to add after
                  const afterIndex = prev.layout.findIndex(id => id === afterId);
                  
                  // Create new layout with the new section inserted after
                  const newLayout = [...prev.layout];
                  if (afterIndex !== -1) {
                    newLayout.splice(afterIndex + 1, 0, newSectionId);
                  } else {
                    newLayout.push(newSectionId);
                  }
                  
                  return {
                    ...prev,
                    generated: {
                      ...prev.generated,
                      sections: [...prev.generated.sections, newSection]
                    },
                    layout: newLayout
                  };
                });
              }}
              onUserElementEdit={(element) => {
                // Handle user element edit
                if (element.type === 'airplane') {
                  setEditingAirplaneId(element.id);
                  setShowEditSectionModal(true);
                } else if (element.type === 'hotel') {
                  setEditingHotelId(element.id);
                  setShowEditHotelSectionModal(true);
                }
              }}
              onUserElementDelete={(id) => {
                // Remove element from structure
                setStructure(prev => ({
                  ...prev,
                  user: {
                    elements: prev.user.elements.filter(el => el.id !== id)
                  },
                  layout: prev.layout.filter(lid => lid !== id)
                }));
              }}
            />
            </div>
          </div>
      </div>

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
      
      {/* Add Transport Modal */}
      <AddTransportModal
        isOpen={showAddTransportModal}
        onClose={() => setShowAddTransportModal(false)}
        onSubmit={handleAddTransportSubmit}
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

      {/* Edit Transport Row Modal */}
      <EditTransportRowModal
        isOpen={showEditTransportRowModal}
        onClose={() => {
          setShowEditTransportRowModal(false);
          setEditingTransportId(null);
          setEditingTransportTableIndex(null);
          setEditingTransportRowIndex(null);
        }}
        onSubmit={handleEditTransportRowSubmit}
        initialRow={getInitialTransportRowData()}
        columns={(() => {
          if (!editingTransportId || editingTransportTableIndex === null) return [];
          try {
            const element = structure.user.elements.find(
              el => el.id === editingTransportId && el.type === 'transport'
            );
            if (!element || !element.data.tables) return [];
            const tables = element.data.tables;
            if (editingTransportTableIndex >= 0 && editingTransportTableIndex < tables.length) {
              return tables[editingTransportTableIndex].columns || [];
            }
          } catch (error) {
            console.error('Error getting columns:', error);
          }
          return [];
        })()}
        language={(() => {
          if (!editingTransportId) return 'ar';
          try {
            const element = structure.user.elements.find(
              el => el.id === editingTransportId && el.type === 'transport'
            );
            return element?.data?.language || 'ar';
          } catch {
            return 'ar';
          }
        })()}
      />

      {/* Edit Transport Table Modal */}
      <EditTransportTableModal
        isOpen={showEditTransportTableModal}
        onClose={() => {
          setShowEditTransportTableModal(false);
          setEditingTransportId(null);
          setEditingTransportTableIndex(null);
        }}
        onSubmit={handleEditTransportTableSubmit}
        initialTable={getInitialTransportTableData()}
        language={(() => {
          if (!editingTransportId) return 'ar';
          try {
            const element = structure.user.elements.find(
              el => el.id === editingTransportId && el.type === 'transport'
            );
            return element?.data?.language || 'ar';
          } catch {
            return 'ar';
          }
        })()}
      />

      {/* Edit Transport Section Modal */}
      <EditTransportSectionModal
        isOpen={showEditTransportSectionModal}
        onClose={() => {
          setShowEditTransportSectionModal(false);
          setEditingTransportId(null);
        }}
        onSubmit={handleEditTransportSectionSubmit}
        onDelete={() => {
          if (editingTransportId) {
            handleDeleteTransportSection(editingTransportId);
          }
        }}
        initialData={getInitialTransportSectionData()}
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

