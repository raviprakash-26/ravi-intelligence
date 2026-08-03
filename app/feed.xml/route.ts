import { NextResponse } from "next/server";
import { getAllArticles } from "@/lib/content";

export async function GET() {
  try {
    const articles = await getAllArticles();

    const rssXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Ravi Intelligence Blog Feed</title>
  <link>https://ravi-intelligence.com</link>
  <description>Structured analytics schemas, SQL indexing guidelines, and Power BI dashboards.</description>
  <language>en-us</language>
  <atom:link href="https://ravi-intelligence.com/feed.xml" rel="self" type="application/rss+xml" />
  ${articles
    .slice(0, 10)
    .map((art) => `
    <item>
      <title>${escapeXml(art.title)}</title>
      <link>https://ravi-intelligence.com/blog/${art.slug}</link>
      <guid>https://ravi-intelligence.com/blog/${art.slug}</guid>
      <pubDate>${new Date(art.publishedAt).toUTCString()}</pubDate>
      <description>${escapeXml(art.excerpt || "")}</description>
    </item>`)
    .join("")}
</channel>
</rss>`;

    return new NextResponse(rssXml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "s-maxage=86400, stale-while-revalidate",
      },
    });
  } catch (error) {
    return new NextResponse("<error>Failed to compile feed</error>", {
      status: 500,
      headers: { "Content-Type": "application/xml" },
    });
  }
}

function escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case "\"": return "&quot;";
      default: return c;
    }
  });
}
