import { NextResponse } from "next/server";
import { getAllPrompts } from "@/lib/prompts";

export async function GET() {
  try {
    const prompts = await getAllPrompts();
    return NextResponse.json(prompts);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch prompts" }, { status: 500 });
  }
}
