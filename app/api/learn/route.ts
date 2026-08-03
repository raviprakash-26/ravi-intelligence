import { NextResponse } from "next/server";
import { getAllPaths, getLessonsForPath } from "@/lib/learn";

export async function GET() {
  try {
    const paths = await getAllPaths();
    
    // Fetch all lessons for all paths to map in search index
    const pathsWithLessons = await Promise.all(
      paths.map(async (pathConfig) => {
        const lessons = await getLessonsForPath(pathConfig.slug);
        return {
          ...pathConfig,
          lessonsList: lessons.map((l) => ({
            slug: l.slug,
            title: l.title,
            difficulty: l.difficulty,
            duration: l.duration,
          })),
        };
      })
    );

    return NextResponse.json(pathsWithLessons);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch learning paths" }, { status: 500 });
  }
}
