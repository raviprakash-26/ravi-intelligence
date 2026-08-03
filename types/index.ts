export type Difficulty = "Beginner" | "Intermediate" | "Advanced" | "Easy" | "Medium" | "Hard";

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string[];
  publishedAt: string;
  author: {
    name: string;
    avatar: string;
    role: string;
    bio: string;
  };
  readingTime: number;
  featured?: boolean;
  editorPick?: boolean;
}

export interface NewsItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: "Technology" | "AI" | "Business" | "Indian Politics" | "Tamil Nadu Politics" | "Indian Cinema" | "Tamil Cinema" | "Hollywood";
  publishedAt: string;
  source: string;
  readingTime: number;
}

export interface Resource {
  id: string;
  slug: string;
  title: string;
  description: string;
  fileType: "XLSX" | "PBIX" | "PDF" | "ZIP" | "CSV";
  fileSize: string;
  downloadUrl: string;
  coverImage: string;
  downloadsCount: number;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  coverImage: string;
  features: string[];
  fileType: string;
  fileSize: string;
  type: "Template" | "Ebook" | "Course" | "ZIP Bundle";
  rating: number;
  reviewsCount: number;
}
export * from "./author";
export * from "./category";
export * from "./article";
export * from "./resource";
export * from "./learn";
export * from "./prompt";
