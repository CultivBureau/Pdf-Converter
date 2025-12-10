/**
 * Section Code Updater Utility
 * Safely updates AirplaneSection and HotelsSection data without affecting tables or other code
 * 
 * IMPORTANT: These functions are designed to ONLY update the flights/hotels arrays
 * within AirplaneSection/HotelsSection components. They do NOT touch:
 * - DynamicTableTemplate components
 * - Tables arrays in the code
 * - SectionTemplate components
 * - Any other code
 */

/**
 * Update flights array in a specific AirplaneSection component by ID
 * This function is very careful to only replace the flights array data
 * and preserves all table data and other sections
 */
export function updateAirplaneSectionFlights(
  code: string,
  sectionId: string,
  flights: Array<{
    date: string;
    fromAirport: string;
    toAirport: string;
    travelers: { adults: number; children: number; infants: number };
    luggage: string;
  }>
): string {
  // Find all AirplaneSection components using a precise regex
  // Match self-closing tags: <AirplaneSection ... />
  // This ensures we don't accidentally match DynamicTableTemplate or other components
  const sectionRegex = /<AirplaneSection\s+[^>]*\/>/g;
  const matches = Array.from(code.matchAll(sectionRegex));
  
  // Find the section with matching ID
  let match: RegExpMatchArray | undefined;
  for (const m of matches) {
    const idMatch = m[0].match(/id\s*=\s*["']([^"']+)["']/);
    if (idMatch && idMatch[1] === sectionId) {
      match = m;
      break;
    }
  }
  
  if (!match) {
    console.warn('AirplaneSection not found with ID:', sectionId);
    return code;
  }
  const sectionStart = match.index!;
  const sectionEnd = sectionStart + match[0].length;
  const sectionCode = match[0];

  // Generate new flights array string
  const flightsStr = flights
    .map((flight) => {
      return `    {
      date: "${flight.date.replace(/"/g, '\\"')}",
      fromAirport: "${flight.fromAirport.replace(/"/g, '\\"').replace(/\n/g, '\\n')}",
      toAirport: "${flight.toAirport.replace(/"/g, '\\"').replace(/\n/g, '\\n')}",
      travelers: {
        adults: ${flight.travelers.adults},
        children: ${flight.travelers.children},
        infants: ${flight.travelers.infants}
      },
      luggage: "${flight.luggage.replace(/"/g, '\\"')}"
    }`;
    })
    .join(',\n');

  // Find and replace the flights array
  // Match: flights={[...]} - be very precise to only match within this component
  // Use non-greedy matching and ensure we're inside the AirplaneSection tag
  const flightsRegex = /flights\s*=\s*\{[\s\S]*?\[[\s\S]*?\][\s\S]*?\}/;
  const flightsMatch = sectionCode.match(flightsRegex);
  
  if (!flightsMatch) {
    console.warn('Could not find flights array in AirplaneSection');
    return code; // Return original code unchanged if we can't find the flights
  }

  // Replace ONLY the flights array content - preserve all other props
  const newFlightsProp = `flights={[\n${flightsStr}\n  ]}`;
  const updatedSection = sectionCode.replace(flightsRegex, newFlightsProp);
  
  // Verify we're not accidentally affecting tables by checking the updated section
  // doesn't contain table-related keywords
  if (updatedSection.includes('DynamicTableTemplate') || updatedSection.includes('tables.map')) {
    console.error('ERROR: Section update accidentally affected table code!');
    return code; // Return original code to prevent data loss
  }

  // Replace the section in the original code
  return code.slice(0, sectionStart) + updatedSection + code.slice(sectionEnd);
}

/**
 * Update hotels array in a specific HotelsSection component by ID
 */
