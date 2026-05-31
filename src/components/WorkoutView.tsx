import React, { useState } from 'react';
import { Workout } from '../types';
import { 
  Dumbbell, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  Search,
  CheckCircle,
  Archive
} from 'lucide-react';

interface WorkoutViewProps {
  workouts: Workout[];
  onAddWorkout: (workout: Omit<Workout, 'id'>) => void;
  onToggleWorkout: (id: string) => void;
  onDeleteWorkout: (id: string) => void;
  onClearCompleted: () => void;
}

export function WorkoutView({
  workouts,
  onAddWorkout,
  onToggleWorkout,
  onDeleteWorkout,
  onClearCompleted
}: WorkoutViewProps) {
  const [workoutName, setWorkoutName] = useState('');
  const [series, setSeries] = useState('3');
  const [repetitions, setRepetitions] = useState('12');
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(() => {
    // Retorna a data de hoje formatada em DD/MM/AAAA por padrão
    const d = new Date('2026-05-31T17:15:51Z');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [successToast, setSuccessToast] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workoutName.trim()) return;

    onAddWorkout({
      name: workoutName,
      series: parseInt(series) || 3,
      repetitions: parseInt(repetitions) || 10,
      weight: weight ? parseFloat(weight) : undefined,
      date: date.trim() || undefined,
      completed: false
    });

    setWorkoutName('');
    setWeight('');
    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 3000);
  };

  const filteredWorkouts = workouts.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingWorkouts = filteredWorkouts.filter(w => !w.completed);
  const completedWorkouts = filteredWorkouts.filter(w => w.completed);

  return (
    <div className="space-y-6" id="workouts-container">
      {/* Banner Principal */}
      <div className="bg-gradient-to-tr from-indigo-600 via-pink-500 to-pink-600 text-white rounded-3xl p-6 shadow-md flex flex-col md:flex-row items-center justify-between" id="workouts-banner">
        <div className="mb-4 md:mb-0 text-center md:text-left">
          <div className="inline-flex items-center space-x-2 bg-white/20 p-1 px-3.5 rounded-full text-xs font-extrabold backdrop-blur-xs mb-2 text-white">
            <Dumbbell className="w-4 h-4" />
            <span className="uppercase tracking-widest text-[10px]">Ficha de Exercícios</span>
          </div>
          <h2 className="text-2xl font-display font-black tracking-tight">Gerenciador de Treinos</h2>
          <p className="text-xs text-white/90 mt-1 max-w-md font-medium">
            Organize suas rotinas, séries, repetições e cargas para alcançar e superar seus recordes físicos de maneira inteligente.
          </p>
        </div>
        <div className="text-center md:text-right bg-white/10 p-4 rounded-2xl backdrop-blur-xs border border-white/10" id="workouts-completion-badge">
          <p className="text-[10px] text-pink-100 uppercase tracking-widest font-black">Meta Diária</p>
          <p className="text-3xl md:text-4xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-white to-cyan-200">
            {workouts.filter(w => w.completed).length} / {workouts.length}
          </p>
          <p className="text-[10px] text-white/90 font-bold mt-1">Exercícios finalizados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="workouts-main-grid">
        {/* Formulário - Adicionar Treino */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100/80 h-fit vibrant-card-glow-indigo" id="add-workout-card">
          <h3 className="text-base font-display font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-pink-500" />
            Adicionar Novo Exercício
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4" id="workout-form">
            <div>
              <label htmlFor="inputWorkoutName" className="block text-xs font-bold text-slate-600 mb-1">Nome do Exercício / Treino</label>
              <input
                id="inputWorkoutName"
                type="text"
                required
                placeholder="Ex: Supino Inclinado, Cadeira Extensora"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                className="w-full text-sm p-3 border border-slate-100 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="inputSeries" className="block text-xs font-bold text-slate-600 mb-1">Séries</label>
                <input
                  id="inputSeries"
                  type="number"
                  min="1"
                  required
                  placeholder="Ex: 4"
                  value={series}
                  onChange={(e) => setSeries(e.target.value)}
                  className="w-full text-sm p-3 border border-slate-100 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition"
                />
              </div>

              <div>
                <label htmlFor="inputReps" className="block text-xs font-bold text-slate-600 mb-1">Repetições</label>
                <input
                  id="inputReps"
                  type="number"
                  min="1"
                  required
                  placeholder="Ex: 12"
                  value={repetitions}
                  onChange={(e) => setRepetitions(e.target.value)}
                  className="w-full text-sm p-3 border border-slate-100 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="inputWeightCol" className="block text-xs font-bold text-slate-600 mb-1">Carga (kg - Opcional)</label>
                <div className="relative">
                  <input
                    id="inputWeightCol"
                    type="number"
                    min="0"
                    placeholder="Ex: 50"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full text-sm p-3 border border-slate-100 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition"
                  />
                  <span className="absolute right-3 top-3 text-xs font-semibold text-slate-400">kg</span>
                </div>
              </div>

              <div>
                <label htmlFor="inputWorkoutDate" className="block text-xs font-bold text-slate-600 mb-1">Data (Opcional)</label>
                <input
                  id="inputWorkoutDate"
                  type="text"
                  placeholder="Ex: 31/05/2026"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-sm p-3 border border-slate-100 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition"
                />
              </div>
            </div>

            {successToast && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl flex items-center space-x-2" id="workout-added-success">
                <CheckCircle className="w-4 h-4" />
                <span>Treino adicionado com sucesso localmente!</span>
              </div>
            )}

             <button
              id="submitWorkoutBtn"
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 via-pink-500 to-pink-600 hover:opacity-95 text-white font-bold text-sm p-3.5 rounded-xl transition-all shadow-md shadow-pink-100 flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>Adicionar Exercício</span>
            </button>
          </form>
        </div>

        {/* Listagem de Treinos */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100/80 flex flex-col vibrant-card-glow-pink" id="workouts-list-card">
          {/* Top da listagem com busca e filtros */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-base font-display font-bold text-slate-800">Exercícios Cadastrados</h3>
              <p className="text-[11px] text-slate-400 font-semibold">Dê check ao concluir cada exercício e controle seu histórico diário.</p>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar exercício..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs p-2.5 pl-9 pr-4 w-full sm:w-48 border border-slate-100 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition"
              />
            </div>
          </div>

          {workouts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12" id="workouts-empty-state">
              <Dumbbell className="w-12 h-12 text-slate-200 stroke-[1.5] mb-3 animate-pulse" />
              <p className="text-sm font-semibold text-slate-700">Sua lista de exercícios está vazia</p>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                Adicione seu primeiro treino no painel ao lado para começar seu controle diário de exercícios.
              </p>
            </div>
          ) : (
            <div className="space-y-6 flex-1" id="workouts-sections flex-1">
              {/* Exercícios Pendentes */}
              {pendingWorkouts.length > 0 && (
                <div id="pending-workouts-section">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    Em Aberto / Para Fazer ({pendingWorkouts.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="pending-workouts-grid">
                    {pendingWorkouts.map((w) => (
                      <div 
                        key={w.id} 
                        className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/10 transition-all flex flex-col justify-between"
                        id={`workout-item-${w.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <button 
                            onClick={() => onToggleWorkout(w.id)}
                            className="flex items-start text-left space-x-3 group"
                            title="Marcar como Completo"
                            id={`toggle-workout-btn-${w.id}`}
                          >
                            <Circle className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-bold text-slate-800 break-words line-clamp-1 group-hover:text-indigo-600 transition">{w.name}</p>
                              <div className="flex items-center space-x-1.5 mt-1 text-slate-400">
                                <Calendar className="w-3.5 h-3.5 shrink-0" />
                                <span className="text-2xs font-medium">{w.date || 'Sem data definida'}</span>
                              </div>
                            </div>
                          </button>
                          <button 
                            onClick={() => onDeleteWorkout(w.id)}
                            className="p-1 text-slate-300 hover:text-rose-500 rounded transition"
                            title="Excluir"
                            id={`delete-workout-btn-${w.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        
                        <div className="divider border-b border-slate-100/50 my-3" />

                        <div className="flex items-center justify-between text-xs mt-1 bg-white p-2.5 rounded-lg border border-slate-100" id={`workout-specs-${w.id}`}>
                          <div>
                            <span className="text-3xs font-extrabold text-slate-400 uppercase block tracking-wider">Séries</span>
                            <span className="text-sm font-bold text-indigo-700">{w.series} séries</span>
                          </div>
                          <div>
                            <span className="text-3xs font-extrabold text-slate-400 uppercase block tracking-wider">Repetições</span>
                            <span className="text-sm font-bold text-indigo-700">{w.repetitions} reps</span>
                          </div>
                          <div>
                            <span className="text-3xs font-extrabold text-slate-400 uppercase block tracking-wider">Carga</span>
                            <span className="text-sm font-bold text-indigo-700">{w.weight ? `${w.weight} kg` : '--'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exercícios Concluídos */}
              {completedWorkouts.length > 0 && (
                <div id="completed-workouts-section">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Exercícios Concluídos ({completedWorkouts.length})
                    </h4>
                    <button 
                      onClick={onClearCompleted}
                      className="text-2xs text-slate-400 hover:text-rose-500 transition font-semibold"
                      id="clearCompletedBtn"
                    >
                      Limpar Concluídos
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="completed-workouts-grid">
                    {completedWorkouts.map((w) => (
                      <div 
                        key={w.id} 
                        className="p-4 bg-emerald-50/20 rounded-xl border border-emerald-100 hover:border-emerald-200 transition-all flex flex-col justify-between opacity-80"
                        id={`workout-completed-item-${w.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <button 
                            onClick={() => onToggleWorkout(w.id)}
                            className="flex items-start text-left space-x-3"
                            title="Marcar como Pendente"
                            id={`toggle-completed-workout-${w.id}`}
                          >
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-bold text-slate-700 break-words line-clamp-1 line-through">{w.name}</p>
                              <div className="flex items-center space-x-1.5 mt-1 text-slate-400">
                                <Calendar className="w-3.5 h-3.5 shrink-0" />
                                <span className="text-2xs font-medium">{w.date || 'Sem data'}</span>
                              </div>
                            </div>
                          </button>
                          <button 
                            onClick={() => onDeleteWorkout(w.id)}
                            className="p-1 text-slate-300 hover:text-rose-500 rounded transition"
                            title="Excluir"
                            id={`delete-completed-workout-${w.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        
                        <div className="divider border-b border-emerald-100 my-3" />

                        <div className="flex items-center justify-between text-xs mt-1 bg-white/70 p-2.5 rounded-lg border border-emerald-50" id={`workout-specs-completed-${w.id}`}>
                          <div>
                            <span className="text-3xs font-extrabold text-slate-400 uppercase block tracking-wider">Séries</span>
                            <span className="text-sm font-semibold text-emerald-800">{w.series} séries</span>
                          </div>
                          <div>
                            <span className="text-3xs font-extrabold text-slate-400 uppercase block tracking-wider">Repetições</span>
                            <span className="text-sm font-semibold text-emerald-800">{w.repetitions} reps</span>
                          </div>
                          <div>
                            <span className="text-3xs font-extrabold text-slate-400 uppercase block tracking-wider">Carga</span>
                            <span className="text-sm font-semibold text-emerald-800">{w.weight ? `${w.weight} kg` : '--'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
