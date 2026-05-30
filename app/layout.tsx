"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import "@copilotkit/react-core/v2/styles.css";
import { CopilotKitProvider, CopilotKitInspector } from "@copilotkit/react-core/v2";

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
        <CopilotKitProvider 
          runtimeUrl="/api/copilotkit"
          showDevConsole={true}
        >
          <CopilotKitInspector />
          {children}
        </CopilotKitProvider>
      </body>
    </html>
  );
}
