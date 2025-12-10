/**
 * Section Updater Utility
 * Functions to update, remove, or add flights/hotels within existing AirplaneSection/HotelsSection components
 */

/**
 * Update a specific flight in an AirplaneSection
 */
export function updateFlightInSection(
  code: string,
  sectionIndex: number,
  flightIndex: number,
  updatedFlight: {
    date: string;
    fromAirport: string;
    toAirport: string;
    travelers: { adults: number; children: number; infants: number };
    luggage: string;
  }
): string {
  // Find all AirplaneSection components
  const airplaneSectionRegex = /<AirplaneSection[\s\S]*?\/>/g;
  const matches = Array.from(code.matchAll(airplaneSectionRegex));
  
  if (sectionIndex >= matches.length || !matches[sectionIndex]) {
    console.warn('AirplaneSection not found at index:', sectionIndex);
    return code;
  }

  const sectionMatch = matches[sectionIndex];
  const sectionStart = sectionMatch.index!;
  const sectionEnd = sectionStart + sectionMatch[0].length;
  const sectionCode = sectionMatch[0];

  // Extract flights array from the section
  const flightsMatch = sectionCode.match(/flights\s*=\s*\{[\s\S]*?\[([\s\S]*?)\]\s*\}/);
  if (!flightsMatch) {
    console.warn('Could not find flights array in AirplaneSection');
    return code;
  }

  // Parse existing flights
  const flightsStr = flightsMatch[1];
  const flightMatches = Array.from(flightsStr.matchAll(/\{[\s\S]*?\}(?=\s*,\s*\{|\s*\])/g));
  
  if (flightIndex >= flightMatches.length) {
    console.warn('Flight index out of range:', flightIndex);
    return code;
  }

  // Generate updated flight object
  const updatedFlightStr = `    {
      date: "${updatedFlight.date.replace(/"/g, '\\"')}",
      fromAirport: "${updatedFlight.fromAirport.replace(/"/g, '\\"').replace(/\n/g, '\\n')}",
      toAirport: "${updatedFlight.toAirport.replace(/"/g, '\\"').replace(/\n/g, '\\n')}",
      travelers: {
        adults: ${updatedFlight.travelers.adults},
        children: ${updatedFlight.travelers.children},
        infants: ${updatedFlight.travelers.infants}
      },
      luggage: "${updatedFlight.luggage.replace(/"/g, '\\"')}"
    }`;

  // Replace the specific flight
  const flightMatch = flightMatches[flightIndex];
  const flightStart = sectionStart + flightsMatch.index! + flightMatch.index!;
  const flightEnd = flightStart + flightMatch[0].length;
  
  const beforeFlight = code.slice(0, flightStart);
  const afterFlight = code.slice(flightEnd);
  
  return beforeFlight + updatedFlightStr + afterFlight;
}

/**
 * Remove a specific flight from an AirplaneSection
 */
export function removeFlightFromSection(
  code: string,
  sectionIndex: number,
  flightIndex: number
): string {
  const airplaneSectionRegex = /<AirplaneSection[\s\S]*?\/>/g;
  const matches = Array.from(code.matchAll(airplaneSectionRegex));
  
  if (sectionIndex >= matches.length || !matches[sectionIndex]) {
    return code;
  }

  const sectionMatch = matches[sectionIndex];
  const sectionCode = sectionMatch[0];
  const flightsMatch = sectionCode.match(/flights\s*=\s*\{[\s\S]*?\[([\s\S]*?)\]\s*\}/);
  
  if (!flightsMatch) {
    return code;
  }

  const flightsStr = flightsMatch[1];
  const flightMatches = Array.from(flightsStr.matchAll(/\{[\s\S]*?\}(?=\s*,\s*\{|\s*\])/g));
  
  if (flightIndex >= flightMatches.length || flightMatches.length <= 1) {
    return code; // Can't remove if only one flight
  }

  // Remove the flight from the array
  const updatedFlights = flightMatches
    .filter((_, idx) => idx !== flightIndex)
    .map(m => m[0])
    .join(',\n');

  // Reconstruct the section
  const beforeFlights = sectionCode.substring(0, flightsMatch.index!);
  const afterFlights = sectionCode.substring(flightsMatch.index! + flightsMatch[0].length);
  const newFlightsStr = `[\n${updatedFlights}\n  ]`;
  const updatedSection = beforeFlights + newFlightsStr + afterFlights;

  // Replace in original code
  const sectionStart = sectionMatch.index!;
  const sectionEnd = sectionStart + sectionMatch[0].length;
  return code.slice(0, sectionStart) + updatedSection + code.slice(sectionEnd);
}

/**
 * Add a new flight to an AirplaneSection
 */
