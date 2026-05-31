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

export type ActiveTab = 'dashboard' | 'workouts' | 'diet' | 'activity';
