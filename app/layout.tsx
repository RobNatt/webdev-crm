import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "webdev-crm",
  description: "AI-assisted freelance web-dev CRM"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
