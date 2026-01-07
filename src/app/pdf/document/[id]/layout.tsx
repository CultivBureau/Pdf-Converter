import { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "PDF Document",
  description: "PDF document view",
};

// Configure viewport for mobile responsiveness
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function PDFLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Don't render html/body here - Next.js root layout already provides them
  // This layout is just for metadata and styling
  return (
    <div className="pdf-document-wrapper" style={{ margin: 0, padding: 0 }}>
      {children}
    </div>
  );
}

