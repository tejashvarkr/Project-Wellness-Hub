export interface User {
  id: string;
  email: string;
  full_name: string;
  username: string;
  points: number;
  created_at: string;
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  user_id: string;
  created_at: string;
  completions: HabitCompletion[];
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  completed_at: string;
  points_earned: number;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  currency?: string;
  user_id: string;
  created_at: string;
}

export interface MoodEntry {
  id: string;
  mood: number; // 1-5 scale
  note?: string;
  user_id: string;
  created_at: string;
}

export interface PomodoroSession {
  id: string;
  duration: number;
  completed: boolean;
  user_id: string;
  points_earned: number;
  created_at: string;
}

export interface Feedback {
  id: string;
  user_id?: string;
  rating: number; // 1-5 scale
  feedback: string;
  user_email?: string;
  user_name?: string;
  created_at: string;
}

export type Theme = 'light' | 'dark';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}