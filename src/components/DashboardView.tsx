import React, { useState } from 'react';
import { 
  WeightFatEntry, 
  MealLog, 
  DietSettings, 
  DailyActivityLog, 
  ReminderSettings 
} from '../types';
import { 
  Scale, 
  Percent, 
  Droplet, 
  Bell, 
  AlertCircle, 
  TrendingUp, 
  Sparkles, 
  Plus, 
  Trash2, 
  CheckCircle,
  Clock,
  Heart
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface DashboardViewProps {
  weightEntries: WeightFatEntry[];
  mealLogs: MealLog[];
  dietSettings: DietSettings;
  activityLogs: DailyActivityLog[];
  reminderSettings: ReminderSettings;
  onAddWeightEntry: (weight: number, bodyFat: number, date: string) => void;
  onDeleteWeightEntry: (id: string) => void;
  onUpdateReminderSettings: (settings: Partial<ReminderSettings>) => void;
  onTriggerNotification: (title: string, body: string, type: 'water' | 'steps' | 'general') => void;
}

export function DashboardView({
  weightEntries,
  mealLogs,
  dietSettings,
  activityLogs,
  reminderSettings,
  onAddWeightEntry,
  onDeleteWeightEntry,
  onUpdateReminderSettings,
  onTriggerNotification
}: DashboardViewProps) {
  const [newWeight, setNewWeight] = useState<string>('');
  const [newFat, setNewFat] = useState<string>('');
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isSuccessMsg, setIsSuccessMsg] = useState(false);

  // Hoje (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];

  // Agrega consumido hoje
  const todayMeals = mealLogs.filter(m => m.date === todayStr);
  const consumedCalories = todayMeals.reduce((acc, m) => acc + m.calories, 0);
  const consumedProtein = todayMeals.reduce((acc, m) => acc + m.protein, 0);
  const consumedCarbs = todayMeals.reduce((acc, m) => acc + m.carbs, 0);
  const consumedFat = todayMeals.reduce((acc, m) => acc + m.fat, 0);

  // Macrófitas para o gráfico de pizza
  const hasMacros = consumedProtein > 0 || consumedCarbs > 0 || consumedFat > 0;
  const pieData = hasMacros 
    ? [
        { name: 'Proteína', value: Math.round(consumedProtein * 4), grams: consumedProtein, color: '#3B82F6' }, // 4 kcal por grama
        { name: 'Carboidrato', value: Math.round(consumedCarbs * 4), grams: consumedCarbs, color: '#10B981' }, // 4 kcal por grama
        { name: 'Gordura', value: Math.round(consumedFat * 9), grams: consumedFat, color: '#F59E0B' } // 9 kcal por grama
      ]
    : [
        { name: 'Sem registros (Meta Proteína)', value: dietSettings.targetProtein * 4, grams: dietSettings.targetProtein, color: '#E1E7EC' },
        { name: 'Sem registros (Meta Carb)', value: dietSettings.targetCarbs * 4, grams: dietSettings.targetCarbs, color: '#F0F4F8' },
        { name: 'Sem registros (Meta Gordura)', value: dietSettings.targetFat * 9, grams: dietSettings.targetFat, color: '#F8FAFC' }
      ];

  // Atividade de hoje
  const todayActivity = activityLogs.find(a => a.date === todayStr) || {
    date: todayStr,
    steps: 0,
    waterCups: 0,
    stepGoal: 8000,
    waterGoal: 10
  };

  // Último registro de peso e gordura corporal
  const sortedEntries = [...weightEntries].sort((a, b) => b.date.localeCompare(a.date));
  const latestEntry = sortedEntries[0] || { weight: 70, bodyFat: 15, hydrationLevel: 70 };

  const handleWeightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(newWeight);
    const f = parseFloat(newFat);
    if (!isNaN(w) && !isNaN(f)) {
      onAddWeightEntry(w, f, newDate);
      setNewWeight('');
      setNewFat('');
      setIsSuccessMsg(true);
      setTimeout(() => setIsSuccessMsg(false), 3000);
      onTriggerNotification(
        'Estatísticas Atualizadas!',
        `Peso registrado: ${w}kg, Gordura Corporal: ${f}%. Continue o bom progresso!`,
        'general'
      );
    }
  };

  // Formato de dados para o gráfico de evolução (últimas semanas ordenadas chronologicamente)
  const evolutionData = [...weightEntries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(entry => {
      // Converte data YYYY-MM-DD para visualização agradável dd/mm
      const parts = entry.date.split('-');
      const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : entry.date;
      return {
        ...entry,
        formattedDate,
        'Peso (kg)': entry.weight,
        'Gordura (%)': entry.bodyFat
      };
    });

  // Testar envio de notificação manual
  const triggerTestNotification = (type: 'water' | 'steps') => {
    if (type === 'water') {
      onTriggerNotification(
        '💧 Lembrete de Hidratação!',
        `Está na hora de beber seu copo de água! Meta de hoje: ${todayActivity.waterCups} de ${todayActivity.waterGoal} copos completos.`,
        'water'
      );
    } else {
      onTriggerNotification(
        '🚶‍♂️ Lembrete de Movimento!',
        `Vamos levantar e dar alguns passos! Progresso atual: ${todayActivity.steps} passos de ${todayActivity.stepGoal}.`,
        'steps'
      );
    }
  };

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* Cards de Resumo Rápido */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="stats-summary-cards">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 vibrant-card-glow-indigo" id="weight-summary-card">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl text-white shadow-sm">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Último Peso</p>
            <p className="text-2xl font-display font-extrabold text-slate-800 tracking-tight">{latestEntry.weight} kg</p>
            <p className="text-xs text-indigo-600 mt-0.5 font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Peso Corporal
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 vibrant-card-glow-pink" id="fat-summary-card">
          <div className="p-3 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl text-white shadow-sm">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Gordura Corporal</p>
            <p className="text-2xl font-display font-extrabold text-slate-800 tracking-tight">{latestEntry.bodyFat}%</p>
            <p className="text-xs text-pink-600 mt-0.5 font-bold">BIA calculado</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 vibrant-card-glow-cyan" id="water-summary-card">
          <div className="p-3 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl text-white shadow-sm">
            <Droplet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Água Hoje</p>
            <p className="text-2xl font-display font-extrabold text-slate-800 tracking-tight">{todayActivity.waterCups} / {todayActivity.waterGoal} copos</p>
            <p className="text-xs text-cyan-600 mt-0.5 font-bold">
              {Math.min(100, Math.round((todayActivity.waterCups / todayActivity.waterGoal) * 100))}% da meta
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 vibrant-card-glow-pink" id="calories-summary-card">
          <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl text-white shadow-sm">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Calorias Consumidas</p>
            <p className="text-2xl font-display font-extrabold text-slate-800 tracking-tight">{consumedCalories} kcal</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`h-2 w-2 rounded-full ${consumedCalories > dietSettings.targetCalories ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`} />
              <p className="text-xs text-slate-500 font-bold">Meta: {dietSettings.targetCalories} kcal</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-charts-row">
        {/* Gráfico de Evolução (Linha) - Ocupa 2 colunas */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between" id="evolution-chart-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Evolução da Saúde</h3>
              <p className="text-xs text-slate-500">Histórico de variação de peso corporal (kg) e percentual de gordura (%)</p>
            </div>
            <span className="p-1 px-3 bg-indigo-50 text-indigo-700 text-xs rounded-full font-medium">Últimos Lançamentos</span>
          </div>

          <div className="h-64 sm:h-72 w-full" id="evolution-chart">
            {evolutionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolutionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECEFF1" />
                  <XAxis dataKey="formattedDate" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', backgroundColor: '#0F172A', color: '#fff' }}
                    labelStyle={{ fontWeight: 'bold', color: '#94A3B8' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Line 
                    type="monotone" 
                    dataKey="Peso (kg)" 
                    stroke="#4F46E5" 
                    strokeWidth={3} 
                    dot={{ r: 4 }} 
                    activeDot={{ r: 6 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Gordura (%)" 
                    stroke="#10B981" 
                    strokeWidth={2} 
                    strokeDasharray="5 5" 
                    dot={{ r: 3 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-300" />
                <p className="text-sm">Nenhum dado cadastrado para exibir no gráfico.</p>
              </div>
            )}
          </div>
        </div>

        {/* Gráfico de Pizza - Distribuição Nutricional Consumida Hoje */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between" id="macronutrients-chart-card">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Divisão de Macronutrientes</h3>
            <p className="text-xs text-slate-500">Distribuição calórica aproximada consumida hoje por macros</p>
          </div>

          <div className="h-52 w-full relative flex items-center justify-center my-2" id="macros-pie-chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={hasMacros ? 5 : 0}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => {
                    return [`${value} kcal (${props.payload.grams}g)`, name];
                  }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Texto centralizado no donut chart */}
            <div className="absolute text-center">
              <span className="text-xs text-slate-400 font-medium block">Total Hoje</span>
              <span className="text-xl font-bold text-slate-800 block">{consumedCalories}</span>
              <span className="text-2xs text-slate-400 font-medium block">kcal</span>
            </div>
          </div>

          {/* Legenda do Gráfico de Pizza */}
          <div className="space-y-2" id="pie-chart-legend">
            {pieData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="text-slate-500">{hasMacros ? `${item.grams}g` : '0g'} ({Math.round(item.value)} kcal)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-actions-row">
        {/* Formulário para registrar novo peso/gordura */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100" id="add-metric-form-card">
          <div className="flex items-center space-x-2 mb-4">
            <span className="p-1 px-2.5 bg-indigo-50 text-indigo-700 text-xs rounded font-bold">1</span>
            <h3 className="text-base font-bold text-slate-800">Registrar Peso e Percentual</h3>
          </div>

          <form onSubmit={handleWeightSubmit} className="space-y-4" id="metric-form">
            <div>
              <label htmlFor="inputWeight" className="block text-xs font-semibold text-slate-600 mb-1">Peso Corporal (kg)</label>
              <div className="relative">
                <input
                  id="inputWeight"
                  type="number"
                  step="0.1"
                  required
                  placeholder="Ex: 78.5"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  className="w-full text-sm p-2.5 pl-3 border border-slate-100 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">kg</span>
              </div>
            </div>

            <div>
              <label htmlFor="inputFat" className="block text-xs font-semibold text-slate-600 mb-1">Gordura Corporal (%)</label>
              <div className="relative">
                <input
                  id="inputFat"
                  type="number"
                  step="0.1"
                  required
                  placeholder="Ex: 18.5"
                  value={newFat}
                  onChange={(e) => setNewFat(e.target.value)}
                  className="w-full text-sm p-2.5 pl-3 border border-slate-100 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">%</span>
              </div>
            </div>

            <div>
              <label htmlFor="inputMetricDate" className="block text-xs font-semibold text-slate-600 mb-1">Data de Registro</label>
              <input
                id="inputMetricDate"
                type="date"
                required
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full text-sm p-2.5 border border-slate-100 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition"
              />
            </div>

            {isSuccessMsg && (
              <div className="p-2.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl flex items-center space-x-2" id="success-feedback-bubble">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Registrado com sucesso de forma local!</span>
              </div>
            )}

            <button
              id="submitMetricBtn"
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm p-3 rounded-xl transition shadow shadow-indigo-200"
            >
              Confirmar Registro
            </button>
          </form>
        </div>

        {/* Histórico Recente de Pesos */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100" id="metric-history-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="p-1 px-2.5 bg-emerald-50 text-emerald-700 text-xs rounded font-bold">2</span>
              <h3 className="text-base font-bold text-slate-800">Histórico de Lançamentos</h3>
            </div>
            <span className="text-xs text-slate-400">{weightEntries.length} registros</span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1" id="metrics-history-list">
            {sortedEntries.map((entry) => {
              const parts = entry.date.split('-');
              const viewDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : entry.date;
              return (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition" id={`metric-item-${entry.id}`}>
                  <div>
                    <p className="text-xs font-bold text-slate-700 flex items-center">
                      {viewDate}
                    </p>
                    <p className="text-2xs text-slate-400 mt-0.5">Hidratação Estimada: {entry.hydrationLevel}%</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-indigo-700">{entry.weight} kg</p>
                      <p className="text-2xs font-semibold text-emerald-600">Gordura: {entry.bodyFat}%</p>
                    </div>
                    {/* Botão de excluir */}
                    <button 
                      onClick={() => onDeleteWeightEntry(entry.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50 transition"
                      title="Excluir Registro"
                      id={`delete-metric-btn-${entry.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
            {sortedEntries.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-8">Nenhum registro de peso e gordura cadastrado.</p>
            )}
          </div>
        </div>

        {/* Lembretes de Notificação Push */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100" id="notification-settings-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="p-1 px-2.5 bg-sky-50 text-sky-700 text-xs rounded font-bold">3</span>
              <h3 className="text-base font-bold text-slate-800">Notificações Push</h3>
            </div>
            <span className="flex items-center text-emerald-600 bg-emerald-50 text-2xs p-1 px-2 rounded-full font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
              Sincronizado
            </span>
          </div>

          <p className="text-xs text-slate-500 mb-4">
            Configure lembretes inteligentes configuráveis que emitem lembretes audiovisuais diretamente na tela em intervalos definidos.
          </p>

          <div className="space-y-4" id="push-settings-options">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl" id="push-toggle-option">
              <div className="flex items-center space-x-2.5">
                <Bell className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-xs font-bold text-slate-700">Notificações Push no App</p>
                  <p className="text-2xs text-slate-400">Notificações globais ativas</p>
                </div>
              </div>
              <label htmlFor="pushNotificationsCheck" className="relative inline-flex items-center cursor-pointer">
                <input
                  id="pushNotificationsCheck"
                  type="checkbox"
                  checked={reminderSettings.pushNotifications}
                  onChange={(e) => onUpdateReminderSettings({ pushNotifications: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
              </label>
            </div>

            {/* Teste manual de envio */}
            <div className="space-y-2 mt-2" id="push-simulation-buttons">
              <p className="text-2xs font-extrabold text-slate-400 uppercase tracking-wider block">Simular Alerta de Lembrete</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="triggerWaterNotificationBtn"
                  onClick={() => triggerTestNotification('water')}
                  disabled={!reminderSettings.pushNotifications}
                  className="text-2xs bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold p-2.5 rounded-xl border border-sky-200/50 transition flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Droplet className="w-3.5 h-3.5 shrink-0" />
                  <span>Beber Água</span>
                </button>
                <button
                  id="triggerStepNotificationBtn"
                  onClick={() => triggerTestNotification('steps')}
                  disabled={!reminderSettings.pushNotifications}
                  className="text-2xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold p-2.5 rounded-xl border border-emerald-200/50 transition flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                  <span>Caminhar</span>
                </button>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/40 text-2xs text-amber-800 flex items-start gap-2" id="alert-warning-pane">
              <Clock className="w-3.5 h-3.5 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <span className="font-bold">Tempo Real:</span> Os lembretes são disparados automaticamente de acordo com o contador. Ajuste os tempos na aba de Passos e Hidratação.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
