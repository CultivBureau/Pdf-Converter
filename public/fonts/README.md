# Fonts Directory

This directory contains local font files for PDF generation.

## Required Fonts

### Cairo Font (Arabic Support)

Download Cairo font files and place them here:

- `Cairo-Regular.woff2` - Regular weight (400)
- `Cairo-Bold.woff2` - Bold weight (700)

**Download from:**
- Google Fonts: https://fonts.google.com/specimen/Cairo
- Or use: `npx google-webfonts-downloader Cairo`

**Conversion to WOFF2:**
If you have TTF files, convert them using:
```bash
# Using fonttools (pip install fonttools[woff])
pyftsubset Cairo-Regular.ttf --output-file=Cairo-Regular.woff2 --flavor=woff2
pyftsubset Cairo-Bold.ttf --output-file=Cairo-Bold.woff2 --flavor=woff2
```

### Optional: IBM Plex Arabic

If you want to use IBM Plex Arabic as a fallback:

- `IBMPlexArabic-Regular.woff2`
- `IBMPlexArabic-Bold.woff2`

**Download from:**
- IBM Plex: https://www.ibm.com/plex/

## Font Loading

Fonts are loaded via `/src/app/pdf/document/[id]/fonts.css` with proper fallback strategy to prevent tofu (□□□) characters.

