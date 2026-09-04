import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Board at Work",
  description: "Daily puzzle games that look like work.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
