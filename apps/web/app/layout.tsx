import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "../styles/theme.css";
import "./globals.css";
import { Providers } from "./providers";
import { getDirection } from "@/i18n/routing";
import type { Locale } from "@/i18n/routing";

// Fonts are self-hosted from ./fonts (SIL OFL, see ./fonts/OFL-*.txt) rather
// than fetched from Google at build time via next/font/google. That loader
// crashes intermittently: Google sometimes serves subset URLs without a file
// extension (https://fonts.gstatic.com/l/font?kit=...&skey=...&v=v21), and
// Next derives the output extension with a regex that returns null for them,
// failing the build with "Cannot read properties of null (reading '1')".
// The bug is unfixed in next@15.5.27 and next@16.3.8, so vendoring is the fix.
//
// unicode-range is declared explicitly because next/font/local has no
// `subsets` option. Without it the browser picks a face by weight alone, and
// the latin face would claim the Arabic block, rendering Arabic as tofu.

const ebGaramond = localFont({
  src: [
    { path: "./fonts/eb-garamond-latin-400-normal.woff2", weight: "400" },
    { path: "./fonts/eb-garamond-latin-500-normal.woff2", weight: "500" },
    { path: "./fonts/eb-garamond-latin-600-normal.woff2", weight: "600" },
    { path: "./fonts/eb-garamond-latin-700-normal.woff2", weight: "700" },
  ],
  variable: "--font-english",
  display: "swap",
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0000, U+000D, U+0020-007E, U+00A0-00FF, U+0102, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+2002, U+2009, U+200B, U+2013-2014, U+2018-201A, U+201C-201E, U+2022, U+2026, U+2032-2033, U+2039-203A, U+2044, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD, U+FFFF",
    },
  ],
});

const cormorant = localFont({
  src: [
    { path: "./fonts/cormorant-garamond-latin-400-normal.woff2", weight: "400" },
    {
      path: "./fonts/cormorant-garamond-latin-500-normal.woff2",
      weight: "500",
    },
    {
      path: "./fonts/cormorant-garamond-latin-600-normal.woff2",
      weight: "600",
    },
    {
      path: "./fonts/cormorant-garamond-latin-700-normal.woff2",
      weight: "700",
    },
  ],
  variable: "--font-display",
  display: "swap",
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0020-007E, U+00A0-00B4, U+00B6-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+2002, U+2009, U+200B, U+2013-2014, U+2018-201A, U+201C-201E, U+2022, U+2026, U+2032-2033, U+2039-203A, U+2044, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFF",
    },
  ],
});

const ibmPlexMono = localFont({
  src: [
    { path: "./fonts/ibm-plex-mono-latin-400-normal.woff2", weight: "400" },
    { path: "./fonts/ibm-plex-mono-latin-500-normal.woff2", weight: "500" },
  ],
  variable: "--font-mono",
  display: "swap",
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0000, U+000D, U+0020-007E, U+00A0-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+2013-2014, U+2018-201A, U+201C-201E, U+2022, U+2026, U+2032-2033, U+2039-203A, U+2044, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FFFF",
    },
  ],
});

// Manrope ships as a single variable font covering wght 200-800, so one file
// replaces the four static weights the Google loader used to download.
const manrope = localFont({
  src: [
    { path: "./fonts/manrope-latin-wght-normal.woff2", weight: "200 800" },
  ],
  variable: "--font-manrope",
  display: "swap",
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+000D, U+0020-007E, U+00A0-00FF, U+0102, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2013-2014, U+2018-201A, U+201C-201E, U+2022, U+2026, U+2039-203A, U+2044, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FFFF",
    },
  ],
});

// Amiri needs two calls: next/font/local applies `declarations` uniformly to
// every file in `src`, so arabic and latin cannot share one call. Both declare
// the same explicit font-family (rather than a hashed one) so the two
// @font-face groups merge into a single family and the shared --font-arabic
// variable resolves to both; the differing unicode-range tells the browser
// which to use per character.
const amiriArabic = localFont({
  src: [
    { path: "./fonts/amiri-arabic-400-normal.woff2", weight: "400" },
    { path: "./fonts/amiri-arabic-700-normal.woff2", weight: "700" },
  ],
  variable: "--font-arabic",
  display: "swap",
  declarations: [
    { prop: "font-family", value: '"Amiri"' },
    {
      prop: "unicode-range",
      value:
        "U+0020-0021, U+0028, U+00A0, U+0600-0604, U+0606-06FF, U+0750-077F, U+0890-0891, U+08A0, U+08AC, U+08B6-08BD, U+08D1, U+08E4-08FE, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FBC1, U+FBD3-FD3F, U+FD50-FD8F, U+FD92-FDC7, U+FDF0-FDFD, U+FE70-FE72, U+FE74, U+FE76-FEFC, U+FFFF, U+1EE00-1EE03, U+1EE05-1EE1F, U+1EE21-1EE22, U+1EE24, U+1EE27, U+1EE29-1EE32, U+1EE34-1EE37, U+1EE39, U+1EE3B, U+1EE42, U+1EE47, U+1EE49, U+1EE4B, U+1EE4D-1EE4F, U+1EE51-1EE52, U+1EE54, U+1EE57, U+1EE59, U+1EE5B-1EE5D, U+1EE5F, U+1EE61-1EE62, U+1EE64, U+1EE67-1EE6A, U+1EE6C-1EE72, U+1EE74, U+1EE77, U+1EE79-1EE7C, U+1EE7E, U+1EE80-1EE89, U+1EE8B-1EE9B, U+1EEA1-1EEA3, U+1EEA5-1EEA9, U+1EEAB-1EEBB, U+1EEF0-1EEF1",
    },
  ],
});

const amiriLatin = localFont({
  src: [
    { path: "./fonts/amiri-latin-400-normal.woff2", weight: "400" },
    { path: "./fonts/amiri-latin-700-normal.woff2", weight: "700" },
  ],
  variable: "--font-arabic",
  display: "swap",
  declarations: [
    { prop: "font-family", value: '"Amiri"' },
    {
      prop: "unicode-range",
      value:
        "U+0020-007E, U+00A0-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0300-0301, U+0303-0304, U+0308, U+0323, U+2002, U+2009, U+200B, U+2013-2014, U+2018-201A, U+201C-201E, U+2022, U+2026, U+2032-2033, U+2039-203A, U+2044, U+20AC, U+2212, U+2215, U+FEFF, U+FFFF",
    },
  ],
});

export const metadata: Metadata = {
  title: "Dadan",
  description: "Private luxury digital jewelry ownership",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = (await getLocale()) as Locale;
  const messages = await getMessages();
  const dir = getDirection(locale);

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${ebGaramond.variable} ${cormorant.variable} ${ibmPlexMono.variable} ${amiriArabic.variable} ${amiriLatin.variable} ${manrope.variable}`}
    >
      <body className={locale === "ar" ? "font-arabic" : "font-manrope"}>
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