export function addFlightToSection(
  code: string,
  sectionIndex: number,
  newFlight: {
    date: string;
    fromAirport: string;
    toAirport: string;
    travelers: { adults: number; children: number; infants: number };
    luggage: string;
  }
): string {
  const airplaneSectionRegex = /<AirplaneSection[\s\S]*?\/>/g;
  const matches = Array.from(code.matchAll(airplaneSectionRegex));
  
  if (sectionIndex >= matches.length || !matches[sectionIndex]) {
    return code;
  }

  const sectionMatch = matches[sectionIndex];
  const sectionCode = sectionMatch[0];
  const flightsMatch = sectionCode.match(/flights\s*=\s*\{[\s\S]*?\[([\s\S]*?)\]\s*\}/);
  
  if (!flightsMatch) {
    return code;
  }

  // Generate new flight string
  const newFlightStr = `    {
      date: "${newFlight.date.replace(/"/g, '\\"')}",
      fromAirport: "${newFlight.fromAirport.replace(/"/g, '\\"').replace(/\n/g, '\\n')}",
      toAirport: "${newFlight.toAirport.replace(/"/g, '\\"').replace(/\n/g, '\\n')}",
      travelers: {
        adults: ${newFlight.travelers.adults},
        children: ${newFlight.travelers.children},
        infants: ${newFlight.travelers.infants}
      },
      luggage: "${newFlight.luggage.replace(/"/g, '\\"')}"
    }`;

  // Add to flights array
  const flightsStr = flightsMatch[1];
  const updatedFlights = flightsStr.trim() 
    ? `${flightsStr},\n${newFlightStr}`
    : newFlightStr;

  // Reconstruct section
  const beforeFlights = sectionCode.substring(0, flightsMatch.index!);
  const afterFlights = sectionCode.substring(flightsMatch.index! + flightsMatch[0].length);
  const newFlightsArray = `[\n${updatedFlights}\n  ]`;
  const updatedSection = beforeFlights + newFlightsArray + afterFlights;

  const sectionStart = sectionMatch.index!;
  const sectionEnd = sectionStart + sectionMatch[0].length;
  return code.slice(0, sectionStart) + updatedSection + code.slice(sectionEnd);
}

/**
 * Update a specific hotel in a HotelsSection
 */
