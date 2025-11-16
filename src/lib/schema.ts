export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Bricks Store",
    description:
      "Loja especializada em blocos de montar e minifiguras colecionáveis",
    url: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
    logo: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/assets/header.jpeg`,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      availableLanguage: ["Portuguese"],
    },
    sameAs: [
      // Adicione suas redes sociais aqui
      // "https://www.facebook.com/bricksstore",
      // "https://www.instagram.com/bricksstore",
      // "https://twitter.com/bricksstore"
    ],
  };
}

export function generateWebSiteSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Bricks Store",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/produtos?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.url}`,
    })),
  };
}

export function generateProductSchema(product: {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrls: string[];
  stock: number;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.imageUrls[0] || `${baseUrl}/assets/header.jpeg`,
    sku: product.id.toString(),
    offers: {
      "@type": "Offer",
      url: `${baseUrl}/produto/${product.id}`,
      priceCurrency: "BRL",
      price: product.price.toFixed(2),
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Bricks Store",
      },
    },
  };
}

export function generateLocalBusinessSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: "Bricks Store",
    description:
      "Loja online especializada em blocos de montar e minifiguras colecionáveis",
    url: baseUrl,
    logo: `${baseUrl}/assets/header.jpeg`,
    priceRange: "R$ 30 - R$ 500",
    paymentAccepted: ["Credit Card", "Debit Card", "PIX", "Boleto"],
    currenciesAccepted: "BRL",
  };
}
