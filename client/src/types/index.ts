export interface Skill {
  id: number;
  name: string;
  description: string;
  author: string;
  downloads: number;
  rating: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  version: string;
  license: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  avatar: string;
  role: 'user' | 'admin';
  createdAt: string;
  totalDownloads: number;
  totalSkills: number;
}

export interface SkillVersion {
  id: number;
  skillId: number;
  version: string;
  changelog: string;
  publishedAt: string;
  downloadCount: number;
}