import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { LearningPath, LessonItem } from "@/types";

const learnDirectory = path.join(process.cwd(), "content/learn");

export async function getAllPaths(): Promise<LearningPath[]> {
  if (!fs.existsSync(learnDirectory)) {
    fs.mkdirSync(learnDirectory, { recursive: true });
  }

  const subdirs = fs.readdirSync(learnDirectory).filter((file) => {
    const filePath = path.join(learnDirectory, file);
    return fs.statSync(filePath).isDirectory();
  });

  const paths: LearningPath[] = [];

  subdirs.forEach((dir) => {
    const configPath = path.join(learnDirectory, dir, "path.json");
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, "utf-8");
      try {
        const configData = JSON.parse(configContent);
        paths.push({
          id: configData.id || dir,
          slug: configData.slug || dir,
          title: configData.title || "Untitled Path",
          description: configData.description || "",
          category: configData.category || "General",
          difficulty: configData.difficulty || "Beginner",
          duration: configData.duration || "Self-paced",
          lessons: configData.lessons || [],
          lessonsCount: (configData.lessons || []).length,
        });
      } catch (err) {
        console.error(`Error parsing path config in ${configPath}:`, err);
      }
    }
  });

  return paths;
}

export async function getPathBySlug(slug: string): Promise<LearningPath | null> {
  const allPaths = await getAllPaths();
  return allPaths.find((p) => p.slug === slug) || null;
}

export async function getLessonsForPath(pathSlug: string): Promise<LessonItem[]> {
  const pathConfig = await getPathBySlug(pathSlug);
  if (!pathConfig) return [];

  const pathFolder = path.join(learnDirectory, pathSlug);
  const lessons: LessonItem[] = [];

  pathConfig.lessons.forEach((lessonSlug) => {
    // Try .mdx first, then .md
    let filePath = path.join(pathFolder, `${lessonSlug}.mdx`);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(pathFolder, `${lessonSlug}.md`);
    }

    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const { data, content } = matter(fileContent);

      lessons.push({
        id: data.id || lessonSlug,
        slug: lessonSlug,
        pathSlug: pathSlug,
        title: data.title || "Untitled Lesson",
        difficulty: data.difficulty || pathConfig.difficulty,
        duration: data.duration || "15 min",
        objectives: data.objectives || [],
        prerequisites: data.prerequisites || [],
        download: data.download || "",
        content: content,
        quiz: data.quiz || [],
      });
    }
  });

  return lessons;
}

export async function getLessonBySlug(pathSlug: string, lessonSlug: string): Promise<LessonItem | null> {
  const lessons = await getLessonsForPath(pathSlug);
  return lessons.find((l) => l.slug === lessonSlug) || null;
}
