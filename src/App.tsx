import React, { useState, useEffect } from 'react';
import { 
  ActiveTab, 
  WeightFatEntry, 
  Workout, 
  MealLog, 
  DietSettings, 
  DailyActivityLog, 
  ReminderSettings 
} from './types';
import { 
  INITIAL_WEIGHT_ENTRIES, 
  INITIAL_WORKOUTS, 
  INITIAL_MEALS, 
  INITIAL_DIET_SETTINGS, 
  INITIAL_ACTIVITY_LOGS, 
  INITIAL_REMINDER_SETTINGS,
  getRetroactiveDateString
} from './initialData';
import { DashboardView } from './components/DashboardView';
import { WorkoutView } from './components/WorkoutView';
import { DietView } from './components/DietView';
import { ActivityView } from './components/ActivityView';
import { 
  Activity, 
  Dumbbell, 
  Drumstick, 
  Footprints, 
  Bell, 
  X, 
  HeartPulse, 
  Sparkles,
  Volume2,
  Download,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Toast {
  id: string;
  title: string;
  body: string;
  type: 'water' | 'steps' | 'general';
}

export default function App() {
  // 1. Estados Centrais do Aplicativo
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  
  const [weightEntries, setWeightEntries] = useState<WeightFatEntry[]>(() => {
    const local = localStorage.getItem('cs_weight_entries');
    return local ? JSON.parse(local) : INITIAL_WEIGHT_ENTRIES;
  });

  const [workouts, setWorkouts] = useState<Workout[]>(() => {
    const local = localStorage.getItem('cs_workouts');
    return local ? JSON.parse(local) : INITIAL_WORKOUTS;
  });

  const [mealLogs, setMealLogs] = useState<MealLog[]>(() => {
    const local = localStorage.getItem('cs_meals');
    return local ? JSON.parse(local) : INITIAL_MEALS;
  });

  const [dietSettings, setDietSettings] = useState<DietSettings>(() => {
    const local = localStorage.getItem('cs_diet_settings');
    return local ? JSON.parse(local) : INITIAL_DIET_SETTINGS;
  });

  const [activityLogs, setActivityLogs] = useState<DailyActivityLog[]>(() => {
    const local = localStorage.getItem('cs_activity_logs');
    return local ? JSON.parse(local) : INITIAL_ACTIVITY_LOGS;
  });

  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(() => {
    const local = localStorage.getItem('cs_reminder_settings');
    return local ? JSON.parse(local) : INITIAL_REMINDER_SETTINGS;
  });

  // Estado para os Toasts/Notificações in-app
  const [toasts, setToasts] = useState<Toast[]>([]);

  // 2. Efeitos de Sincronização LocalStorage
  useEffect(() => {
    localStorage.setItem('cs_weight_entries', JSON.stringify(weightEntries));
  }, [weightEntries]);

  useEffect(() => {
    localStorage.setItem('cs_workouts', JSON.stringify(workouts));
  }, [workouts]);

  useEffect(() => {
    localStorage.setItem('cs_meals', JSON.stringify(mealLogs));
  }, [mealLogs]);

  useEffect(() => {
    localStorage.setItem('cs_diet_settings', JSON.stringify(dietSettings));
  }, [dietSettings]);

  useEffect(() => {
    localStorage.setItem('cs_activity_logs', JSON.stringify(activityLogs));
  }, [activityLogs]);

  useEffect(() => {
    localStorage.setItem('cs_reminder_settings', JSON.stringify(reminderSettings));
  }, [reminderSettings]);

  // Asegura-se que o dia de hoje tem um registro de atividade criado na inicialização
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    setActivityLogs(prev => {
      const hasToday = prev.some(log => log.date === todayStr);
      if (!hasToday) {
        // Pega as metas do dia mais recente anterior, se houver
        const lastLog = prev[0];
        const defaultTodayLog: DailyActivityLog = {
          date: todayStr,
          steps: 0,
          waterCups: 0,
          stepGoal: lastLog ? lastLog.stepGoal : 8000,
          waterGoal: lastLog ? lastLog.waterGoal : 10
        };
        return [defaultTodayLog, ...prev];
      }
      return prev;
    });
  }, []);

  // 3. Sistema Dinâmico de Lembretes / Triggers de Alertas
  useEffect(() => {
    // Configura loops para simular notificações periódicas caso o usuário queira
    let waterTimer: any;
    let stepTimer: any;

    if (reminderSettings.enableWaterReminders) {
      waterTimer = setInterval(() => {
        triggerNotification(
          '💧 Lembrete de Água!',
          'Está na hora de beber mais um copo de água refrescante para manter a hidratação!',
          'water'
        );
      }, reminderSettings.waterInterval * 60000); // converte para ms
    }

    if (reminderSettings.enableStepReminders) {
      stepTimer = setInterval(() => {
        triggerNotification(
          '🚶‍♂️ Lembrete de Passos!',
          'Que tal se levantar um pouco para esticar as pernas? Dê uma volta rápida!',
          'steps'
        );
      }, reminderSettings.stepInterval * 60000); // converte para ms
    }

    return () => {
      clearInterval(waterTimer);
      clearInterval(stepTimer);
    };
  }, [reminderSettings.enableWaterReminders, reminderSettings.enableStepReminders, reminderSettings.waterInterval, reminderSettings.stepInterval]);

  // 4. Handlers de Eventos
  const triggerNotification = (title: string, body: string, type: 'water' | 'steps' | 'general') => {
    if (!reminderSettings.pushNotifications) return;

    const newToast: Toast = {
      id: Date.now().toString() + Math.random().toString(),
      title,
      body,
      type
    };

    setToasts(prev => [newToast, ...prev]);

    // Toca som de chime simples de forma elegante (opcional e seguro)
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(type === 'water' ? 880 : 587, audioCtx.currentTime); // Mi ou Ré
      gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      // Ignora se bloqueado pela política de interação do navegador
    }

    // Remove automaticamente após 6 segundos
    setTimeout(() => {
      dismissToast(newToast.id);
    }, 6000);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Módulo 1: Peso e Gordura Corporal
  const handleAddWeightEntry = (weight: number, bodyFat: number, date: string) => {
    const newEntry: WeightFatEntry = {
      id: Date.now().toString(),
      date,
      weight,
      bodyFat,
      hydrationLevel: Math.round(70 + (Math.random() * 25)) // simulação calculada
    };
    
    // Sobrescreve se já existe registro com a mesma data para manter histórico íntegro por dia
    setWeightEntries(prev => {
      const filtered = prev.filter(entry => entry.date !== date);
      return [newEntry, ...filtered];
    });
  };

  const handleDeleteWeightEntry = (id: string) => {
    setWeightEntries(prev => prev.filter(e => e.id !== id));
  };

  // Módulo 2: Exercícios físicos
  const handleAddWorkout = (workoutData: Omit<Workout, 'id'>) => {
    const newWorkout: Workout = {
      ...workoutData,
      id: 'w-' + Date.now()
    };
    setWorkouts(prev => [newWorkout, ...prev]);
  };

  const handleToggleWorkout = (id: string) => {
    setWorkouts(prev => prev.map(w => {
      if (w.id === id) {
        const nextState = !w.completed;
        if (nextState) {
          triggerNotification(
            '💪 Treino Concluído!',
            `Você finalizou ${w.name}! Excelente intensidade!`,
            'general'
          );
        }
        return { ...w, completed: nextState };
      }
      return w;
    }));
  };

  const handleDeleteWorkout = (id: string) => {
    setWorkouts(prev => prev.filter(w => w.id !== id));
  };

  const handleClearCompletedWorkouts = () => {
    setWorkouts(prev => prev.filter(w => !w.completed));
    triggerNotification(
      'Ficha Organizada',
      'Exercícios concluídos foram limpos de sua lista ativa.',
      'general'
    );
  };

  // Módulo 3: Dieta
  const handleUpdateDietSettings = (settings: DietSettings) => {
    setDietSettings(settings);
  };

  const handleAddMeal = (mealData: Omit<MealLog, 'id' | 'createdAt'>) => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const newMeal: MealLog = {
      ...mealData,
      id: 'm-' + Date.now(),
      createdAt: `${hours}:${minutes}`
    };

    setMealLogs(prev => [newMeal, ...prev]);

    // Compara consumo com meta para feedback
    const todayStr = mealData.date;
    const todayMeals = [...mealLogs, newMeal].filter(m => m.date === todayStr);
    const sumCals = todayMeals.reduce((acc, m) => acc + m.calories, 0);
    
    if (sumCals > dietSettings.targetCalories) {
      triggerNotification(
        '⚠️ Alerta de Dieta!',
        `Refeição de ${mealData.calories} kcal registrada. Você ultrapassou sua meta em ${sumCals - dietSettings.targetCalories} kcal!`,
        'general'
      );
    } else {
      triggerNotification(
        '🍎 Refeição Registrada!',
        `Sucesso ao somar +${mealData.calories} kcal em seu cardápio diário.`,
        'general'
      );
    }
  };

  const handleDeleteMeal = (id: string) => {
    setMealLogs(prev => prev.filter(m => m.id !== id));
  };

  // Módulo 4: Monitorar Passos e Copo d'água de Hoje
  const handleUpdateActivityGoals = (stepGoal: number, waterGoal: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setActivityLogs(prev => {
      const exists = prev.some(l => l.date === todayStr);
      if (exists) {
        return prev.map(log => {
          if (log.date === todayStr) {
            return { ...log, stepGoal, waterGoal };
          }
          return log;
        });
      }
      return [{
        date: todayStr,
        steps: 0,
        waterCups: 0,
        stepGoal,
        waterGoal
      }, ...prev];
    });
  };

  const handleUpdateActivityToday = (steps: number, waterCups: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    setActivityLogs(prev => {
      const exists = prev.some(l => l.date === todayStr);
      if (exists) {
        return prev.map(log => {
          if (log.date === todayStr) {
            // Se passos atingirem meta hoje pela primeira vez, lança elogio
            if (steps >= log.stepGoal && log.steps < log.stepGoal) {
              triggerNotification(
                '🏆 Meta de Passos Atingida!',
                `Incrível! Você alcançou a sua meta de ${log.stepGoal} passos hoje!`,
                'steps'
              );
            }
            return { ...log, steps, waterCups };
          }
          return log;
        });
      } else {
        return [{
          date: todayStr,
          steps,
          waterCups,
          stepGoal: 8000,
          waterGoal: 10
        }, ...prev];
      }
    });
  };

  // Cadastrar dias anteriores retroativamente
  const handleAddPastDayLog = (date: string, steps: number, waterCups: number) => {
    setActivityLogs(prev => {
      const lastLog = prev[0]; // Pega a meta mais recente
      const newLog: DailyActivityLog = {
        date,
        steps,
        waterCups,
        stepGoal: lastLog ? lastLog.stepGoal : 8000,
        waterGoal: lastLog ? lastLog.waterGoal : 10
      };
      // Filtra duplicata para evitar duplicar datas históricas
      const filtered = prev.filter(log => log.date !== date);
      // Mantém a ordem decrescente (o sort garantirá mais na frente ou podemos deixar na ordem)
      const newArray = [newLog, ...filtered];
      return newArray.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
  };

  const handleUpdateReminderSettings = (settings: Partial<ReminderSettings>) => {
    setReminderSettings(prev => ({ ...prev, ...settings }));
  };

  const handleExportData = () => {
    const data = {
      healthLogs: weightEntries,
      workouts,
      dietLogs: mealLogs,
      dietSettings,
      activityLogs,
      reminderSettings,
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "healthstat_backup_" + new Date().toISOString().split('T')[0] + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.healthLogs) setWeightEntries(data.healthLogs);
        if (data.workouts) setWorkouts(data.workouts);
        if (data.dietLogs) setMealLogs(data.dietLogs);
        if (data.dietSettings) setDietSettings(data.dietSettings);
        if (data.activityLogs) setActivityLogs(data.activityLogs);
        if (data.reminderSettings) setReminderSettings(data.reminderSettings);
        
        triggerNotification('Restauração Concluída', 'Seus dados foram importados com sucesso.', 'general');
      } catch (err) {
        triggerNotification('Erro de Restauração', 'O arquivo selecionado não é válido.', 'general');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-mesh-gradient text-slate-800 font-sans flex flex-col justify-between" id="app-wrapper">
      
      {/* 1. Header do Aplicativo com barra de rolamento e botões */}
      <header className="bg-white/85 backdrop-blur-md border-b border-slate-100 shadow-xs sticky top-0 z-40" id="main-header">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center space-x-3 text-center sm:text-left" id="logo-brand">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 via-pink-500 to-cyan-500 text-white rounded-2xl shadow-md animate-float-slow">
              <HeartPulse className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-pink-500 to-cyan-500 tracking-tight flex items-center justify-center sm:justify-start gap-1">
                HEALTHSTAT
                <Sparkles className="w-4 h-4 text-pink-500 fill-pink-200" />
              </h1>
              <div className="flex items-center space-x-2 mt-0.5 justify-center sm:justify-start">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Painel Fitness</p>
                <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                <button onClick={handleExportData} className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest hover:text-indigo-700 transition cursor-pointer flex items-center gap-0.5 border-none bg-transparent">
                  <Download className="w-3 h-3" /> Exportar
                </button>
                <label className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest hover:text-cyan-700 transition cursor-pointer flex items-center gap-0.5 mb-0">
                  <Upload className="w-3 h-3" /> Importar
                  <input type="file" accept=".json" className="hidden" onChange={handleImportData} />
                </label>
              </div>
            </div>
          </div>

          {/* MENUS E BOTÕES NO TOPO DO APP PARA ALTERNAR TELAS */}
          <nav className="flex items-center bg-slate-100/75 p-1 rounded-2xl border border-slate-200/40 shadow-xs" id="top-nav">
            {/* Botão 1: Painel Geral/Dashboard */}
            <button
              id="tabBtnDashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`p-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'dashboard' 
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-100' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
              title="Painel Principal de Health Status"
            >
              <Activity className={`w-4 h-4 shrink-0 transition-transform ${activeTab === 'dashboard' ? 'scale-110 text-white' : 'text-indigo-600'}`} />
              <span className="hidden sm:inline">Painel Geral</span>
            </button>

            {/* Botão 2: exercicio físico (Halter) */}
            <button
              id="tabBtnWorkouts"
              onClick={() => setActiveTab('workouts')}
              className={`p-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'workouts' 
                  ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-md shadow-pink-100' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
              title="Exercícios e Treino"
            >
              <Dumbbell className={`w-4 h-4 shrink-0 transition-transform ${activeTab === 'workouts' ? 'rotate-12 text-white' : 'text-pink-500'}`} />
              <span className="hidden sm:inline">Exercícios (Halter)</span>
            </button>

            {/* Botão 3: coxa de galinha */}
            <button
              id="tabBtnDiet"
              onClick={() => setActiveTab('diet')}
              className={`p-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'diet' 
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-100' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
              title="Menu e Dieta"
            >
              <Drumstick className={`w-4 h-4 shrink-0 transition-transform ${activeTab === 'diet' ? 'scale-110 text-white' : 'text-amber-500'}`} />
              <span className="hidden sm:inline">Dieta (Coxa)</span>
            </button>

            {/* Botão 4: Passos e beber água */}
            <button
              id="tabBtnActivity"
              onClick={() => setActiveTab('activity')}
              className={`p-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'activity' 
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-md shadow-cyan-100' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
              title="Passos e Ingestão de Água"
            >
              <Footprints className={`w-4 h-4 shrink-0 transition-transform ${activeTab === 'activity' ? 'translate-y-[-1px] text-white' : 'text-cyan-500'}`} />
              <span className="hidden sm:inline">Compartilhar Passos & Água</span>
            </button>
          </nav>
        </div>
      </header>

      {/* 2. Área Central de Visualização dos Módulos (com transição motion suave) */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:py-6" id="main-content-pane">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            id="active-tab-motion-wrapper"
          >
            {activeTab === 'dashboard' && (
              <DashboardView 
                weightEntries={weightEntries}
                mealLogs={mealLogs}
                dietSettings={dietSettings}
                activityLogs={activityLogs}
                reminderSettings={reminderSettings}
                onAddWeightEntry={handleAddWeightEntry}
                onDeleteWeightEntry={handleDeleteWeightEntry}
                onUpdateReminderSettings={handleUpdateReminderSettings}
                onTriggerNotification={triggerNotification}
              />
            )}
            
            {activeTab === 'workouts' && (
              <WorkoutView 
                workouts={workouts}
                onAddWorkout={handleAddWorkout}
                onToggleWorkout={handleToggleWorkout}
                onDeleteWorkout={handleDeleteWorkout}
                onClearCompleted={handleClearCompletedWorkouts}
              />
            )}

            {activeTab === 'diet' && (
              <DietView 
                dietSettings={dietSettings}
                mealLogs={mealLogs}
                onUpdateDietSettings={handleUpdateDietSettings}
                onAddMeal={handleAddMeal}
                onDeleteMeal={handleDeleteMeal}
              />
            )}

            {activeTab === 'activity' && (
              <ActivityView 
                activityLogs={activityLogs}
                reminderSettings={reminderSettings}
                onUpdateActivityToday={handleUpdateActivityToday}
                onUpdateActivityGoals={handleUpdateActivityGoals}
                onUpdateReminderSettings={handleUpdateReminderSettings}
                onTriggerNotification={triggerNotification}
                onAddPastDayLog={handleAddPastDayLog}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 3. Rodapé Estilizado sem telemetria */}
      <footer className="bg-white border-t border-slate-100 py-4 mt-8 text-center text-3xs font-semibold text-slate-400 uppercase tracking-widest" id="app-footer">
        <div>Controle de Saúde © 2026 • Registro e Monitoramento Diário</div>
      </footer>

      {/* 4. Canvas de Toasts (Notificações Push no Canto Superior) */}
      <div 
        id="toast-notifications-canvas" 
        className="fixed top-20 right-4 z-50 pointer-events-none flex flex-col space-y-2 w-full max-w-sm"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              id={`toast-banner-${toast.id}`}
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              className="pointer-events-auto bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-xl flex items-start space-x-3 border border-slate-800"
            >
              <div className="mt-0.5" id={`toast-icon-${toast.id}`}>
                {toast.type === 'water' && (
                  <span className="p-1 px-1.5 bg-sky-500/20 text-sky-400 rounded-lg text-xs font-bold">💧</span>
                )}
                {toast.type === 'steps' && (
                  <span className="p-1 px-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg text-xs font-bold">🚶</span>
                )}
                {toast.type === 'general' && (
                  <span className="p-1 px-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold">✨</span>
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-slate-100">{toast.title}</h4>
                <p className="text-3xs text-slate-300 mt-1 leading-relaxed font-medium">{toast.body}</p>
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="text-slate-400 hover:text-slate-200 transition"
                id={`toast-close-btn-${toast.id}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
