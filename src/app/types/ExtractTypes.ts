/**
 * Type definitions for PDF extraction and processing
 */

export interface Section {
  type: "section";
  id: string;
  title: string;
  content: string;
  order: number;
  parent_id: string | null;
  colorPalette?: {
    type: 'default' | 'warm' | 'cool' | 'nature' | 'professional' | 'vibrant' | 'custom';
    name: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      text: string;
    };
    applyBackground?: boolean;
  };
}

export interface Table {
  type: "table";
  id: string;
  title?: string;
  columns: string[];
  rows: string[][];
  order: number;
  section_id: string | null;
  backgroundColor?: 'dark-blue' | 'dark-red' | 'pink' | 'green';
}

export interface Structure {
  sections: Section[];
  tables: Table[];
  meta: {
    generated_at?: string;
    sections_count?: number;
    tables_count?: number;
    [key: string]: any;
  };
}

export interface UploadResponse {
  message: string;
  file_path: string;
  filename: string;
  original_filename: string;
}

export interface Image {
  page: number;
  path: string;
  width: number;
  height: number;
  format: string;
  size_bytes: number;
}

export interface ExtractResponse {
  sections: Section[];
  tables: Table[];
  images?: Image[];
  meta: Record<string, any>;
}

export interface CleanStructureResponse extends ExtractResponse {
  meta: {
    improvements?: string[];
    original_sections_count?: number;
    cleaned_sections_count?: number;
    claude_processed_at?: string;
    claude_model?: string;
    [key: string]: any;
  };
}

export interface GenerateJSXResponse {
  jsxCode: string;
  componentsUsed: string[];
  warnings: string[];
  metadata: Record<string, any>;
}

export interface FixJSXResponse {
  fixedCode: string;
  explanation: string;
  errors: string[];
  warnings: string[];
  changes: Array<{
    type: string;
    description: string;
    line: number;
  }>;
  metadata: Record<string, any>;
}

// User-created content types
export interface AirplaneSectionData {
  flights?: {
    date: string;
    time?: string;
    airlineCompany?: string;
    airlineCompanyLink?: string;
    fromAirport: string;
    fromAirportLink?: string;
    toAirport: string;
    toAirportLink?: string;
    travelers: {
      adults: number;
      children: number;
      infants: number;
    };
    luggage: string;
  }[];
  title?: string;
  showTitle?: boolean;
  noticeMessage?: string;
  showNotice?: boolean;
  direction?: "rtl" | "ltr";
  language?: "ar" | "en";
  columnLabels?: {
    date: string;
    fromAirport: string;
    toAirport: string;
    travelers: string;
    luggage: string;
  };
  [key: string]: any;
}

export interface HotelsSectionData {
  hotels?: {
    city: string;
    nights: number;
    cityBadge?: string;
    hotelName: string;
    hasDetailsLink?: boolean;
    detailsLink?: string;
    roomDescription: {
      includesAll: string;
      bedType: string;
      roomType?: string;
    };
    checkInDate: string;
    checkOutDate: string;
    dayInfo: {
      checkInDay: string;
      checkOutDay: string;
    };
  }[];
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
  [key: string]: any;
}

export interface TransportSectionData {
  tables?: Array<{
    id: string;
    title: string;
    backgroundColor: 'dark-blue' | 'dark-red' | 'pink';
    columns: Array<{ key: string; label: string }>;
    rows: Array<{
      day: string;
      date: string;
      from: string;
      to: string;
      fromLink?: string;
      toLink?: string;
      description: string;
      carType: string;
      note?: string;
      [key: string]: any;
    }>;
  }>;
  title?: string;
  showTitle?: boolean;
  direction?: "rtl" | "ltr";
  language?: "ar" | "en";
  [key: string]: any;
}

export interface UserElement {
  id: string;  // user_airplane_*, user_hotel_*, or user_transport_*
  type: "airplane" | "hotel" | "transport";
  data: AirplaneSectionData | HotelsSectionData | TransportSectionData;
  created_at?: string;
  order?: number;
}

export interface SeparatedStructure {
  generated: {
    sections: Section[];
    tables: Table[];
  };
  user: {
    elements: UserElement[];
  };
  layout: string[];  // Order: ["gen_sec_1", "user_airplane_1", ...]
  meta: {
    generated_at?: string;
    sections_count?: number;
    tables_count?: number;
    structure_version?: number;
    [key: string]: any;
  };
}

