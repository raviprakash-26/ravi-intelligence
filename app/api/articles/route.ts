import { NextResponse } from "next/server";
import { getAllArticles } from "@/lib/content";

export async function GET() {
  try {
    const articles = await getAllArticles();
    return NextResponse.json(articles);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 });
  }
}