export function updateHotelsSectionHotels(
  code: string,
  sectionId: string,
  hotels: Array<{
    city: string;
    nights: number;
    cityBadge?: string;
    hotelName: string;
    hasDetailsLink?: boolean;
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
  }>
): string {
  // Find all HotelsSection components - match self-closing tags only
  const sectionRegex = /<HotelsSection\s+[^>]*\/>/g;
  const matches = Array.from(code.matchAll(sectionRegex));
  
  // Find the section with matching ID
  let match: RegExpMatchArray | undefined;
  for (const m of matches) {
    const idMatch = m[0].match(/id\s*=\s*["']([^"']+)["']/);
    if (idMatch && idMatch[1] === sectionId) {
      match = m;
      break;
    }
  }
  
  if (!match) {
    console.warn('HotelsSection not found with ID:', sectionId);
    return code;
  }
  const sectionStart = match.index!;
  const sectionEnd = sectionStart + match[0].length;
  const sectionCode = match[0];

  // Generate new hotels array string
  const hotelsStr = hotels
    .map((hotel) => {
      const roomDesc = `{
        includesAll: "${hotel.roomDescription.includesAll.replace(/"/g, '\\"')}",
        bedType: "${hotel.roomDescription.bedType.replace(/"/g, '\\"')}"${
        hotel.roomDescription.roomType
          ? `,
        roomType: "${hotel.roomDescription.roomType.replace(/"/g, '\\"')}"`
          : ''
      }
      }`;

      const dayInfo = `{
        checkInDay: "${hotel.dayInfo.checkInDay.replace(/"/g, '\\"')}",
        checkOutDay: "${hotel.dayInfo.checkOutDay.replace(/"/g, '\\"')}"
      }`;

      return `    {
      city: "${hotel.city.replace(/"/g, '\\"')}",
      nights: ${hotel.nights},
      ${hotel.cityBadge ? `cityBadge: "${hotel.cityBadge.replace(/"/g, '\\"')}",` : ''}
      hotelName: "${hotel.hotelName.replace(/"/g, '\\"').replace(/\n/g, '\\n')}",
      hasDetailsLink: ${hotel.hasDetailsLink || false},
      roomDescription: ${roomDesc},
      checkInDate: "${hotel.checkInDate}",
      checkOutDate: "${hotel.checkOutDate}",
      dayInfo: ${dayInfo}
    }`;
    })
    .join(',\n');

  // Find and replace the hotels array
  const hotelsRegex = /hotels\s*=\s*\{[\s\S]*?\[[\s\S]*?\][\s\S]*?\}/;
  const hotelsMatch = sectionCode.match(hotelsRegex);
  
  if (!hotelsMatch) {
    console.warn('Could not find hotels array in HotelsSection');
    return code; // Return original code unchanged
  }

  const newHotelsProp = `hotels={[\n${hotelsStr}\n  ]}`;
  const updatedSection = sectionCode.replace(hotelsRegex, newHotelsProp);
  
  // Verify we're not accidentally affecting tables
  if (updatedSection.includes('DynamicTableTemplate') || updatedSection.includes('tables.map')) {
    console.error('ERROR: Section update accidentally affected table code!');
    return code; // Return original code to prevent data loss
  }

  return code.slice(0, sectionStart) + updatedSection + code.slice(sectionEnd);
}

/**
 * Update entire AirplaneSection component (all props including title, noticeMessage)
 * Use this when editing via section-level edit button
 */
export function updateAirplaneSection(
  code: string,
  sectionId: string,
  data: {
    title?: string;
    flights: Array<{
      date: string;
      fromAirport: string;
      toAirport: string;
      travelers: { adults: number; children: number; infants: number };
      luggage: string;
    }>;
    noticeMessage?: string;
    showTitle?: boolean;
    showNotice?: boolean;
  }
): string {
  const sectionRegex = /<AirplaneSection\s+[^>]*\/>/g;
  const matches = Array.from(code.matchAll(sectionRegex));
  
  // Find the section with matching ID
  let match: RegExpMatchArray | undefined;
  for (const m of matches) {
    const idMatch = m[0].match(/id\s*=\s*["']([^"']+)["']/);
    if (idMatch && idMatch[1] === sectionId) {
      match = m;
      break;
    }
  }
  
  if (!match) {
    console.warn('AirplaneSection not found with ID:', sectionId);
    return code;
  }
  const sectionStart = match.index!;
  const sectionEnd = sectionStart + match[0].length;

  // Generate new component JSX (similar to sectionInserter)
  const flightsStr = data.flights
    .map((flight) => {
      return `    {
      date: "${flight.date.replace(/"/g, '\\"')}",
      fromAirport: "${flight.fromAirport.replace(/"/g, '\\"').replace(/\n/g, '\\n')}",
      toAirport: "${flight.toAirport.replace(/"/g, '\\"').replace(/\n/g, '\\n')}",
      travelers: {
        adults: ${flight.travelers.adults},
        children: ${flight.travelers.children},
        infants: ${flight.travelers.infants}
      },
      luggage: "${flight.luggage.replace(/"/g, '\\"')}"
    }`;
    })
    .join(',\n');

  const props: string[] = [];
  props.push(`id="${sectionId}"`); // Preserve the ID
  if (data.title) {
    props.push(`title="${data.title.replace(/"/g, '\\"')}"`);
  }
  if (data.showTitle !== undefined) {
    props.push(`showTitle={${data.showTitle}}`);
  }
  if (data.noticeMessage) {
    props.push(`noticeMessage="${data.noticeMessage.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`);
  }
  if (data.showNotice !== undefined) {
    props.push(`showNotice={${data.showNotice}}`);
  }
  props.push('direction="rtl"');
  props.push('language="ar"');

  const newSection = `<AirplaneSection
  flights={[
${flightsStr}
  ]}
  ${props.join('\n  ')}
/>`;

  // Verify we're not affecting tables
  if (newSection.includes('DynamicTableTemplate') || newSection.includes('tables.map')) {
    console.error('ERROR: Section update accidentally affected table code!');
    return code;
  }

  return code.slice(0, sectionStart) + newSection + code.slice(sectionEnd);
}

/**
 * Update entire HotelsSection component (all props including title)
 * Use this when editing via section-level edit button
 */
