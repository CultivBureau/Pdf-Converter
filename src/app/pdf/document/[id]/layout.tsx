import { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDF Document",
  description: "PDF document view",
};

export default function PDFLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="pdf-document-body" style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}

