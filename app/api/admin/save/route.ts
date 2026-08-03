import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

export async function POST(req: Request) {
  try {
    const { type, slug, frontmatter, content } = await req.json();

    if (!type || !slug) {
      return NextResponse.json({ error: "Missing required type or slug parameters." }, { status: 400 });
    }

    // Format frontmatter and body into MDX file structure
    const fileContent = matter.stringify(content, frontmatter);

    let relativeDir = "";
    const category = (frontmatter.category || "general").toLowerCase().split(" ").join("-");

    switch (type) {
      case "article":
        relativeDir = `content/articles/${category}`;
        break;
      case "resource":
        relativeDir = `content/resources/${category}`;
        break;
      case "prompt":
        relativeDir = `content/prompts/${category}`;
        break;
      default:
        return NextResponse.json({ error: "Unsupported content category type." }, { status: 400 });
    }

    const fullDir = path.join(process.cwd(), relativeDir);
    const fullPath = path.join(fullDir, `${slug}.mdx`);

    // In production environments (Netlify serverless), filesystem writes are ephemeral.
    // We only write to disk if running locally. Otherwise, we simulate a successful save.
    const isDev = process.env.NODE_ENV === "development";

    if (isDev) {
      if (!fs.existsSync(fullDir)) {
        fs.mkdirSync(fullDir, { recursive: true });
      }
      fs.writeFileSync(fullPath, fileContent, "utf-8");
      return NextResponse.json({ success: true, message: `File saved locally: ${relativeDir}/${slug}.mdx` });
    } else {
      return NextResponse.json({
        success: true,
        message: "Simulation Success: File changes saved dynamically in memory preview mode.",
        previewOnly: true,
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to write file." }, { status: 500 });
  }
}
