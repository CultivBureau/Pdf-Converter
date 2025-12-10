/**
 * Section Inserter Utility
 * Functions to insert AirplaneSection and HotelsSection components into JSX code
 * at the top of BaseTemplate content
 */

import type { AirplaneSectionData } from '../components/AirplaneSectionModal';
import type { HotelsSectionData } from '../components/HotelsSectionModal';

/**
 * Generate JSX string for AirplaneSection component
 */
function generateAirplaneSectionJSX(data: AirplaneSectionData): string {
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

  // Generate unique ID
  const sectionId = `airplane_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const props: string[] = [];
  props.push(`id="${sectionId}"`);
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

  return `<AirplaneSection
  flights={[
${flightsStr}
  ]}
  ${props.join('\n  ')}
/>`;
}

/**
 * Generate JSX string for HotelsSection component
 */
function generateHotelsSectionJSX(data: HotelsSectionData): string {
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

  // Generate unique ID
  const sectionId = `hotels_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const props: string[] = [];
  props.push(`id="${sectionId}"`);
  if (data.title) {
    props.push(`title="${data.title.replace(/"/g, '\\"')}"`);
  }
  if (data.showTitle !== undefined) {
    props.push(`showTitle={${data.showTitle}}`);
  }
  props.push('direction="rtl"');
  props.push('language="ar"');

  return `<HotelsSection
  hotels={[
${hotelsStr}
  ]}
  ${props.join('\n  ')}
/>`;
}

/**
 * Check if import statement exists in code
 */
function hasImport(code: string, componentName: string): boolean {
  const importPattern = new RegExp(
    `import\\s+${componentName}\\s+from\\s+['"]@/app/Templates/${componentName.toLowerCase()}[^'"]*['"]`,
    'i'
  );
  return importPattern.test(code);
}

/**
 * Add import statement if it doesn't exist
 */
function ensureImport(code: string, componentName: string, importPath: string): string {
  if (hasImport(code, componentName)) {
    return code;
  }

  // Find the last import statement or "use client" directive
  const useClientMatch = code.match(/^"use client";?\s*\n/);
  const importMatches = code.matchAll(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm);
  
  let lastImportIndex = -1;
  let lastImportMatch: RegExpMatchArray | null = null;
  
  for (const match of importMatches) {
    if (match.index !== undefined && match.index > lastImportIndex) {
      lastImportIndex = match.index;
      lastImportMatch = match;
    }
  }

  const newImport = `import ${componentName} from '${importPath}';\n`;

  if (lastImportMatch && lastImportMatch.index !== undefined) {
    // Insert after last import
    const insertIndex = lastImportMatch.index + lastImportMatch[0].length;
    return code.slice(0, insertIndex) + newImport + code.slice(insertIndex);
  } else if (useClientMatch && useClientMatch.index !== undefined) {
    // Insert after "use client"
    const insertIndex = useClientMatch.index + useClientMatch[0].length;
    return code.slice(0, insertIndex) + newImport + code.slice(insertIndex);
  } else {
    // Insert at the beginning
    return newImport + code;
  }
}

/**
 * Insert AirplaneSection component at the top of BaseTemplate content
 */
export function insertAirplaneSection(code: string, data: AirplaneSectionData): string {
  // Ensure import exists
  let updatedCode = ensureImport(
    code,
    'AirplaneSection',
    '@/app/Templates/airplaneSection'
  );

  // Find BaseTemplate opening tag
  const baseTemplateMatch = updatedCode.match(/<BaseTemplate[^>]*>/);
  if (!baseTemplateMatch || baseTemplateMatch.index === undefined) {
    console.warn('BaseTemplate not found in code');
    return updatedCode;
  }

  // Find the position right after BaseTemplate opening tag
  const baseTemplateStart = baseTemplateMatch.index;
  const baseTemplateEnd = baseTemplateStart + baseTemplateMatch[0].length;

  // Generate the component JSX with proper indentation
  const componentJSX = generateAirplaneSectionJSX(data);
  const indentedJSX = componentJSX
    .split('\n')
    .map((line) => '      ' + line)
    .join('\n');

  // Insert the component right after BaseTemplate opening tag
  const beforeBaseTemplate = updatedCode.slice(0, baseTemplateEnd);
  const afterBaseTemplate = updatedCode.slice(baseTemplateEnd);

  // Ensure proper spacing - add newline after opening tag if needed
  const trimmedAfter = afterBaseTemplate.trimStart();
  const needsNewline = trimmedAfter.length > 0 && !afterBaseTemplate.startsWith('\n');
  const spacing = needsNewline ? '\n' : (afterBaseTemplate.startsWith('\n') ? '' : '\n');

  return beforeBaseTemplate + spacing + indentedJSX + '\n' + afterBaseTemplate;
}

/**
 * Insert HotelsSection component at the top of BaseTemplate content
 */
export function insertHotelsSection(code: string, data: HotelsSectionData): string {
  // Ensure import exists
  let updatedCode = ensureImport(
    code,
    'HotelsSection',
    '@/app/Templates/HotelsSection'
  );

  // Find BaseTemplate opening tag
  const baseTemplateMatch = updatedCode.match(/<BaseTemplate[^>]*>/);
  if (!baseTemplateMatch || baseTemplateMatch.index === undefined) {
    console.warn('BaseTemplate not found in code');
    return updatedCode;
  }

  // Find the position right after BaseTemplate opening tag
  const baseTemplateStart = baseTemplateMatch.index;
  const baseTemplateEnd = baseTemplateStart + baseTemplateMatch[0].length;

  // Generate the component JSX with proper indentation
  const componentJSX = generateHotelsSectionJSX(data);
  const indentedJSX = componentJSX
    .split('\n')
    .map((line) => '      ' + line)
    .join('\n');

  // Insert the component right after BaseTemplate opening tag
  const beforeBaseTemplate = updatedCode.slice(0, baseTemplateEnd);
  const afterBaseTemplate = updatedCode.slice(baseTemplateEnd);

  // Ensure proper spacing - add newline after opening tag if needed
  const trimmedAfter = afterBaseTemplate.trimStart();
  const needsNewline = trimmedAfter.length > 0 && !afterBaseTemplate.startsWith('\n');
  const spacing = needsNewline ? '\n' : (afterBaseTemplate.startsWith('\n') ? '' : '\n');

  return beforeBaseTemplate + spacing + indentedJSX + '\n' + afterBaseTemplate;
}

