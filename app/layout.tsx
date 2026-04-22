import "./globals.css";
import { ReactNode } from "react";
import { Sidebar } from "./components/Sidebar";
import layoutStyles from "./layout.module.css";

export const metadata = {
  title: "webdev-crm",
  description: "AI-assisted freelance web-dev CRM"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Sidebar />
        <main className={layoutStyles.main}>{children}</main>
      </body>
    </html>
  );
}
