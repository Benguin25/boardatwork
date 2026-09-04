import type { Metadata } from "next";
import { ShellProvider } from "@/components/shell/ShellProvider";
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
      <body>
        <ShellProvider>{children}</ShellProvider>
      </body>
    </html>
  );
}
