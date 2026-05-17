import type { Metadata } from "next";
import { fraunces, inter } from "./fonts";
import "./globals.css";
import { LenisProvider } from "@/app/components/lenis-provider";

export const metadata: Metadata = {
  title: "bro, your always-on AI agent",
  description:
    "the bridge to jabby. talk to it, watch its mind grow, let it trade.",
  applicationName: "bro",
  authors: [{ name: "Matthew Kim" }, { name: "Silas Wu" }],
  metadataBase: new URL("https://bro.kalilabs.ai"),
  openGraph: {
    title: "bro, your always-on AI agent",
    description:
      "the bridge to jabby. talk to it, watch its mind grow, let it trade.",
    siteName: "bro",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} h-full`}
    >
      <body className="min-h-full antialiased">
        <LenisProvider>{children}</LenisProvider>
      </body>
    </html>
  );
}
