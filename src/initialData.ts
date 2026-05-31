import { WeightFatEntry, Workout, MealLog, DietSettings, DailyActivityLog, ReminderSettings } from './types';

// Retorna datas retroativas de acordo com o dia de hoje
export function getRetroactiveDateString(daysAgo: number): string {
  const date = new Date('2026-05-31T17:15:51Z'); // Data de referência baseada no dia atual do app
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

export const INITIAL_WEIGHT_ENTRIES: WeightFatEntry[] = [
  { id: '1', date: getRetroactiveDateString(6), weight: 81.2, bodyFat: 21.0, hydrationLevel: 75 },
  { id: '2', date: getRetroactiveDateString(5), weight: 81.0, bodyFat: 20.8, hydrationLevel: 80 },
  { id: '3', date: getRetroactiveDateString(4), weight: 80.7, bodyFat: 20.6, hydrationLevel: 85 },
  { id: '4', date: getRetroactiveDateString(3), weight: 80.5, bodyFat: 20.4, hydrationLevel: 70 },
  { id: '5', date: getRetroactiveDateString(2), weight: 80.2, bodyFat: 20.2, hydrationLevel: 90 },
  { id: '6', date: getRetroactiveDateString(1), weight: 80.0, bodyFat: 20.0, hydrationLevel: 95 },
  { id: '7', date: getRetroactiveDateString(0), weight: 79.5, bodyFat: 19.8, hydrationLevel: 82 },
];

export const INITIAL_WORKOUTS: Workout[] = [
  { id: 'w1', name: 'Supino Reto (Peito)', series: 4, repetitions: 10, weight: 60, date: '31/05/2026', completed: true },
  { id: 'w2', name: 'Agachamento Livre (Pernas)', series: 4, repetitions: 12, weight: 80, date: '31/05/2026', completed: false },
  { id: 'w3', name: 'Rosca Direta com Barra (Bíceps)', series: 3, repetitions: 10, weight: 26, date: '30/05/2026', completed: true },
  { id: 'w4', name: 'Prancha Abdominal (Core)', series: 3, repetitions: 45, date: '31/05/2026', completed: false },
  { id: 'w5', name: 'Desenvolvimento Ombro (Halteres)', series: 3, repetitions: 10, weight: 18, date: '31/05/2026', completed: false },
];

export const INITIAL_MEALS: MealLog[] = [
  { id: 'm1', date: getRetroactiveDateString(0), calories: 420, protein: 28, carbs: 35, fat: 18, createdAt: '08:30' },
  { id: 'm2', date: getRetroactiveDateString(0), calories: 710, protein: 52, carbs: 85, fat: 14, createdAt: '12:45' },
  { id: 'm3', date: getRetroactiveDateString(1), calories: 1980, protein: 142, carbs: 210, fat: 62, createdAt: '21:00' },
  { id: 'm4', date: getRetroactiveDateString(2), calories: 2200, protein: 155, carbs: 235, fat: 72, createdAt: '21:30' },
];

export const INITIAL_DIET_SETTINGS: DietSettings = {
  targetCalories: 2100,
  targetProtein: 150,
  targetCarbs: 220,
  targetFat: 68,
  writtenDiet: `CAFÉ DA MANHÃ (08:00):
- 3 ovos mexidos inteiros
- 2 fatias de pão integral com requeijão light
- 1 xícara de café preto com adoçante

ALMOÇO (12:30):
- 150g de peito de frango grelhado
- 200g de arroz integral cozido
- 100g de feijão carioca
- Salada verde à vontade com tempero leve
- 1 colher de chá de azeite de oliva extra virgem

LANCHE DA TARDE (16:00):
- 1 scoop de Whey Protein isolado batido com água
- 1 banana nanica grande fatiada
- 20g de aveia em flocos finos

JANTAR (20:00):
- 150g de filé de tilápia ou pescada assada
- 150g de purê de batata doce rústico
- Brócolis picado e cenoura ralada no vapor

CEIA (22:30):
- 1 pote de iogurte desnatado natural (170g)
- 4 unidades de castanha do pará ou amêndoas`
};

export const INITIAL_ACTIVITY_LOGS: DailyActivityLog[] = [
  { date: getRetroactiveDateString(4), steps: 8400, waterCups: 8, stepGoal: 8000, waterGoal: 10 },
  { date: getRetroactiveDateString(3), steps: 11200, waterCups: 11, stepGoal: 8000, waterGoal: 10 },
  { date: getRetroactiveDateString(2), steps: 6100, waterCups: 7, stepGoal: 8000, waterGoal: 10 },
  { date: getRetroactiveDateString(1), steps: 9500, waterCups: 10, stepGoal: 8000, waterGoal: 10 },
  { date: getRetroactiveDateString(0), steps: 5200, waterCups: 6, stepGoal: 8000, waterGoal: 10 },
];

export const INITIAL_REMINDER_SETTINGS: ReminderSettings = {
  enableWaterReminders: true,
  enableStepReminders: true,
  waterInterval: 60, // em minutos
  stepInterval: 120, // em minutos
  pushNotifications: true
};