export function updateHotelsSection(
  code: string,
  sectionId: string,
  data: {
    title?: string;
    hotels: Array<{
      city: string;
      nights: number;
      cityBadge?: string;
      hotelName: string;
      hasDetailsLink?: boolean;
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
    }>;
    showTitle?: boolean;
  }
): string {
  const sectionRegex = /<HotelsSection\s+[^>]*\/>/g;
  const matches = Array.from(code.matchAll(sectionRegex));
  
  // Find the section with matching ID
  let match: RegExpMatchArray | undefined;
  for (const m of matches) {
    const idMatch = m[0].match(/id\s*=\s*["']([^"']+)["']/);
    if (idMatch && idMatch[1] === sectionId) {
      match = m;
      break;
    }
  }
  
  if (!match) {
    console.warn('HotelsSection not found with ID:', sectionId);
    return code;
  }
  const sectionStart = match.index!;
  const sectionEnd = sectionStart + match[0].length;

  // Generate new component JSX
  const hotelsStr = data.hotels
    .map((hotel) => {
      const roomDesc = `{
        includesAll: "${hotel.roomDescription.includesAll.replace(/"/g, '\\"')}",
        bedType: "${hotel.roomDescription.bedType.replace(/"/g, '\\"')}"${
        hotel.roomDescription.roomType
          ? `,
        roomType: "${hotel.roomDescription.roomType.replace(/"/g, '\\"')}"`
          : ''
      }
      }`;

      const dayInfo = `{
        checkInDay: "${hotel.dayInfo.checkInDay.replace(/"/g, '\\"')}",
        checkOutDay: "${hotel.dayInfo.checkOutDay.replace(/"/g, '\\"')}"
      }`;

      return `    {
      city: "${hotel.city.replace(/"/g, '\\"')}",
      nights: ${hotel.nights},
      ${hotel.cityBadge ? `cityBadge: "${hotel.cityBadge.replace(/"/g, '\\"')}",` : ''}
      hotelName: "${hotel.hotelName.replace(/"/g, '\\"').replace(/\n/g, '\\n')}",
      hasDetailsLink: ${hotel.hasDetailsLink || false},
      roomDescription: ${roomDesc},
      checkInDate: "${hotel.checkInDate}",
      checkOutDate: "${hotel.checkOutDate}",
      dayInfo: ${dayInfo}
    }`;
    })
    .join(',\n');

  const props: string[] = [];
  props.push(`id="${sectionId}"`); // Preserve the ID
  if (data.title) {
    props.push(`title="${data.title.replace(/"/g, '\\"')}"`);
  }
  if (data.showTitle !== undefined) {
    props.push(`showTitle={${data.showTitle}}`);
  }
  props.push('direction="rtl"');
  props.push('language="ar"');

  const newSection = `<HotelsSection
  hotels={[
${hotelsStr}
  ]}
  ${props.join('\n  ')}
/>`;

  // Verify we're not affecting tables
  if (newSection.includes('DynamicTableTemplate') || newSection.includes('tables.map')) {
    console.error('ERROR: Section update accidentally affected table code!');
    return code;
  }

  return code.slice(0, sectionStart) + newSection + code.slice(sectionEnd);
}

/**
 * Delete an AirplaneSection component by ID
 */
export function deleteAirplaneSection(code: string, sectionId: string): string {
  const sectionRegex = /<AirplaneSection\s+[^>]*\/>/g;
  const matches = Array.from(code.matchAll(sectionRegex));
  
  // Find the section with matching ID
  let match: RegExpMatchArray | undefined;
  for (const m of matches) {
    const idMatch = m[0].match(/id\s*=\s*["']([^"']+)["']/);
    if (idMatch && idMatch[1] === sectionId) {
      match = m;
      break;
    }
  }
  
  if (!match) {
    console.warn('AirplaneSection not found with ID:', sectionId);
    return code;
  }

  const sectionStart = match.index!;
  const sectionEnd = sectionStart + match[0].length;

  // Remove the section and clean up surrounding whitespace
  let before = code.slice(0, sectionStart);
  let after = code.slice(sectionEnd);
  
  // Clean up extra whitespace
  before = before.replace(/\n\s*\n\s*$/, '\n');
  after = after.replace(/^\s*\n\s*/, '\n');
  
  return before + after;
}

/**
 * Delete a HotelsSection component by ID
 */
export function deleteHotelsSection(code: string, sectionId: string): string {
  const sectionRegex = /<HotelsSection\s+[^>]*\/>/g;
  const matches = Array.from(code.matchAll(sectionRegex));
  
  // Find the section with matching ID
  let match: RegExpMatchArray | undefined;
  for (const m of matches) {
    const idMatch = m[0].match(/id\s*=\s*["']([^"']+)["']/);
    if (idMatch && idMatch[1] === sectionId) {
      match = m;
      break;
    }
  }
  
  if (!match) {
    console.warn('HotelsSection not found with ID:', sectionId);
    return code;
  }

  const sectionStart = match.index!;
  const sectionEnd = sectionStart + match[0].length;

  // Remove the section and clean up surrounding whitespace
  let before = code.slice(0, sectionStart);
  let after = code.slice(sectionEnd);
  
  // Clean up extra whitespace
  before = before.replace(/\n\s*\n\s*$/, '\n');
  after = after.replace(/^\s*\n\s*/, '\n');
  
  return before + after;
}
