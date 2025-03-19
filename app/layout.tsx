import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import Script from "next/script"
import type { Metadata } from "next"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Image Compressor - Reduce Image Size Without Losing Quality",
  description:
    "Free online tool to compress and optimize your JPG, PNG, and WebP images while maintaining quality. Reduce file size by up to 80% for faster website loading.",
  keywords:
    "image compression, compress images, image optimizer, reduce image size, image compressor, photo compression, picture compressor, optimize images, compress jpg, compress png, compress webp",
  authors: [{ name: "Image Compressor Tool" }],
  creator: "Image Compressor Tool",
  publisher: "Image Compressor Tool",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://your-domain.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Image Compressor - Reduce Image Size Without Losing Quality",
    description:
      "Free online tool to compress and optimize your JPG, PNG, and WebP images while maintaining quality. Reduce file size by up to 80% for faster website loading.",
    url: "https://your-domain.com",
    siteName: "Image Compressor Tool",
    images: [
      {
        url: "https://your-domain.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Image Compressor Tool Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Image Compressor - Reduce Image Size Without Losing Quality",
    description:
      "Free online tool to compress and optimize your JPG, PNG, and WebP images while maintaining quality. Reduce file size by up to 80% for faster website loading.",
    images: ["https://your-domain.com/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google-site-verification-code",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <Script id="schema-script" type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Image Compressor Tool",
              "url": "https://your-domain.com",
              "description": "Free online tool to compress and optimize your JPG, PNG, and WebP images while maintaining quality. Reduce file size by up to 80% for faster website loading.",
              "applicationCategory": "UtilityApplication",
              "operatingSystem": "Any",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "featureList": "Compress JPG, Compress PNG, Compress WebP, Maintain Image Quality, Reduce File Size",
              "screenshot": "https://your-domain.com/og-image.jpg",
              "softwareHelp": "https://your-domain.com/faq",
              "author": {
                "@type": "Organization",
                "name": "Image Compressor Tool",
                "url": "https://your-domain.com"
              }
            }
          `}
        </Script>
      </body>
    </html>
  )
}



import './globals.css'