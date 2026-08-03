export interface PromptVariable {
  name: string;
  placeholder: string;
}

export interface PromptItem {
  id: string;
  title: string;
  slug: string;
  platform: string;
  category: string;
  description: string;
  prompt: string;
  variables: PromptVariable[];
  exampleInput?: string;
  exampleOutput?: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Easy" | "Medium" | "Hard";
  tags: string[];
  author: string;
  publishedAt: string;
  updatedAt: string;
  featured: boolean;
  free: boolean;
  price?: number;
  content: string; // MDX content body
  previewImage?: string;
  coverImage: string;
}
