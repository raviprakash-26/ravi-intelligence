import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const { type, slug, category } = await req.json();

    if (!type || !slug) {
      return NextResponse.json({ error: "Missing required type or slug parameters." }, { status: 400 });
    }

    const catDir = (category || "general").toLowerCase().split(" ").join("-");
    let relativeDir = "";

    switch (type) {
      case "article":
        relativeDir = `content/articles/${catDir}`;
        break;
      case "resource":
        relativeDir = `content/resources/${catDir}`;
        break;
      case "prompt":
        relativeDir = `content/prompts/${catDir}`;
        break;
      default:
        return NextResponse.json({ error: "Unsupported content category type." }, { status: 400 });
    }

    const fullPath = path.join(process.cwd(), relativeDir, `${slug}.mdx`);

    const isDev = process.env.NODE_ENV === "development";

    if (isDev) {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return NextResponse.json({ success: true, message: `Deleted file: ${relativeDir}/${slug}.mdx` });
      }
      return NextResponse.json({ error: "Target file does not exist on disk." }, { status: 404 });
    } else {
      return NextResponse.json({
        success: true,
        message: "Simulation Success: File removed from memory preview index.",
        previewOnly: true,
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete file." }, { status: 500 });
  }
}
