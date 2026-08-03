export interface QuizItem {
  question: string;
  options: string[];
  correctIdx: number;
  explanation?: string;
}

export interface LessonItem {
  id: string;
  slug: string;
  pathSlug: string;
  title: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Easy" | "Medium" | "Hard";
  duration: string;
  objectives: string[];
  prerequisites: string[];
  download?: string;
  content: string; // MDX content body
  quiz?: QuizItem[];
}

export interface LearningPath {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Easy" | "Medium" | "Hard";
  duration: string;
  lessons: string[]; // Order list of lesson slugs
  lessonsCount: number;
}
