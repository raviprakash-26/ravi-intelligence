import * as React from "react";

interface BreadcrumbItem {
  name: string;
  item: string;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ravi-intelligence.com";

export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Ravi Intelligence",
    "url": siteUrl,
    "logo": `${siteUrl}/favicon.ico`,
    "sameAs": [
      "https://twitter.com/ravi_intelligence",
      "https://linkedin.com/company/ravi-intelligence"
    ],
    "description": "India's most trusted learning platform for Analytics, AI, Accounting, Finance, Tech, and Career Development."
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function ArticleSchema({
  title,
  description,
  coverImage,
  datePublished,
  authorName,
  url
}: {
  title: string;
  description: string;
  coverImage: string;
  datePublished: string;
  authorName: string;
  url: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": title,
    "image": [coverImage],
    "datePublished": datePublished,
    "dateModified": datePublished,
    "author": [{
      "@type": "Person",
      "name": authorName,
      "url": siteUrl
    }],
    "description": description,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function ProductSchema({
  name,
  description,
  image,
  price,
  sku,
  url
}: {
  name: string;
  description: string;
  image: string;
  price: number;
  sku: string;
  url: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": name,
    "image": [image],
    "description": description,
    "sku": sku,
    "brand": {
      "@type": "Brand",
      "name": "Ravi Intelligence"
    },
    "offers": {
      "@type": "Offer",
      "url": url,
      "priceCurrency": "INR",
      "price": price,
      "priceValidUntil": "2030-12-31",
      "availability": "https://schema.org/InStock",
      "itemCondition": "https://schema.org/NewCondition"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function BreadcrumbsSchema({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.item
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
