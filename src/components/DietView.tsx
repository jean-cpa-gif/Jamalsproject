import React, { useState } from 'react';
import { DietSettings, MealLog } from '../types';
import { 
  Drumstick, 
  UtensilsCrossed, 
  Settings, 
  Check, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Trash2, 
  AlertCircle,
  TrendingDown,
  Info,
  Sparkles,
  Search
} from 'lucide-react';

interface DietViewProps {
  dietSettings: DietSettings;
  mealLogs: MealLog[];
  onUpdateDietSettings: (settings: DietSettings) => void;
  onAddMeal: (meal: Omit<MealLog, 'id' | 'createdAt'>) => void;
  onDeleteMeal: (id: string) => void;
}

export function DietView({
  dietSettings,
  mealLogs,
  onUpdateDietSettings,
  onAddMeal,
  onDeleteMeal
}: DietViewProps) {
  // Estados para edição de metas
  const [showSettings, setShowSettings] = useState(false);
  const [targetCalories, setTargetCalories] = useState(String(dietSettings.targetCalories));
  const [targetProtein, setTargetProtein] = useState(String(dietSettings.targetProtein));
  const [targetCarbs, setTargetCarbs] = useState(String(dietSettings.targetCarbs));
  const [targetFat, setTargetFat] = useState(String(dietSettings.targetFat));

  // Estados para a dieta escrita (escondida por padrão)
  const [showWrittenDiet, setShowWrittenDiet] = useState(false);
  const [writtenDietRaw, setWrittenDietRaw] = useState(dietSettings.writtenDiet);
  const [isEditingWrittenDiet, setIsEditingWrittenDiet] = useState(false);

  // Estados para registro de refeição
  const [mealName, setMealName] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [mealCalories, setMealCalories] = useState('');
  const [mealProtein, setMealProtein] = useState('');
  const [mealCarbs, setMealCarbs] = useState('');
  const [mealFat, setMealFat] = useState('');
  const [mealDate, setMealDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Blacklist de sugestões excluídas localmente pelo usuário
  const [excludedSuggestions, setExcludedSuggestions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cs_excluded_diet_suggestions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleExcludeSuggestion = (name: string) => {
    const updated = [...excludedSuggestions, name.toLowerCase()];
    setExcludedSuggestions(updated);
    localStorage.setItem('cs_excluded_diet_suggestions', JSON.stringify(updated));
  };

  // Obter sugestões de refeições passadas (filtrando as excluídas)
  const suggestedMeals = mealLogs
    .filter((m, i, arr) => 
      m.name && 
      m.name.toLowerCase().includes(mealName.toLowerCase()) && 
      !excludedSuggestions.includes(m.name.toLowerCase()) &&
      arr.findIndex(x => x.name?.toLowerCase() === m.name?.toLowerCase()) === i
    )
    .slice(0, 5);

  const handleFetchAiMacros = async () => {
    if (!mealName.trim()) return;
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/meal-macros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealName })
      });
      if (res.ok) {
        const data = await res.json();
        setMealCalories(String(data.calories));
        setMealProtein(String(data.protein));
        setMealCarbs(String(data.carbs));
        setMealFat(String(data.fat));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Toast e feedbacks
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [mealSuccess, setMealSuccess] = useState(false);

  // Filtra as refeições registradas hoje (GMT / Horário do dispositivo do app)
  const todayStr = new Date().toISOString().split('T')[0];
  const todayMeals = mealLogs.filter(m => m.date === todayStr);

  const totalCalories = todayMeals.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = todayMeals.reduce((sum, m) => sum + m.protein, 0);
  const totalCarbs = todayMeals.reduce((sum, m) => sum + m.carbs, 0);
  const totalFat = todayMeals.reduce((sum, m) => sum + m.fat, 0);

  // Cálculos de saldo de calorias
  const calDifference = dietSettings.targetCalories - totalCalories;
  const isCalExceeded = calDifference < 0;

  // Cálculos de saldo de macronutrientes
  const protDiff = dietSettings.targetProtein - totalProtein;
  const carbDiff = dietSettings.targetCarbs - totalCarbs;
  const fatDiff = dietSettings.targetFat - totalFat;

  // Submissão das novas metas de dieta
  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateDietSettings({
      targetCalories: parseInt(targetCalories) || 2000,
      targetProtein: parseInt(targetProtein) || 120,
      targetCarbs: parseInt(targetCarbs) || 200,
      targetFat: parseInt(targetFat) || 60,
      writtenDiet: dietSettings.writtenDiet
    });
    setSettingsSuccess(true);
    setTimeout(() => {
      setSettingsSuccess(false);
      setShowSettings(false);
    }, 1500);
  };

  // Submissão da refeição consumida
  const handleMealSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const kcal = parseFloat(mealCalories);
    const prot = parseFloat(mealProtein) || 0;
    const carb = parseFloat(mealCarbs) || 0;
    const fat = parseFloat(mealFat) || 0;

    if (isNaN(kcal)) return;

    onAddMeal({
      name: mealName.trim() || undefined,
      date: mealDate,
      calories: kcal,
      protein: prot,
      carbs: carb,
      fat: fat
    });

    setMealName('');
    setMealCalories('');
    setMealProtein('');
    setMealCarbs('');
    setMealFat('');
    setShowSuggestions(false);
    setMealSuccess(true);
    setTimeout(() => setMealSuccess(false), 2500);
  };

  // Salvar a dieta escrita no banco local
  const saveWrittenDiet = () => {
    onUpdateDietSettings({
      ...dietSettings,
      writtenDiet: writtenDietRaw
    });
    setIsEditingWrittenDiet(false);
  };

  // Barra de progresso helper
  const getProgressPercent = (value: number, target: number) => {
    if (target <= 0) return 0;
    return Math.min(100, Math.round((value / target) * 100));
  };

  return (
    <div className="space-y-6" id="diet-container">
      {/* Banner Principal de Progresso Diário */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100/80 vibrant-card-glow-pink" id="diet-progress-header">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
          <div className="flex items-center space-x-3 text-center md:text-left">
            <span className="p-3 bg-gradient-to-tr from-amber-400 to-rose-500 text-white rounded-2xl shadow-sm" id="diet-drumstick-badge">
              <Drumstick className="w-6 h-6 animate-pulse" />
            </span>
            <div>
              <h2 className="text-xl font-display font-bold text-slate-800">Controle Nutricional Diário</h2>
              <p className="text-[11px] text-slate-400 font-semibold">Monitore calorias consumidas, proteínas, carboidratos e gorduras hoje.</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto justify-center md:justify-end">
            {/* Botão para Editar Metas */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition flex items-center space-x-1.5 cursor-pointer"
              id="toggleSettingsBtn"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Ajustar Metas</span>
            </button>

            {/* /!\ UPDATE DESIGN: BOTÃO ADICIONAR DIETA ESCRITA */}
            <button
              onClick={() => setShowWrittenDiet(!showWrittenDiet)}
              className="p-2.5 px-4 bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-95 text-white text-xs font-bold rounded-xl border-none transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
              id="toggleWrittenDietBtn"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Dieta Escrita</span>
              {showWrittenDiet ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* FEEDBACK DE METAS: VERDE OU VERMELHO COMO SOLICITADO */}
        <div className="mt-4" id="visual-calorie-feedback">
          {isCalExceeded ? (
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-rose-800 flex items-center space-x-3" id="cal-exceeded-alert">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div className="text-sm font-bold">
                Atenção! Você já <span className="underline">ultrapassou</span> a meta de hoje em <span className="text-lg font-extrabold text-rose-700">{Math.abs(calDifference)} kcal</span>! Maneje seu consumo calórico pelo restante do dia.
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-250 text-emerald-800 flex items-center space-x-3" id="cal-remaining-alert">
              <Check className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-sm font-bold">
                Tudo sob controle! Ainda restam <span className="text-lg font-extrabold text-emerald-700">{calDifference} kcal</span> para você atingir seu objetivo diário.
              </div>
            </div>
          )}
        </div>

        {/* Barra de Progresso de Calorias Geral */}
        <div className="mt-6" id="general-calories-progress">
          <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5">
            <span>CONSUMIDO: {totalCalories} kcal</span>
            <span>META: {dietSettings.targetCalories} kcal</span>
          </div>
          <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden" id="calorie-progress-bar-container">
            <div 
              className={`h-full transition-all duration-500 ${isCalExceeded ? 'bg-rose-500' : 'bg-emerald-500'}`} 
              style={{ width: `${getProgressPercent(totalCalories, dietSettings.targetCalories)}%` }}
              id="calorie-progress-fill"
            />
          </div>
          <p className="text-right text-2xs text-slate-400 font-semibold mt-1">
            Progresso Geral: {getProgressPercent(totalCalories, dietSettings.targetCalories)}%
          </p>
        </div>
      </div>

      {/* Formulário Ajustar Dieta (Metas) - Expansível */}
      {showSettings && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-fadeIn" id="diet-settings-panel">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-slate-500" />
            Configurar Metas de Nutrição Integrada
          </h3>

          <form onSubmit={handleSettingsSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4" id="settings-form">
            <div>
              <label htmlFor="settingsCalories" className="block text-2xs font-bold text-slate-500 uppercase mb-1">Meta Calórica (kcal)</label>
              <input
                id="settingsCalories"
                type="number"
                required
                value={targetCalories}
                onChange={(e) => setTargetCalories(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label htmlFor="settingsProtein" className="block text-2xs font-bold text-slate-500 uppercase mb-1">Proteínas (g)</label>
              <input
                id="settingsProtein"
                type="number"
                required
                value={targetProtein}
                onChange={(e) => setTargetProtein(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label htmlFor="settingsCarbs" className="block text-2xs font-bold text-slate-500 uppercase mb-1">Carboidratos (g)</label>
              <input
                id="settingsCarbs"
                type="number"
                required
                value={targetCarbs}
                onChange={(e) => setTargetCarbs(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label htmlFor="settingsFat" className="block text-2xs font-bold text-slate-500 uppercase mb-1">Gorduras (g)</label>
              <input
                id="settingsFat"
                type="number"
                required
                value={targetFat}
                onChange={(e) => setTargetFat(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="md:col-span-4 flex justify-end space-x-2" id="settings-form-actions">
              {settingsSuccess && (
                <span className="text-emerald-600 text-xs font-bold flex items-center pr-2">
                  ✓ Metas salvas localmente!
                </span>
              )}
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="p-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                id="saveDietGoalsBtn"
                type="submit"
                className="p-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition"
              >
                Salvar Metas
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sessão da Dieta Escrita (Escondida por padrão) */}
      {showWrittenDiet && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition animate-fadeIn" id="written-diet-panel">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-indigo-500" />
              <h3 className="text-base font-bold text-slate-800">Sua Dieta Escrita / Rotina de Refeições</h3>
            </div>
            
            {isEditingWrittenDiet ? (
              <div className="space-x-1.5" id="editing-diet-actions">
                <button
                  onClick={() => {
                    setWrittenDietRaw(dietSettings.writtenDiet);
                    setIsEditingWrittenDiet(false);
                  }}
                  className="p-1 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-2xs font-bold rounded"
                >
                  Cancelar
                </button>
                <button
                  id="saveWrittenDietBtn"
                  onClick={saveWrittenDiet}
                  className="p-1 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-2xs font-bold rounded"
                >
                  Salvar Dieta
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingWrittenDiet(true)}
                className="text-indigo-600 hover:text-indigo-800 text-xs font-bold"
                id="editWrittenDietBtn"
              >
                Editar Rotina
              </button>
            )}
          </div>

          {isEditingWrittenDiet ? (
            <div id="written-diet-textarea-wrapper">
              <textarea
                id="writtenDietTextarea"
                value={writtenDietRaw}
                onChange={(e) => setWrittenDietRaw(e.target.value)}
                rows={12}
                placeholder="Exemplo: Crie seus horários de refeição de forma detalhada aqui para sua consulta rápida diária..."
                className="w-full text-xs font-mono p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:ring-1 focus:ring-indigo-500 transition"
              />
              <p className="text-3xs text-slate-400 mt-1">Você pode formatar suas refeições listadas detalhadamente por horários.</p>
            </div>
          ) : (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100" id="written-diet-preview">
              {dietSettings.writtenDiet ? (
                <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{dietSettings.writtenDiet}</pre>
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">Você ainda não tem uma dieta escrita cadastrada. Toque em "Editar Rotina" para começar.</p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="diet-forms-macros-row">
        {/* Adicionar Registro de Refeição */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-1" id="add-meal-card">
          <div className="flex items-center space-x-2 mb-4">
            <span className="p-1 px-2.5 bg-indigo-50 text-indigo-700 text-xs rounded font-bold">1</span>
            <h3 className="text-base font-bold text-slate-800">Registrar Refeição</h3>
          </div>

          <form onSubmit={handleMealSubmit} className="space-y-4" id="meal-form">
            <div>
              <label htmlFor="mealNameInput" className="block text-xs font-bold text-slate-600 mb-1">Refeição / Alimento</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    id="mealNameInput"
                    type="text"
                    required
                    placeholder="Ex: Pão de sal, Whey protein, Almoço..."
                    value={mealName}
                    onChange={(e) => {
                      setMealName(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="w-full text-sm p-3 pr-9 border border-slate-100 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />

                  {/* Sugestões inteligentes do histórico local */}
                  {showSuggestions && mealName.trim() && suggestedMeals.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-slate-150 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-50">
                      {suggestedMeals.map((meal) => (
                        <div key={meal.id} className="group flex items-center justify-between hover:bg-slate-50 pr-2 transition">
                          <button
                            type="button"
                            onMouseDown={() => {
                              setMealName(meal.name || '');
                              setMealCalories(String(meal.calories));
                              setMealProtein(String(meal.protein));
                              setMealCarbs(String(meal.carbs));
                              setMealFat(String(meal.fat));
                              setShowSuggestions(false);
                            }}
                            className="flex-1 text-left p-3 px-4 text-xs transition flex flex-col gap-0.5 cursor-pointer"
                          >
                            <span className="font-bold text-slate-700">{meal.name}</span>
                            <span className="text-3xs text-slate-400">
                              {meal.calories} kcal • P: {meal.protein}g • C: {meal.carbs}g • G: {meal.fat}g
                            </span>
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (meal.name) {
                                handleExcludeSuggestion(meal.name);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition cursor-pointer md:opacity-0 group-hover:opacity-100 shrink-0"
                            title="Excluir sugestão"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Botão de Estimativa com IA */}
                <button
                  type="button"
                  onClick={handleFetchAiMacros}
                  disabled={isAiLoading || !mealName.trim()}
                  className="p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition flex items-center justify-center border border-indigo-100/50 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer"
                  title="Estimar nutrientes com Inteligência Artificial"
                >
                  {isAiLoading ? (
                    <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                </button>

                {/* Botão de Envio Rápido */}
                <button
                  type="button"
                  onClick={() => handleMealSubmit()}
                  disabled={!mealCalories || isNaN(parseFloat(mealCalories))}
                  className="p-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  title="Confirmar e registrar refeição"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="mealCaloriesInput" className="block text-xs font-bold text-slate-600 mb-1">Calorias (kcal)</label>
              <input
                id="mealCaloriesInput"
                type="number"
                required
                placeholder="Ex: 450"
                value={mealCalories}
                onChange={(e) => setMealCalories(e.target.value)}
                className="w-full text-sm p-3 border border-slate-100 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label htmlFor="mealProteinInput" className="block text-2xs font-bold text-slate-600 mb-1">Prot (g)</label>
                <input
                  id="mealProteinInput"
                  type="number"
                  placeholder="Ex: 35"
                  value={mealProtein}
                  onChange={(e) => setMealProtein(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-100 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition"
                />
              </div>

              <div>
                <label htmlFor="mealCarbsInput" className="block text-2xs font-bold text-slate-600 mb-1">Carb (g)</label>
                <input
                  id="mealCarbsInput"
                  type="number"
                  placeholder="Ex: 40"
                  value={mealCarbs}
                  onChange={(e) => setMealCarbs(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-100 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition"
                />
              </div>

              <div>
                <label htmlFor="mealFatInput" className="block text-2xs font-bold text-slate-600 mb-1">Gord (g)</label>
                <input
                  id="mealFatInput"
                  type="number"
                  placeholder="Ex: 12"
                  value={mealFat}
                  onChange={(e) => setMealFat(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-100 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="mealDateInput" className="block text-xs font-bold text-slate-600 mb-1">Data</label>
              <input
                id="mealDateInput"
                type="date"
                required
                value={mealDate}
                onChange={(e) => setMealDate(e.target.value)}
                className="w-full text-sm p-3 border border-slate-100 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition"
              />
            </div>

            {mealSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl flex items-center space-x-1.5" id="meal-added-feedback">
                <Check className="w-4 h-4" />
                <span>Refeição registrada localmente!</span>
              </div>
            )}

            <button
              id="submitMealBtn"
              type="submit"
              className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm p-3 rounded-xl transition shadow shadow-rose-100 flex items-center justify-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Alimento</span>
            </button>
          </form>
        </div>

        {/* Progresso de Macronutrientes (Gráficos Individuais) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 flex flex-col justify-between" id="macros-progress-card">
          <div className="flex items-center space-x-2 mb-4">
            <span className="p-1 px-2.5 bg-indigo-50 text-indigo-700 text-xs rounded font-bold">2</span>
            <h3 className="text-base font-bold text-slate-800">Distribuição Nutricional Consumida</h3>
          </div>

          <div className="space-y-4 flex-1 flex flex-col justify-around" id="macros-details-bars">
            {/* Proteínas */}
            <div id="protein-bar-monitor">
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700">Proteína (Meta: {dietSettings.targetProtein}g)</span>
                <span className="text-blue-600">{totalProtein}g / {dietSettings.targetProtein}g</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${getProgressPercent(totalProtein, dietSettings.targetProtein)}%` }}
                />
              </div>
              <div className="flex justify-between text-3xs text-slate-400 mt-1 font-semibold">
                <span>{getProgressPercent(totalProtein, dietSettings.targetProtein)}% completo</span>
                <span className={protDiff < 0 ? 'text-rose-500' : 'text-slate-400'}>
                  {protDiff < 0 ? `Excedido por ${Math.abs(protDiff)}g` : `Faltam ${protDiff}g`}
                </span>
              </div>
            </div>

            {/* Carboidratos */}
            <div id="carbs-bar-monitor">
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700">Carboidrato (Meta: {dietSettings.targetCarbs}g)</span>
                <span className="text-emerald-600">{totalCarbs}g / {dietSettings.targetCarbs}g</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${getProgressPercent(totalCarbs, dietSettings.targetCarbs)}%` }}
                />
              </div>
              <div className="flex justify-between text-3xs text-slate-400 mt-1 font-semibold">
                <span>{getProgressPercent(totalCarbs, dietSettings.targetCarbs)}% completo</span>
                <span className={carbDiff < 0 ? 'text-rose-500' : 'text-slate-400'}>
                  {carbDiff < 0 ? `Excedido por ${Math.abs(carbDiff)}g` : `Faltam ${carbDiff}g`}
                </span>
              </div>
            </div>

            {/* Gorduras */}
            <div id="fat-bar-monitor">
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700">Gordura (Meta: {dietSettings.targetFat}g)</span>
                <span className="text-amber-600">{totalFat}g / {dietSettings.targetFat}g</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${getProgressPercent(totalFat, dietSettings.targetFat)}%` }}
                />
              </div>
              <div className="flex justify-between text-3xs text-slate-400 mt-1 font-semibold">
                <span>{getProgressPercent(totalFat, dietSettings.targetFat)}% completo</span>
                <span className={fatDiff < 0 ? 'text-rose-500' : 'text-slate-400'}>
                  {fatDiff < 0 ? `Excedido por ${Math.abs(fatDiff)}g` : `Faltam ${fatDiff}g`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Histórico de Comidas do Dia */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100" id="today-meals-history-card">
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-1.5">
          <UtensilsCrossed className="w-5 h-5 text-rose-500" />
          Registros Cadastrados Hoje ({todayMeals.length})
        </h3>

        <div className="overflow-x-auto" id="meals-table-wrapper">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase font-extrabold tracking-wider">
                <th className="py-3 px-4">Refeição / Horário</th>
                <th className="py-3 px-4">Calorias</th>
                <th className="py-3 px-4">Proteínas</th>
                <th className="py-3 px-4">Carboidratos</th>
                <th className="py-3 px-4">Gorduras</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {todayMeals.map((meal) => (
                <tr key={meal.id} className="border-b border-slate-50 hover:bg-slate-50 transition font-medium" id={`meal-tr-${meal.id}`}>
                  <td className="py-3.5 px-4 font-semibold text-slate-500">
                    <div className="font-bold text-slate-800">{meal.name || 'Refeição'}</div>
                    <div className="text-3xs text-slate-400 mt-0.5">{meal.createdAt || '--:--'}</div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-rose-600">{meal.calories} kcal</td>
                  <td className="py-3.5 px-4 font-semibold text-blue-600">{meal.protein}g</td>
                  <td className="py-3.5 px-4 font-semibold text-emerald-600">{meal.carbs}g</td>
                  <td className="py-3.5 px-4 font-semibold text-amber-600">{meal.fat}g</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onDeleteMeal(meal.id)}
                      className="p-1 px-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition text-2xs font-bold"
                      title="Excluir lançamentos"
                      id={`delete-meal-btn-${meal.id}`}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
              {todayMeals.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center font-semibold py-8 text-slate-400">Nenhum alimento ou refeição cadastrado hoje.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
