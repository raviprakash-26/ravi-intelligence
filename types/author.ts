export interface Author {
  id: string;
  name: string;
  avatar: string;
  role: string;
  bio: string;
  social?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
  };
}