export function updateHotelInSection(
  code: string,
  sectionIndex: number,
  hotelIndex: number,
  updatedHotel: {
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
  }
): string {
  const hotelsSectionRegex = /<HotelsSection[\s\S]*?\/>/g;
  const matches = Array.from(code.matchAll(hotelsSectionRegex));
  
  if (sectionIndex >= matches.length || !matches[sectionIndex]) {
    return code;
  }

  const sectionMatch = matches[sectionIndex];
  const sectionCode = sectionMatch[0];
  const hotelsMatch = sectionCode.match(/hotels\s*=\s*\{[\s\S]*?\[([\s\S]*?)\]\s*\}/);
  
  if (!hotelsMatch) {
    return code;
  }

  const hotelsStr = hotelsMatch[1];
  const hotelMatches = Array.from(hotelsStr.matchAll(/\{[\s\S]*?\}(?=\s*,\s*\{|\s*\])/g));
  
  if (hotelIndex >= hotelMatches.length) {
    return code;
  }

  // Generate updated hotel object
  const roomDesc = `{
        includesAll: "${updatedHotel.roomDescription.includesAll.replace(/"/g, '\\"')}",
        bedType: "${updatedHotel.roomDescription.bedType.replace(/"/g, '\\"')}"${
    updatedHotel.roomDescription.roomType
      ? `,
        roomType: "${updatedHotel.roomDescription.roomType.replace(/"/g, '\\"')}"`
      : ''
  }
      }`;

  const dayInfo = `{
        checkInDay: "${updatedHotel.dayInfo.checkInDay.replace(/"/g, '\\"')}",
        checkOutDay: "${updatedHotel.dayInfo.checkOutDay.replace(/"/g, '\\"')}"
      }`;

  const updatedHotelStr = `    {
      city: "${updatedHotel.city.replace(/"/g, '\\"')}",
      nights: ${updatedHotel.nights},
      ${updatedHotel.cityBadge ? `cityBadge: "${updatedHotel.cityBadge.replace(/"/g, '\\"')}",` : ''}
      hotelName: "${updatedHotel.hotelName.replace(/"/g, '\\"').replace(/\n/g, '\\n')}",
      hasDetailsLink: ${updatedHotel.hasDetailsLink || false},
      roomDescription: ${roomDesc},
      checkInDate: "${updatedHotel.checkInDate}",
      checkOutDate: "${updatedHotel.checkOutDate}",
      dayInfo: ${dayInfo}
    }`;

  const hotelMatch = hotelMatches[hotelIndex];
  const hotelStart = sectionMatch.index! + hotelsMatch.index! + hotelMatch.index!;
  const hotelEnd = hotelStart + hotelMatch[0].length;
  
  return code.slice(0, hotelStart) + updatedHotelStr + code.slice(hotelEnd);
}

/**
 * Remove a specific hotel from a HotelsSection
 */
export function removeHotelFromSection(
  code: string,
  sectionIndex: number,
  hotelIndex: number
): string {
  const hotelsSectionRegex = /<HotelsSection[\s\S]*?\/>/g;
  const matches = Array.from(code.matchAll(hotelsSectionRegex));
  
  if (sectionIndex >= matches.length || !matches[sectionIndex]) {
    return code;
  }

  const sectionMatch = matches[sectionIndex];
  const sectionCode = sectionMatch[0];
  const hotelsMatch = sectionCode.match(/hotels\s*=\s*\{[\s\S]*?\[([\s\S]*?)\]\s*\}/);
  
  if (!hotelsMatch) {
    return code;
  }

  const hotelsStr = hotelsMatch[1];
  const hotelMatches = Array.from(hotelsStr.matchAll(/\{[\s\S]*?\}(?=\s*,\s*\{|\s*\])/g));
  
  if (hotelIndex >= hotelMatches.length || hotelMatches.length <= 1) {
    return code;
  }

  const updatedHotels = hotelMatches
    .filter((_, idx) => idx !== hotelIndex)
    .map(m => m[0])
    .join(',\n');

  const beforeHotels = sectionCode.substring(0, hotelsMatch.index!);
  const afterHotels = sectionCode.substring(hotelsMatch.index! + hotelsMatch[0].length);
  const newHotelsStr = `[\n${updatedHotels}\n  ]`;
  const updatedSection = beforeHotels + newHotelsStr + afterHotels;

  const sectionStart = sectionMatch.index!;
  const sectionEnd = sectionStart + sectionMatch[0].length;
  return code.slice(0, sectionStart) + updatedSection + code.slice(sectionEnd);
}

/**
 * Add a new hotel to a HotelsSection
 */
export function addHotelToSection(
  code: string,
  sectionIndex: number,
  newHotel: {
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
  }
): string {
  const hotelsSectionRegex = /<HotelsSection[\s\S]*?\/>/g;
  const matches = Array.from(code.matchAll(hotelsSectionRegex));
  
  if (sectionIndex >= matches.length || !matches[sectionIndex]) {
    return code;
  }

  const sectionMatch = matches[sectionIndex];
  const sectionCode = sectionMatch[0];
  const hotelsMatch = sectionCode.match(/hotels\s*=\s*\{[\s\S]*?\[([\s\S]*?)\]\s*\}/);
  
  if (!hotelsMatch) {
    return code;
  }

  // Generate new hotel string (same as in updateHotelInSection)
  const roomDesc = `{
        includesAll: "${newHotel.roomDescription.includesAll.replace(/"/g, '\\"')}",
        bedType: "${newHotel.roomDescription.bedType.replace(/"/g, '\\"')}"${
    newHotel.roomDescription.roomType
      ? `,
        roomType: "${newHotel.roomDescription.roomType.replace(/"/g, '\\"')}"`
      : ''
  }
      }`;

  const dayInfo = `{
        checkInDay: "${newHotel.dayInfo.checkInDay.replace(/"/g, '\\"')}",
        checkOutDay: "${newHotel.dayInfo.checkOutDay.replace(/"/g, '\\"')}"
      }`;

  const newHotelStr = `    {
      city: "${newHotel.city.replace(/"/g, '\\"')}",
      nights: ${newHotel.nights},
      ${newHotel.cityBadge ? `cityBadge: "${newHotel.cityBadge.replace(/"/g, '\\"')}",` : ''}
      hotelName: "${newHotel.hotelName.replace(/"/g, '\\"').replace(/\n/g, '\\n')}",
      hasDetailsLink: ${newHotel.hasDetailsLink || false},
      roomDescription: ${roomDesc},
      checkInDate: "${newHotel.checkInDate}",
      checkOutDate: "${newHotel.checkOutDate}",
      dayInfo: ${dayInfo}
    }`;

  const hotelsStr = hotelsMatch[1];
  const updatedHotels = hotelsStr.trim()
    ? `${hotelsStr},\n${newHotelStr}`
    : newHotelStr;

  const beforeHotels = sectionCode.substring(0, hotelsMatch.index!);
  const afterHotels = sectionCode.substring(hotelsMatch.index! + hotelsMatch[0].length);
  const newHotelsArray = `[\n${updatedHotels}\n  ]`;
  const updatedSection = beforeHotels + newHotelsArray + afterHotels;

  const sectionStart = sectionMatch.index!;
  const sectionEnd = sectionStart + sectionMatch[0].length;
  return code.slice(0, sectionStart) + updatedSection + code.slice(sectionEnd);
}

