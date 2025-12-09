"use client";

import React, { useState } from 'react';

import BaseTemplate from '@/app/Templates/baseTemplate';

import SectionTemplate from '@/app/Templates/sectionTemplate';

import DynamicTableTemplate from '@/app/Templates/dynamicTableTemplate';

const DocumentViewer = () => {
  // Initial sections data
  const initialSections = [
    {
      "type": "section",
      "id": "section_1765200449140",
      "title": "Special Package 2025",
      "content": "7 nights/8 days in Azerbaijan. Brief program: \n-Day 1 – airport-hotel transfer.\n- Day 2 – Baku city tour.\n- Day 3 – Baku-Gabala transfer. Shamakhi on the way. \n-Day 4 – Gabala tour. \n-Day 5 – Gabala-Baku transfer. Gobustan on the way.\n -Day 6 – Absheron tour and shopping. \n-Day 7 - One day tour to Shahdag Mountain resort. \n-Day 8 – Hotel-airport transfer.",
      "order": 0,
      "parent_id": null
    },
    {
      "type": "section",
      "id": "section_1765200449140",
      "title": "Day-01 – Arrival day",
      "content": "Arrival to Baku city. Meet & Greet at the Airport by representative. Transfer to the hotel. Check-in at the hotel. Free time to enjoy the windy capital. Overnight stay in Baku.",
      "order": 1,
      "parent_id": null
    },
    {
      "type": "section",
      "id": "section_1765200449140",
      "title": "Day-02 – Baku city tour",
      "content": "Breakfast at the hotel. Excursion day (pick-up at 10:00). Visiting Highland park – enjoying panoramic view to Baku. From there guests see Milli Majlis, Flame Towers building which become an icon of Baku. Using one way funicular to go down or up (1 ticket to funicular is included). Baku Boulevard – famous with its Ferris Wheel (works only if no wind), small reproduction of Little Venice (boat ride is included), Carpet museum and long way strolling along the Caspian sea. Old city – Icherisheher – the ancient city with hamams, local mosques, Maiden tower and Shirvanshah's Palace dated 12th century. Walking to Nizami Street which also the part of history and oil barons built beautiful buildings along this street. Also, guests may have shopping time in modern shops. Heydar Aliyev Centre - the unique building designed by famous architecture Zaha Hadid. Taking picture near \"I Love Baku\" is very popular among tourists, do not miss to take yours! Return to the hotel. Overnight stay in Baku.",
      "order": 2,
      "parent_id": null
    },
    {
      "type": "section",
      "id": "section_1765200449140",
      "title": "Day-03 – Transfer to Gabala. Shamakhi on the way",
      "content": "Breakfast at the hotel. Check-out from hotel. Transfer to Gabala (pick-up at 08:30, 4 hours way). On the way guests will pass Shamakhi Juma Mosque, which is one of the oldest mosques in Caucasus, it fundament is from 9th century. If guests would like to try local wine guests may stop at Meysari Winery, obtain information on wine traditions at the region and try 3 types of wine with snacks (extra cost for tour and degustation). If guests would like guests may visit very interesting farm where fluffy animals – alpacas – are living. Brought from South America this friendly animals fill themselves very comfortable in Shamakhi area (extra cost for entrance). Reaching Gabala. Check-in to the hotel. Free time. Overnight stay in Gabala.",
      "order": 3,
      "parent_id": null
    },
    {
      "type": "section",
      "id": "section_1765200449140",
      "title": "Day-04 – Gabala tour",
      "content": "Breakfast at the hotel. Excursion program (pick-up at 10:00). Visiting Yeddi Gozel Waterfall - this mountain waterfall is beautiful places to see, is situated in the Vandam village of Gabala. The name of the Seven Beauties (Yeddi Gozel) Waterfall comes from the name of the 7 mountain roads that should lead to the waterfall. Nohur Lake is one of the most fabulous locations in Gabala, with a spectacular look to the Caucasus mountains. The tourists are overwhelmed by Lake Nohur's majesty. The peaceful weather and sounds of birds provide an ideal environment for relaxing to avoid the noise. Tufandag Mountain Resort provides its guests with a natural setting with incomparable beauty and harmony. Built like a jewel in the crown of the surrounding mountains, Tufandag Mountain Resort is a must-see spot for nature lovers and sports enthusiasts alike. (2 line cable car ticket is included). Return to the hotel. Free time. Overnight stay in Gabala.",
      "order": 4,
      "parent_id": null
    },
    {
      "type": "section",
      "id": "section_1765200449140",
      "title": "Day-05 – Transfer to Baku",
      "content": "Breakfast at the hotel. Check-out from Gabala by 09:00. Way to Baku (around 4 hours way). Gobustan tour - From prehistoric rock art to musical stones, the Azerbaijani people's age-old past is dramatically brought to life in the UNESCO- listed Gobustan Reserve, where an astonishing collection of over 6,000 ancient petroglyphs chart ways of life dating back as far as 40,000 years. (ticket is included). Mud volcanos - The area around Baku is home to numerous mud volcanoes, considered one of the world's most unique natural phenomenon. Known for their bubbling mud, they sometimes seem ready to erupt. Approximately 400 of them have been recorded in Azerbaijan. (mud volcanos taxi is included). Reaching Baku, check-in to the hotel. Free time. Overnight stay in Baku.",
      "order": 5,
      "parent_id": null
    },
    {
      "type": "section",
      "id": "section_1765200449140",
      "title": "Day-06 – Absheron tour and shopping",
      "content": "Breakfast at the hotel. Excursion day (pick-up at 10:00). Absheron tour – today you will visit Fire Temple (Ateshgah) and Fire Mountain (Yanardag). Fire Temple (Ateshgah) - Ateshgah Fire Temple in the village of Surakhani has been attracting crowds of thrill seekers. Built in the 17th–18th centuries around naturally burning flames which were previously worshipped by Zoroastrians, the site was then an important place of pilgrimage for fire-worshipping Hindus until the 1880s. Today it houses a well-designed museum (combo ticket is included). Yanardag, the Burning Mountain in Mammadli village where a 10-metre wall of flames blazes day and night at the base of a hillside. These natural flames were described by Marco Polo in the 13th century and continue to mesmerize those who visit the site. Today you can learn all about them at the beautifully arranged new museum complex (combo ticket is included). Return to Baku. Shopping time – visiting local bazaar (Yashil Bazaar), shopping mall – Ganjlik Mall or Daniz Mall. Return to the hotel. Overnight stay in Baku.",
      "order": 6,
      "parent_id": null
    },
    {
      "type": "section",
      "id": "section_1765200449141",
      "title": "Day-07 – One day tour to Shahdag Mountain Resort",
      "content": "Breakfast at the hotel. Day in Shahdag (pick-up at 09:00, 3 hours way). Way to Shahdag Mountain resort – here guests may use different types of activities: cable car, Zip Line, Rolling Coaster, buggy cars (All with extra cost except 1 ticket to Shahdag cable car is included). Spending day in Shahdag till 17:00. Way to Baku (around 3 hours). Reaching Baku. Overnight stay in Baku.",
      "order": 7,
      "parent_id": null
    },
    {
      "type": "section",
      "id": "section_1765200449141",
      "title": "Day-08 – Departure",
      "content": "Breakfast at the hotel. Check-out. Transfer to Heydar Aliyev International airport (pick-up from Baku hotel 3 hours before departure).",
      "order": 8,
      "parent_id": null
    },
    {
      "type": "section",
      "id": "section_1765200449141",
      "title": "INCLUDED:",
      "content": "Accommodation – 5 nights in Baku at chosen hotel/2 night in Gabala. Delicious continental breakfast. Transportation from/to airport and within mentioned tours with mentioned car types. English speaking driver (not guide). Entrances: Funicular, boat at Little Venice, Cable car in Tufandag (2 lines), Cable car in Shahdag (1 line), Fire Temple and Fire Mountain, Gobustan, Taxi to mud volcanos. Water (2 bottles per person per day).",
      "order": 9,
      "parent_id": null
    },
    {
      "type": "section",
      "id": "section_1765200449141",
      "title": "EXCLUDED:",
      "content": "Lunches and dinners (supplement cost is mentioned below). Any other entrances. Visas – 38 USD per person. Insurance. Early check-in/late check-out. Air tickets. Separate guide during tour days – highly recommend taking guide with sprinter bus, supplement – 540 USD for whole package!",
      "order": 10,
      "parent_id": null
    },
    {
      "type": "section",
      "id": "section_1765200449141",
      "title": "SUPPLEMENT COSTS:",
      "content": "Half day car usage on the day of arrival (3-4 hours) – sedan – 35 USD; minivan –50 USD (price per car). Meals at Indian restaurant: lunch – 15 USD per person; dinner – 18 USD per person. Car will be maximum till 21:30. If guests would like to stay longer they can return with taxi. Meals in local restaurant: lunch – 25 USD per person; dinner – 45 USD per person. Car will be maximum till 21:30. If guests would like to stay longer they can return with taxi. Additional entrances costs which guests might want to visit within program: In Baku: Carpet museum – 7 USD per person. Shirvanshah's Palace – 11 USD per person. Maiden Tower – 11 USD per person. Heydar Aliyev Center – 11 USD per person; Classic cars museum at H. Aliyev Centre – 7 USD per person. Modern Art Museum – 5 USD per person. Surakhani Ship museum – 5 USD per person. Miniature books museum – free of charge. In Shamakhi: Diri Baba Mausoleum – 7 USD per person. Meysari Wine tour (without degustation) – 10 USD per person. With degustation (tour+degustation together) – up to 2 pax – 46 USD per person; 3-5 pax – 30 USD per person; 6-15 pax – 18 USD per person. Alpaca Farm – 1 pax – 55 USD per person; 2 pax – 26 USD per person; 3-5 pax – 23 USD per person; 6-15 pax – 16 USD per person. In Gabala: Catamaran at Nohur Lake – 5 USD per person. 10 bullets at Gabala Shooting Centre – 18 USD per person. 10 min swings at Tufandag Resort – 15 USD per person. In Shahdag: Roller Coaster – 16 USD per person. Zip Line – 15 USD per person. Snow mobile (30 minutes) – 30 USD per person.",
      "order": 11,
      "parent_id": null
    },
    {
      "type": "section",
      "id": "section_1765200449141",
      "title": "SPECIAL NOTES:",
      "content": "Note on museums – mainly museums are working from Tuesday till Sunday from 10:00 till 18:00 (last ticket is sold at 17:30). Surakhani Ship museum does not work on Tuesday too. Cable car and other services in Tufandag are available til 17:00. In Shahdag there is no Indian restaurants, only local! There might be closures/or technical problems due to that any of the museum will not operate, we are not taking responsibility for it. Company has right to change the program in case if necessity. We do not keep any block at the hotels, so please always check availability before confirming to your customers. Some hotels require deposit amount which is refundable and is returned to the guests upon check-out. Black-out dates – 16-24.09 (F1 period), 25.09-05.10 (in region only), 17-28.11 (Sport event). Please do not offer same prices to your customers and recheck with us. During payment process the partner should bear all bank charges referred to his country.",
      "order": 12,
      "parent_id": null
    }
  ];

  const initialTables = [{
    "type": "table",
    "id": "table_1",
    "columns": [
      "Package option",
      "Hotels",
      "Single person",
      "2 pax (PP in DBL)",
      "3 pax (PP in Triple)",
      "4 pax (PP in DBL)",
      "5 pax (PP in Triple)",
      "6 pax (PP in DBL)",
      "7 pax (PP in Triple)",
      "8 pax (PP in DBL)",
      "9 pax (PP in Triple)",
      "10 pax (PP in DBL)"
    ],
    "rows": [
      ["Option 1", "3*/Gabala City 3*", "808", "444", "383", "372", "366", "364", "355", "342", "335", "319"],
      ["Option 1 Econom Class", "4*/Hill Chalet 4*", "1045", "577", "503", "494", "489", "486", "475", "475", "453", "452"],
      ["Option 1 Standard Class", "4*/Hill Chalet 4*", "1104", "628", "541", "540", "539", "537", "525", "526", "494", "503"],
      ["Option 2 Middle Class", "4*/Hill Chalet 4* Hyatt Regency 5*/Qafqaz", "1104", "612", "551", "530", "528", "524", "516", "510", "493", "487"],
      ["Option 1 Middle Class", "5*/Qafqaz Riverside 5*", "1556", "865", "776", "770", "768", "767", "762", "759", "744", "741"],
      ["Option 2 Premium Class", "Baku 5*/Qafqaz Riverside 5*", "1825", "993", "922", "911", "905", "902", "894", "891", "871", "868"]
    ],
    "order": 0,
    "section_id": null
  },
  {
    "type": "table",
    "id": "table_1765210190782",
    "columns": ["name", "age"],
    "rows": [
      ["mariam ahmed", "15"],
      ["abdallah", "21"]
    ],
    "order": 0,
    "section_id": null
  }];

  // State to manage sections (allows text splitting to work)
  const [sections, setSections] = useState(initialSections);
  const [tables] = useState(initialTables);

  // Handle content change for a section (required for text splitting)
  const handleContentChange = (sectionId: string | undefined, index: number, newContent: string) => {
    setSections(prevSections => {
      const updated = [...prevSections];
      if (sectionId) {
        const sectionIndex = updated.findIndex(s => s.id === sectionId);
        if (sectionIndex !== -1) {
          updated[sectionIndex] = { ...updated[sectionIndex], content: newContent };
        }
      } else {
        // Fallback to index if no ID
        if (updated[index]) {
          updated[index] = { ...updated[index], content: newContent };
        }
      }
      return updated;
    });
  };

  return (
    <BaseTemplate>
      {sections.map((section, index) => (
        <SectionTemplate 
          key={section.id || `section-${index}`}
          title={section.title || ""}
          content={section.content || ""}
          editable={true}
          onContentChange={(newContent) => {
            handleContentChange(section.id, index, newContent);
          }}
        />
      ))}

      {tables.map((table, index) => (
        <DynamicTableTemplate
          key={table.id || `table-${index}`}
          columns={table.columns || []}
          rows={table.rows || []}
        />
      ))}
    </BaseTemplate>
  );
};

export default DocumentViewer;

