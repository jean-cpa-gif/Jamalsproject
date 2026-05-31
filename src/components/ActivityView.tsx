import React, { useState } from 'react';
import { DailyActivityLog, ReminderSettings } from '../types';
import { 
  Footprints, 
  Droplet, 
  Plus, 
  Minus, 
  Trash2, 
  BellRing, 
  Calendar, 
  Flame, 
  CheckCircle,
  HelpCircle,
  TrendingDown,
  ChevronRight,
  TrendingUp,
  Edit2,
  Check,
  X
} from 'lucide-react';

interface ActivityViewProps {
  activityLogs: DailyActivityLog[];
  reminderSettings: ReminderSettings;
  onUpdateActivityToday: (steps: number, waterCups: number) => void;
  onUpdateActivityGoals: (stepGoal: number, waterGoal: number) => void;
  onUpdateReminderSettings: (settings: Partial<ReminderSettings>) => void;
  onTriggerNotification: (title: string, body: string, type: 'water' | 'steps' | 'general') => void;
  onAddPastDayLog: (date: string, steps: number, water: number) => void;
}

export function ActivityView({
  activityLogs,
  reminderSettings,
  onUpdateActivityToday,
  onUpdateActivityGoals,
  onUpdateReminderSettings,
  onTriggerNotification,
  onAddPastDayLog
}: ActivityViewProps) {
  const [stepInputVal, setStepInputVal] = useState('1000');
  
  const [isEditingStepGoal, setIsEditingStepGoal] = useState(false);
  const [tempStepGoal, setTempStepGoal] = useState('');

  const [isEditingWaterGoal, setIsEditingWaterGoal] = useState(false);
  const [tempWaterGoal, setTempWaterGoal] = useState('');

  // Para dias anteriores
  const [pastDate, setPastDate] = useState('');
  const [pastSteps, setPastSteps] = useState('');
  const [pastWater, setPastWater] = useState('');
  const [showHistoryForm, setShowHistoryForm] = useState(false);
  const [historySuccess, setHistorySuccess] = useState(false);

  // Hoje (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];
  const todayActivity = activityLogs.find(a => a.date === todayStr) || {
    date: todayStr,
    steps: 0,
    waterCups: 0,
    stepGoal: 8000,
    waterGoal: 10
  };

  const handleStepAdd = (multiplier: number) => {
    const value = parseInt(stepInputVal) || 1000;
    const nextSteps = Math.max(0, todayActivity.steps + (value * multiplier));
    onUpdateActivityToday(nextSteps, todayActivity.waterCups);
  };

  const handleWaterAdd = (qty: number) => {
    const nextCups = Math.max(0, todayActivity.waterCups + qty);
    onUpdateActivityToday(todayActivity.steps, nextCups);
    
    if (qty > 0) {
      onTriggerNotification(
        '💦 Registro de Hidratação!',
        `Você registrou +${qty} copo(s) de água. Atualmente: ${nextCups} copos de ${todayActivity.waterGoal}. Continue hidratado!`,
        'water'
      );
    }
  };

  // Cadastra histórico retroativo
  const handleHistorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const st = parseInt(pastSteps);
    const wt = parseInt(pastWater);
    if (!pastDate || isNaN(st) || isNaN(wt)) return;

    onAddPastDayLog(pastDate, st, wt);
    setPastSteps('');
    setPastWater('');
    setPastDate('');
    setHistorySuccess(true);
    setTimeout(() => {
      setHistorySuccess(false);
      setShowHistoryForm(false);
    }, 2000);
  };

  const stepPercentage = Math.min(100, Math.round((todayActivity.steps / todayActivity.stepGoal) * 100));
  const waterPercentage = Math.min(100, Math.round((todayActivity.waterCups / todayActivity.waterGoal) * 100));

  return (
    <div className="space-y-6" id="activity-container">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="activity-main-counters">
        {/* Bloco 1: Contador de Passos (Footprints) */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100/80 flex flex-col justify-between vibrant-card-glow-indigo" id="steps-card">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="p-3 bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white rounded-2xl shadow-sm" id="steps-footprints-badge">
                <Footprints className="w-5 h-5 animate-pulse" />
              </span>
              {isEditingStepGoal ? (
                <div className="flex items-center gap-1.5 bg-indigo-50 rounded-full p-1 px-3">
                  <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-widest hidden sm:inline">Meta:</span>
                  <input type="number" value={tempStepGoal} onChange={e => setTempStepGoal(e.target.value)} className="w-16 bg-white border border-indigo-200 rounded text-xs p-1 outline-none text-indigo-700 font-bold text-center" />
                  <button onClick={() => { onUpdateActivityGoals(parseInt(tempStepGoal) || 8000, todayActivity.waterGoal); setIsEditingStepGoal(false); }} className="p-1.5 bg-indigo-600 text-white rounded-md cursor-pointer hover:bg-indigo-700 transition"><Check className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setIsEditingStepGoal(false)} className="p-1.5 bg-slate-300 text-slate-700 rounded-md cursor-pointer hover:bg-slate-400 transition"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <div onClick={() => { setIsEditingStepGoal(true); setTempStepGoal(String(todayActivity.stepGoal)); }} className="text-2xs bg-indigo-50 text-indigo-700 font-bold p-1 px-3 rounded-full flex items-center gap-1.5 cursor-pointer hover:bg-indigo-100 transition shadow-sm border border-indigo-100">
                  Meta do Dia: {todayActivity.stepGoal} passos
                  <Edit2 className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            <h3 className="text-lg font-display font-bold text-slate-800">Caminhada e Passos</h3>
            <p className="text-xs text-slate-500 mb-6">Cadastre os passos dados durante o dia para monitorar o sedentarismo.</p>

            {/* Visual Gauge ou contador grande */}
            <div className="bg-slate-50/70 p-6 rounded-3xl border border-slate-100 mb-6 text-center shadow-inner" id="steps-large-display">
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wide">Passos Registrados Hoje</span>
              <span className="text-4xl font-display font-black text-indigo-600 block my-1 text-glow-cyan">{todayActivity.steps}</span>
              <span className="text-xs text-slate-500 font-bold block">
                {stepPercentage}% da meta concluída
              </span>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mt-3 max-w-sm mx-auto">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-full transition-all duration-350"
                  style={{ width: `${stepPercentage}%` }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4" id="steps-action-controls">
            <div className="flex items-center space-x-2">
              <input
                id="stepsIncrementVal"
                type="number"
                value={stepInputVal}
                onChange={(e) => setStepInputVal(e.target.value)}
                className="w-1/2 text-sm p-3 border border-slate-100 rounded-xl text-center bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
              />
              <button
                onClick={() => handleStepAdd(1)}
                className="w-1/4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:opacity-95 text-white font-bold p-3 text-xs rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer"
                id="addStepsBtn"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Passos</span>
              </button>
              <button
                onClick={() => handleStepAdd(-1)}
                className="w-1/4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold p-3 text-xs rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer"
                id="removeStepsBtn"
              >
                <Minus className="w-3.5 h-3.5" />
                <span>Passos</span>
              </button>
            </div>
            <p className="text-[10px] text-center text-slate-400 italic font-bold">Insira o número de passos e aperte o botão para atualizar.</p>
          </div>
        </div>

        {/* Bloco 2: Monitor de Hidratação (Água) */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100/80 flex flex-col justify-between vibrant-card-glow-cyan" id="water-card">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="p-3 bg-gradient-to-tr from-cyan-400 to-cyan-500 text-white rounded-xl shadow-sm" id="water-badge">
                <Droplet className="w-5 h-5 animate-bounce" />
              </span>
              {isEditingWaterGoal ? (
                <div className="flex items-center gap-1.5 bg-cyan-50 rounded-full p-1 px-3">
                  <span className="text-[10px] text-cyan-700 font-bold uppercase tracking-widest hidden sm:inline">Meta:</span>
                  <input type="number" value={tempWaterGoal} onChange={e => setTempWaterGoal(e.target.value)} className="w-16 bg-white border border-cyan-200 rounded text-xs p-1 outline-none text-cyan-700 font-bold text-center" />
                  <button onClick={() => { onUpdateActivityGoals(todayActivity.stepGoal, parseInt(tempWaterGoal) || 10); setIsEditingWaterGoal(false); }} className="p-1.5 bg-cyan-500 text-white rounded-md cursor-pointer hover:bg-cyan-600 transition"><Check className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setIsEditingWaterGoal(false)} className="p-1.5 bg-slate-300 text-slate-700 rounded-md cursor-pointer hover:bg-slate-400 transition"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <div onClick={() => { setIsEditingWaterGoal(true); setTempWaterGoal(String(todayActivity.waterGoal)); }} className="text-2xs bg-cyan-50 text-cyan-750 font-bold p-1 px-3 rounded-full flex items-center gap-1.5 cursor-pointer hover:bg-cyan-100 transition shadow-sm border border-cyan-100">
                  Meta do Dia: {todayActivity.waterGoal} copos (2.5L)
                  <Edit2 className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            <h3 className="text-lg font-display font-bold text-slate-800">Controle de Ingestão de Água</h3>
            <p className="text-xs text-slate-500 mb-6">Monitore e registre copos de água (250ml) ao longo de cada jornada.</p>

            {/* Visual copos preenchidos */}
            <div className="bg-slate-50/70 p-5 rounded-3xl border border-slate-100 shadow-inner mb-6" id="water-progress-display">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-slate-500">CONSUMIDO HOJE: {todayActivity.waterCups} copos</span>
                <span className="text-xs text-cyan-600 font-bold">{waterPercentage}% completo</span>
              </div>
              
              {/* copos de água interativos */}
              <div className="grid grid-cols-5 md:grid-cols-10 gap-2.5 my-4" id="interative-cups-grid">
                {Array.from({ length: Math.max(10, todayActivity.waterGoal) }).map((_, idx) => {
                  const isFilled = idx < todayActivity.waterCups;
                  return (
                    <button
                      key={idx}
                      onClick={() => isFilled ? handleWaterAdd(-1) : handleWaterAdd(1)}
                      className={`h-11 rounded-xl transition flex flex-col items-center justify-center border-2 ${
                        isFilled 
                          ? 'bg-sky-500 border-sky-400 text-white shadow shadow-sky-200 scale-105' 
                          : 'bg-white hover:bg-sky-50/50 border-slate-100 text-slate-300 hover:text-sky-400 hover:border-sky-200'
                      }`}
                      title={isFilled ? "Remover Copo de Água" : "Adicionar Copo de Água"}
                      id={`glass-water-node-${idx}`}
                    >
                      <Droplet className={`w-5 h-5 ${isFilled ? 'fill-white stroke-[2]' : 'stroke-[1.5]'}`} />
                      <span className="text-3xs mt-0.5 font-bold">{idx + 1}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2" id="water-fast-actions-container">
            <button
              onClick={() => handleWaterAdd(1)}
              className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold p-3 text-xs rounded-xl transition flex items-center justify-center space-x-1.5"
              id="addWaterBtn"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Copo (+250ml)</span>
            </button>
            <button
              id="removeWaterBtn"
              onClick={() => handleWaterAdd(-1)}
              disabled={todayActivity.waterCups === 0}
              className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-xs rounded-xl transition"
            >
              Remover Copo
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="activity-secondary-row">
        {/* Painel de Lembretes Configuráveis */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100" id="reminders-configurations-card">
          <div className="flex items-center space-x-2 mb-4">
            <BellRing className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base font-bold text-slate-800">Lembretes e Avisos</h3>
          </div>

          <p className="text-xs text-slate-500 mb-4">
            Configure lembretes com intervalos recorrentes em minutos para alertá-lo a tomar água ou caminhar.
          </p>

          <div className="space-y-4" id="reminder-toggles-options">
            {/* Lembrete de Água */}
            <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100/50" id="water-alert-toggles">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Lembretes de Água</span>
                <label htmlFor="waterReminderToggle" className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="waterReminderToggle"
                    type="checkbox"
                    checked={reminderSettings.enableWaterReminders}
                    onChange={(e) => onUpdateReminderSettings({ enableWaterReminders: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-sky-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all" />
                </label>
              </div>
              {reminderSettings.enableWaterReminders && (
                <div className="flex items-center justify-between mt-1 text-2xs animate-fadeIn" id="water-interval-config">
                  <label htmlFor="waterIntervalSelect" className="text-slate-500 font-semibold">Repetir alerta a cada:</label>
                  <select
                    id="waterIntervalSelect"
                    value={reminderSettings.waterInterval}
                    onChange={(e) => onUpdateReminderSettings({ waterInterval: parseInt(e.target.value) })}
                    className="bg-white border border-slate-200 rounded p-1 text-slate-700 text-2xs font-semibold outline-none"
                  >
                    <option value="30">30 min</option>
                    <option value="60">60 min</option>
                    <option value="125">120 min</option>
                    <option value="180">180 min</option>
                  </select>
                </div>
              )}
            </div>

            {/* Lembrete de Passos */}
            <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100/50" id="step-alert-toggles">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Lembretes de Caminhada</span>
                <label htmlFor="stepsReminderToggle" className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="stepsReminderToggle"
                    type="checkbox"
                    checked={reminderSettings.enableStepReminders}
                    onChange={(e) => onUpdateReminderSettings({ enableStepReminders: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all" />
                </label>
              </div>
              {reminderSettings.enableStepReminders && (
                <div className="flex items-center justify-between mt-1 text-2xs animate-fadeIn" id="steps-interval-config">
                  <label htmlFor="stepsIntervalSelect" className="text-slate-500 font-semibold">Repetir alerta a cada:</label>
                  <select
                    id="stepsIntervalSelect"
                    value={reminderSettings.stepInterval}
                    onChange={(e) => onUpdateReminderSettings({ stepInterval: parseInt(e.target.value) })}
                    className="bg-white border border-slate-200 rounded p-1 text-slate-700 text-2xs font-semibold outline-none"
                  >
                    <option value="60">1 hora</option>
                    <option value="120">2 horas</option>
                    <option value="180">3 horas</option>
                    <option value="240">4 horas</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lançamento manual de dias anteriores */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100" id="add-history-block-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-5 h-5 text-indigo-500" />
              Lançar Dia Anterior
            </h3>
            <button
              onClick={() => setShowHistoryForm(!showHistoryForm)}
              className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs"
              id="toggleHistoryFormBtn"
            >
              {showHistoryForm ? 'Cancelar' : 'Lançar Dados'}
            </button>
          </div>

          {!showHistoryForm ? (
            <p className="text-xs text-slate-500 mb-4 py-3 leading-relaxed">
              Esqueceu de registrar ontem? Não tem problema, você pode cadastrar retroativamente pesos, copos de água consumidos ou passos retroativos para manter as estatísticas precisas!
            </p>
          ) : (
            <form onSubmit={handleHistorySubmit} className="space-y-3" id="history-entry-form">
              <div>
                <label htmlFor="pastDateInput" className="block text-3xs font-extrabold uppercase text-slate-500 mb-0.5">Data</label>
                <input
                  id="pastDateInput"
                  type="date"
                  required
                  value={pastDate}
                  onChange={(e) => setPastDate(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="pastStepsInput" className="block text-3xs font-extrabold uppercase text-slate-500 mb-0.5">Passos</label>
                  <input
                    id="pastStepsInput"
                    type="number"
                    required
                    placeholder="Ex: 8500"
                    value={pastSteps}
                    onChange={(e) => setPastSteps(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="pastWaterInput" className="block text-3xs font-extrabold uppercase text-slate-500 mb-0.5">Copos Água</label>
                  <input
                    id="pastWaterInput"
                    type="number"
                    required
                    placeholder="Ex: 9"
                    value={pastWater}
                    onChange={(e) => setPastWater(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {historySuccess && (
                <p className="text-emerald-700 text-3xs font-extrabold" id="history-entry-success-bubble">✓ Registro retroativo adicionado!</p>
              )}

              <button
                id="submitHistoryBtn"
                type="submit"
                className="w-full text-xs p-2.5 bg-indigo-600 hover:bg-indigo-700 font-semibold text-white rounded-lg transition"
              >
                Salvar Histórico
              </button>
            </form>
          )}
        </div>

        {/* Histórico Consolidado de Dias Anteriores */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100" id="historical-logs-card">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-1.5">
            <Flame className="w-5 h-5 text-amber-500 animate-pulse" />
            Consolidado Histórico
          </h3>

          <div className="max-h-48 overflow-y-auto space-y-2 pr-1" id="historical-logs-list">
            {[...activityLogs]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((log) => {
                const parts = log.date.split('-');
                const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : log.date;
                const isWaterOk = log.waterCups >= log.waterGoal;
                const isStepsOk = log.steps >= log.stepGoal;
                const score = (isWaterOk ? 50 : 0) + (isStepsOk ? 50 : 0);

                return (
                  <div key={log.date} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition text-2xs" id={`history-entry-${log.date}`}>
                    <div>
                      <span className="font-extrabold text-slate-700 text-xs block">{formattedDate}</span>
                      <div className="flex gap-2 mt-1 text-slate-400 font-semibold">
                        <span className={isStepsOk ? 'text-indigo-600' : 'text-slate-500'}>🚶 {log.steps} passos</span>
                        <span className={isWaterOk ? 'text-sky-600' : 'text-slate-500'}>💧 {log.waterCups} copos</span>
                      </div>
                    </div>
                    <div>
                      <span className={`p-1 px-2.5 text-3xs font-extrabold rounded-full ${
                        score === 100 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : score === 50 
                          ? 'bg-amber-50 text-amber-700' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {score === 100 ? 'Meta Geral ✓' : score === 50 ? 'Metade ✓' : 'Incompleto'}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
