export interface WeightFatEntry {
  id: string;
  date: string; // YYYY-MM-DD
  weight: number; // kg
  bodyFat: number; // %
  hydrationLevel: number; // calculated or tracked
}

export interface Workout {
  id: string;
  name: string;
  series: number;
  repetitions: number;
  weight?: number; // kg
  date?: string; // dd/mm/aaaa (optional)
  completed: boolean;
}

export interface PlanSet {
  reps: number;
  weight?: number;
}

export interface MealLog {
  id: string;
  name?: string;
  date: string; // YYYY-MM-DD
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  createdAt: string;
}

export interface DietSettings {
  targetCalories: number;
  targetProtein: number; // grams
  targetCarbs: number; // grams
  targetFat: number; // grams
  writtenDiet: string; // large text block
}

export interface DailyActivityLog {
  date: string; // YYYY-MM-DD
  steps: number;
  waterCups: number; // standard cups of 250ml
  stepGoal: number;
  waterGoal: number; // total ml or cups (let's use cups, default e.g. 10 cups)
}

export interface ReminderSettings {
  enableWaterReminders: boolean;
  enableStepReminders: boolean;
  waterInterval: number; // minutes
  stepInterval: number; // minutes
  pushNotifications: boolean;
}

export type TaskFilter = 'all' | 'today' | 'tomorrow' | 'week' | 'morning' | 'afternoon' | 'shopping' | 'none';

export type TaskPriority = 'low' | 'medium' | 'high' | 'none';

export type TaskRepeat = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'custom_days' | 'infinite';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  listId: string;
  title: string;
  description: string;
  completed: boolean;
  dueDate: string; // YYYY-MM-DD
  createdAt: string;
  filterTag: TaskFilter;
  subtasks: Subtask[];
  order: number;
  priority?: TaskPriority;
  repeat?: TaskRepeat;
  repeatCustomDays?: number;
  repeatTimes?: number;
  repeatTimesLeft?: number;
}

export interface TaskList {
  id: string;
  name: string;
  order: number;
}

export interface TaskDailyGoal {
  date: string; // YYYY-MM-DD
  targetTasks: number;
}

export type ActiveTab = 'dashboard' | 'workouts' | 'diet' | 'activity' | 'tasks';
