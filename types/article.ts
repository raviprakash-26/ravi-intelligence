import { Author } from "./author";

export interface MdxArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string; // parsed MDX code or markdown body
  coverImage: string;
  category: string;
  tags: string[];
  publishedAt: string;
  lastUpdated?: string;
  difficulty?: "Beginner" | "Intermediate" | "Advanced" | "Easy" | "Medium" | "Hard";
  download?: string;
  author: Author;
  readingTime: number;
  featured?: boolean;
  editorPick?: boolean;
}
