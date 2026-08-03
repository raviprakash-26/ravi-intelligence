import { NextResponse } from "next/server";
import { getAllResources } from "@/lib/resources";

export async function GET() {
  try {
    const resources = await getAllResources();
    return NextResponse.json(resources);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch resources" }, { status: 500 });
  }
}
