import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { CartProvider } from "@/contexts/cart-context";
import { FavoritesProvider } from "@/contexts/favorites-context";
import { Toaster } from "@/components/ui/toaster";
import Footer from "@/components/footer";
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateLocalBusinessSchema,
} from "@/lib/schema";

const GTM_ID = "GTM-WS47CHB8";
const META_PIXEL_ID = "852713473873525";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Bricks - Loja de Blocos de Montar e Minifiguras",
    template: "%s | Bricks",
  },
  description:
    "Descubra a melhor loja de blocos de montar e minifiguras colecionáveis. Sets exclusivos, personagens icônicos e os melhores preços do Brasil. Frete grátis acima de R$ 200.",
  keywords: [
    "blocos de montar",
    "minifiguras",
    "brinquedos",
    "colecionáveis",
    "sets",
    "lego compatível",
    "bricks",
    "construção",
    "presente",
    "hobby",
  ],
  authors: [{ name: "Bricks Store" }],
  creator: "Bricks Store",
  publisher: "Bricks Store",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Bricks - Loja de Blocos de Montar e Minifiguras",
    description:
      "Descubra a melhor loja de blocos de montar e minifiguras colecionáveis. Sets exclusivos, personagens icônicos e os melhores preços do Brasil.",
    url: "/",
    siteName: "Bricks Store",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/assets/header.jpeg",
        width: 1200,
        height: 630,
        alt: "Bricks - Loja de Blocos de Montar",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bricks - Loja de Blocos de Montar e Minifiguras",
    description:
      "Descubra a melhor loja de blocos de montar e minifiguras colecionáveis. Sets exclusivos e os melhores preços do Brasil.",
    images: ["/assets/header.jpeg"],
    creator: "@bricksstore",
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
    google: "seu-codigo-google-search-console",
    // yandex: 'codigo-yandex',
    // bing: 'codigo-bing',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = generateOrganizationSchema();
  const websiteSchema = generateWebSiteSchema();
  const localBusinessSchema = generateLocalBusinessSchema();

  return (
    <html lang="pt-BR">
      <head>
        {/* JSON-LD Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessSchema),
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        {/* Google Tag Manager - Script (immediately after <body>) */}
        <Script
          id="gtm"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${GTM_ID}');
            `,
          }}
        />
        {/* Google Tag Manager (noscript) (immediately after <body>) */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager */}

        {/* Meta Pixel Code */}
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${META_PIXEL_ID}');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
        {/* End Meta Pixel Code */}

        <FavoritesProvider>
          <CartProvider>
            <div className="flex-1">{children}</div>
            <Footer />
            <Toaster />
          </CartProvider>
        </FavoritesProvider>
      </body>
    </html>
  );
}
