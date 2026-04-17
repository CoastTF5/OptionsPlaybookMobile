import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Options Playbook Mirror",
  description: "Read-only mirror of the Options Playbook Overview.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-primary antialiased">{children}</body>
    </html>
  );
}
