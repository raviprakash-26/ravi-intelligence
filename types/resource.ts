export interface ResourceItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string; // MDX markup body
  coverImage: string;
  category: string;
  tags: string[];
  author: string;
  publishedAt: string;
  updatedAt: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Easy" | "Medium" | "Hard";
  free: boolean;
  price: number;
  fileSize: string;
  fileType: string;
  version: string;
  downloadsCount: number;
  previewImages: string[];
  features?: string[];
  whatsIncluded?: string[];
  requirements?: string[];
}
