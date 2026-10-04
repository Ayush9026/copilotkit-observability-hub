"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import "@copilotkit/react-core/v2/styles.css";
import { CopilotKitProvider } from "@copilotkit/react-core/v2";

const inter = Inter({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.className} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">
        {/* In v2 the inspector is controlled by the provider — no need to mount
            <CopilotKitInspector /> yourself. "auto" restricts the overlay to
            localhost, so it won't show in production. */}
        <CopilotKitProvider
          runtimeUrl="/api/copilotkit"
          showDevConsole="auto"
        >
          {children}
        </CopilotKitProvider>
      </body>
    </html>
  );
}
