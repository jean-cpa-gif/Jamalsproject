import React, { useState } from 'react';
import { Task, TaskList, TaskDailyGoal, TaskFilter, Subtask } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, CheckCircle, Circle, Trash2, Edit2, Calendar, 
  Sun, Moon, ListTodo, ShoppingBag, GripVertical, ChevronDown, ChevronRight, PieChart as PieChartIcon, Eye, EyeOff, BookText as BookTextIcon, X as XIcon, Undo2, PlusCircle
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface TaskViewProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  taskLists: TaskList[];
  setTaskLists: React.Dispatch<React.SetStateAction<TaskList[]>>;
  taskGoal: TaskDailyGoal;
  setTaskGoal: React.Dispatch<React.SetStateAction<TaskDailyGoal>>;
}

export const TaskView: React.FC<TaskViewProps> = ({
  tasks,
  setTasks,
  taskLists,
  setTaskLists,
  taskGoal,
  setTaskGoal
}) => {
  const [activeListId, setActiveListId] = useState<string>(taskLists[0]?.id || '');
  const [activeFilter, setActiveFilter] = useState<TaskFilter>('all');
  
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Drag and Drop State
  const [hideCompleted, setHideCompleted] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  
  const [undoStack, setUndoStack] = useState<Task[][]>([]);

  const updateTasksWithUndo = (newTasksOrFn: React.SetStateAction<Task[]>) => {
    setUndoStack(stack => [...stack.slice(-19), tasks]);
    setTasks(newTasksOrFn);
  };

  const undoLastAction = () => {
    setUndoStack(prevStack => {
      if (prevStack.length === 0) return prevStack;
      const newStack = [...prevStack];
      const previousTasks = newStack.pop();
      if (previousTasks) {
        setTasks(previousTasks);
      }
      return newStack;
    });
  };

  const getFilteredTasks = () => {
    let filtered = tasks.filter(t => t.listId === activeListId);
    if (activeFilter !== 'all') {
      if (activeFilter === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        filtered = filtered.filter(t => t.dueDate === todayStr || t.filterTag === 'today');
      } else if (activeFilter === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomStr = tomorrow.toISOString().split('T')[0];
        filtered = filtered.filter(t => t.dueDate === tomStr || t.filterTag === 'tomorrow');
      } else {
        filtered = filtered.filter(t => t.filterTag === activeFilter);
      }
    }
    
    if (searchQuery.trim()) {
      filtered = filtered.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    if (hideCompleted) {
      filtered = filtered.filter(t => !t.completed);
    }
    
    return filtered.sort((a, b) => a.order - b.order);
  };
  
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    let dueDate = '';
    if (activeFilter === 'today') dueDate = new Date().toISOString().split('T')[0];
    else if (activeFilter === 'tomorrow') {
      const tom = new Date();
      tom.setDate(tom.getDate() + 1);
      dueDate = tom.toISOString().split('T')[0];
    }

    const newTask: Task = {
      id: 't-' + Date.now(),
      listId: activeListId,
      title: newTaskTitle,
      description: '',
      completed: false,
      dueDate,
      createdAt: new Date().toISOString(),
      filterTag: activeFilter === 'all' ? 'none' : activeFilter,
      subtasks: [],
      order: tasks.length
    };

    updateTasksWithUndo(prev => [...prev, newTask]);
    setNewTaskTitle('');
  };

  const handleToggleTask = (id: string) => {
    updateTasksWithUndo(prev => {
      const newTasks = [...prev];
      const taskIndex = newTasks.findIndex(t => t.id === id);
      if (taskIndex === -1) return prev;
      
      const task = newTasks[taskIndex];
      const isCompleting = !task.completed;
      
      const updatedTasks = newTasks.map(t => 
        t.id === id ? { ...t, completed: isCompleting } : t
      );
      
      if (isCompleting && task.repeat && task.repeat !== 'none') {
        const remainingTimes = task.repeatTimesLeft !== undefined ? task.repeatTimesLeft : (task.repeatTimes || -1);

        if (remainingTimes !== 0) {
          const nextDate = new Date(task.dueDate || new Date().toISOString().split('T')[0]);
          nextDate.setMinutes(nextDate.getMinutes() + nextDate.getTimezoneOffset());
          
          if (task.repeat === 'daily') {
             nextDate.setDate(nextDate.getDate() + 1);
          } else if (task.repeat === 'weekdays') {
             nextDate.setDate(nextDate.getDate() + 1);
             if (nextDate.getDay() === 6) nextDate.setDate(nextDate.getDate() + 2);
             else if (nextDate.getDay() === 0) nextDate.setDate(nextDate.getDate() + 1);
          } else if (task.repeat === 'weekly') {
             nextDate.setDate(nextDate.getDate() + 7);
          } else if (task.repeat === 'monthly') {
             nextDate.setMonth(nextDate.getMonth() + 1);
          } else if (task.repeat === 'custom_days') {
             nextDate.setDate(nextDate.getDate() + Math.max(1, task.repeatCustomDays || 1));
          } else if (task.repeat === 'infinite') {
             // Same date
          }
          
          const nextDateStr = nextDate.toISOString().split('T')[0];
          updatedTasks.push({
            ...task,
            id: 't-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
            completed: false,
            dueDate: nextDateStr,
            createdAt: new Date().toISOString(),
            repeatTimesLeft: remainingTimes > 0 ? remainingTimes - 1 : undefined
          });
        }
      }
      
      return updatedTasks;
    });
  };

  const handleDeleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    updateTasksWithUndo(prev => prev.filter(t => t.id !== id));
  };

  const handleUpdateTask = (id: string, updates: Partial<Task>) => {
    updateTasksWithUndo(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const handleAddSubtask = (taskId: string, subtaskTitle: string) => {
    if (!subtaskTitle.trim()) return;
    updateTasksWithUndo(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          subtasks: [...t.subtasks, { id: 'st-' + Date.now(), title: subtaskTitle, completed: false }]
        };
      }
      return t;
    }));
  };

  const handleToggleSubtask = (taskId: string, subId: string) => {
    updateTasksWithUndo(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          subtasks: t.subtasks.map(s => s.id === subId ? { ...s, completed: !s.completed } : s)
        };
      }
      return t;
    }));
  };

  const handleUpdateSubtask = (taskId: string, subId: string, title: string) => {
    updateTasksWithUndo(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          subtasks: t.subtasks.map(s => s.id === subId ? { ...s, title } : s)
        };
      }
      return t;
    }));
  };

  const handleDeleteSubtask = (taskId: string, subId: string) => {
    updateTasksWithUndo(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          subtasks: t.subtasks.filter(s => s.id !== subId)
        };
      }
      return t;
    }));
  };

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTaskId(id);
    // Firefox requires some data to be transferred
    e.dataTransfer.setData('text/plain', id);
    if(e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    if(e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedTaskId || draggedTaskId === targetId) return;

    let newTasks = [...tasks];
    const draggedIndex = newTasks.findIndex(t => t.id === draggedTaskId);
    const targetIndex = newTasks.findIndex(t => t.id === targetId);

    if (draggedIndex > -1 && targetIndex > -1) {
      // Reorder
      const [draggedItem] = newTasks.splice(draggedIndex, 1);
      newTasks.splice(targetIndex, 0, draggedItem);
      
      // Update order property based on current view to ensure persistence
      const currentListTasks = newTasks.filter(t => t.listId === activeListId);
      currentListTasks.forEach((t, i) => {
        const idx = newTasks.findIndex(nt => nt.id === t.id);
        if (idx !== -1) newTasks[idx].order = i;
      });
      
      updateTasksWithUndo(newTasks);
    }
    setDraggedTaskId(null);
  };

  // Stats
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.dueDate === todayStr || t.filterTag === 'today');
  const completedToday = todayTasks.filter(t => t.completed).length;
  const targetCompleted = taskGoal.targetTasks || 1;
  const progressText = `${completedToday} / ${targetCompleted}`;
  
  const pieData = [
    { name: 'Concluídas', value: completedToday, color: '#10b981' },
    { name: 'Restantes', value: Math.max(0, targetCompleted - completedToday), color: '#cbd5e1' }
  ];

  return (
    <div className="space-y-6 animate-fade-in" id="tasks-container">
      {/* Banner / Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100/80 flex flex-col md:flex-row items-center justify-between vibrant-card-glow-indigo dark:bg-slate-800 dark:border-slate-700">
        <div className="mb-4 md:mb-0 text-center md:text-left">
          <div className="inline-flex items-center space-x-2 bg-indigo-50 text-indigo-600 p-1 px-3.5 rounded-full text-xs font-bold mb-2 dark:bg-indigo-900/30 dark:text-indigo-400">
            <ListTodo className="w-4 h-4" />
            <span>Suas Tarefas & Listas</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-extrabold text-slate-800 dark:text-white">
            Organize seu Dia
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1 max-w-sm dark:text-slate-400">
            Acompanhe o que precisa ser feito e nunca esqueça os itens do mercado.
          </p>
        </div>
        
        {/* Gráfico de Progresso */}
        <div className="flex items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 dark:bg-slate-900/50 dark:border-slate-700/50">
          <div className="w-20 h-20 mr-4 relative">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={35}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
             <div className="absolute inset-0 flex items-center justify-center">
               <PieChartIcon className="w-6 h-6 text-slate-400 dark:text-slate-500 opacity-20" />
             </div>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black dark:text-slate-400">Tarefas Hoje</p>
            <p className="text-2xl font-display font-extrabold text-indigo-600 dark:text-indigo-400">
              {progressText}
            </p>
             <div className="flex items-center mt-1">
                <button 
                  onClick={() => setTaskGoal(p => ({...p, targetTasks: Math.max(1, p.targetTasks - 1)}))}
                  className="w-5 h-5 flex items-center justify-center bg-slate-200 rounded-md text-slate-600 hover:bg-slate-300 transition-colors text-xs font-bold dark:bg-slate-700 dark:text-slate-300"
                >-</button>
                <span className="text-xs text-slate-500 font-medium mx-2 dark:text-slate-400">Meta</span>
                <button 
                  onClick={() => setTaskGoal(p => ({...p, targetTasks: p.targetTasks + 1}))}
                  className="w-5 h-5 flex items-center justify-center bg-slate-200 rounded-md text-slate-600 hover:bg-slate-300 transition-colors text-xs font-bold dark:bg-slate-700 dark:text-slate-300"
                >+</button>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Esquerda - Listas e Filtros */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100/80 dark:bg-slate-800 dark:border-slate-700">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2 dark:text-slate-500">Listas</h3>
            <div className="space-y-1">
              {taskLists.map(list => (
                <button
                  key={list.id}
                  onClick={() => setActiveListId(list.id)}
                  className={`w-full flex items-center p-2.5 rounded-xl transition-all text-sm font-medium cursor-pointer ${
                    activeListId === list.id 
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' 
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {list.name === 'Lista de Compras' ? <ShoppingBag className="w-4 h-4 mr-2.5" /> : <ListTodo className="w-4 h-4 mr-2.5" />}
                  {list.name}
                </button>
              ))}
              {isAddingList ? (
                <div className="px-2 mt-2">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Nome da Lista"
                    value={newListTitle}
                    onChange={e => setNewListTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                         if(newListTitle.trim()) {
                           setTaskLists(p => [...p, { id: 'list-' + Date.now(), name: newListTitle.trim(), order: p.length }]);
                           setNewListTitle('');
                           setIsAddingList(false);
                         }
                      } else if (e.key === 'Escape') {
                         setIsAddingList(false);
                      }
                    }}
                    onBlur={() => {
                       if(newListTitle.trim()) {
                           setTaskLists(p => [...p, { id: 'list-' + Date.now(), name: newListTitle.trim(), order: p.length }]);
                       }
                       setNewListTitle('');
                       setIsAddingList(false);
                    }}
                    className="w-full text-sm p-1.5 rounded border border-indigo-300 dark:border-indigo-600 dark:bg-slate-800 dark:text-white focus:outline-none"
                  />
                </div>
              ) : (
                <div className="px-2 mt-2">
                  <button 
                    onClick={() => setIsAddingList(true)}
                    className="text-xs flex items-center text-indigo-500 hover:text-indigo-600 font-bold transition-all dark:text-indigo-400"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Nova Lista
                  </button>
                </div>
              )}
            </div>
            
            <div className="my-5 border-t border-slate-100 dark:border-slate-700"></div>

            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2 dark:text-slate-500">Filtros</h3>
            <div className="space-y-1">
              {[
                { id: 'all', icon: ListTodo, label: 'Todas' },
                { id: 'today', icon: Sun, label: 'Hoje' },
                { id: 'tomorrow', icon: Calendar, label: 'Amanhã' },
                { id: 'morning', icon: Sun, label: 'Manhã' },
                { id: 'afternoon', icon: Moon, label: 'Tarde' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id as TaskFilter)}
                  className={`w-full flex items-center p-2.5 rounded-xl transition-all text-sm font-medium cursor-pointer ${
                    activeFilter === f.id 
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' 
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <f.icon className="w-4 h-4 mr-2.5" />
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Área Principal de Tarefas */}
        <div className="md:col-span-3">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100/80 min-h-[500px] dark:bg-slate-800 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h3 className="text-xl font-display font-bold text-slate-800 flex items-center dark:text-white">
                {taskLists.find(l => l.id === activeListId)?.name}
                {activeFilter !== 'all' && (
                  <span className="ml-3 text-xs bg-slate-100 text-slate-500 py-1 px-2 rounded-lg font-medium dark:bg-slate-700 dark:text-slate-300">
                    Filtro: {activeFilter}
                  </span>
                )}
              </h3>
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={undoLastAction}
                  disabled={undoStack.length === 0}
                  className={`p-2 rounded-lg transition-colors border shrink-0 ${
                    undoStack.length > 0 
                      ? 'text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-400 dark:border-indigo-800 dark:hover:bg-indigo-900/70' 
                      : 'text-slate-300 bg-slate-50 border-slate-100 cursor-not-allowed dark:bg-slate-800/50 dark:text-slate-600 dark:border-slate-800'
                  }`}
                  title="Desfazer última ação"
                >
                  <Undo2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setHideCompleted(!hideCompleted)}
                  className={`px-3 py-2 text-sm font-bold rounded-lg border transition-colors flex items-center gap-2 shrink-0 dark:border-slate-700 ${
                    hideCompleted 
                      ? 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-400 dark:border-indigo-800' 
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                  title={hideCompleted ? 'Mostrar concluídas' : 'Ocultar concluídas'}
                >
                  {hideCompleted ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span className="hidden sm:inline">Concluídas</span>
                </button>
                
                <input
                  type="text"
                  placeholder="Buscar tarefas..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full sm:w-48 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-all dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                />
                
                {taskLists.length > 1 && (
                  <button 
                    onClick={() => {
                        const confirmDelete = window.confirm('Tem certeza que deseja remover esta lista?');
                        if (confirmDelete) {
                            setTaskLists(p => p.filter(l => l.id !== activeListId));
                            updateTasksWithUndo(p => p.filter(t => t.listId !== activeListId));
                            setActiveListId(taskLists.find(l => l.id !== activeListId)?.id || '');
                        }
                    }}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100 dark:hover:bg-rose-900/30 dark:hover:border-rose-800 shrink-0"
                    title="Excluir Lista"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Input Adicionar */}
            <form onSubmit={handleAddTask} className="flex gap-2 mb-8">
              <input 
                type="text" 
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Adicione uma nova tarefa..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all dark:bg-slate-900 dark:border-slate-700 dark:text-white"
              />
              <button 
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl transition-colors shrink-0 flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-none"
              >
                <Plus className="w-5 h-5" />
              </button>
            </form>

            <div className="space-y-3">
              <AnimatePresence>
                {getFilteredTasks().map((task) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={task.id}
                    draggable
                    onDragStart={(e: any) => handleDragStart(e, task.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e: any) => handleDrop(e, task.id)}
                    className={`flex flex-col border rounded-2xl transition-all ${
                      draggedTaskId === task.id ? 'opacity-50' : ''
                    } ${
                      task.completed ? 'bg-slate-50/50 border-slate-100 dark:bg-slate-900/30 dark:border-slate-800' : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-600'
                    }`}
                  >
                    <div 
                      className="flex items-center p-4 cursor-pointer"
                      onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                    >
                      <button className="mr-3 shrink-0 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
                        <GripVertical className="w-4 h-4" />
                      </button>
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleToggleTask(task.id); }}
                        className="mr-4 shrink-0 transition-all hover:scale-110"
                      >
                        {task.completed ? (
                          <CheckCircle className="w-6 h-6 text-emerald-500" />
                        ) : (
                          <Circle className="w-6 h-6 text-slate-300 dark:text-slate-500" />
                        )}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        {editingTaskId === task.id ? (
                          <input 
                            autoFocus
                            type="text"
                            value={task.title}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleUpdateTask(task.id, { title: e.target.value })}
                            onBlur={() => setEditingTaskId(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingTaskId(null)}
                            className="w-full bg-slate-50 border border-indigo-300 rounded px-2 py-1 text-sm dark:bg-slate-900 dark:border-indigo-600 dark:text-white focus:outline-none"
                          />
                        ) : (
                          <p className={`text-sm font-medium truncate transition-colors ${
                            task.completed ? 'text-slate-400 line-through dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'
                          }`}>
                            {task.title}
                          </p>
                        )}
                        {(task.dueDate || task.subtasks.length > 0 || task.priority) && (
                          <div className="flex flex-wrap gap-2 mt-1.5 opacity-80">
                            {task.priority && task.priority !== 'none' && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest ${
                                task.priority === 'high' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' :
                                task.priority === 'medium' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                                'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                              }`}>
                                {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                              </span>
                            )}
                            {task.dueDate && (
                              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono flex items-center dark:bg-slate-700 dark:text-slate-300">
                                <Calendar className="w-3 h-3 mr-1" /> {task.dueDate}
                              </span>
                            )}
                            {task.subtasks.length > 0 && (
                              <span className="text-[10px] text-slate-500 flex items-center dark:text-slate-400 font-medium">
                                {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} sub
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 opacity-0 hover:opacity-100 sm:opacity-100 ml-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEditingTaskId(task.id); }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors dark:hover:bg-indigo-900/50 dark:hover:text-indigo-400"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteTask(task.id, e)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors dark:hover:bg-rose-900/50 dark:hover:text-rose-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Detalhes Expandidos (Subtarefas, Notas) */}
                    <AnimatePresence>
                      {expandedTaskId === task.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-slate-100 bg-slate-50/50 rounded-b-2xl dark:border-slate-700 dark:bg-slate-900/30"
                        >
                          <div className="p-4 pl-12 sm:pl-16 space-y-4">
                            {/* Notas / Descrição */}
                            <div>
                              <label className="text-xs font-bold text-slate-500 mb-1 flex items-center dark:text-slate-400">
                                <BookTextIcon className="w-3.5 h-3.5 mr-1" /> Notas & Links
                              </label>
                              <textarea
                                value={task.description}
                                onChange={(e) => handleUpdateTask(task.id, { description: e.target.value })}
                                placeholder="Adicione notas, links úteis ou contexto..."
                                className="w-full text-xs p-2.5 rounded-lg bg-white border border-slate-200 focus:outline-none focus:border-indigo-400 resize-none min-h-[60px] dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300"
                              />
                            </div>

                            {/* Subtarefas */}
                            <div>
                              <label className="text-xs font-bold text-slate-500 mb-2 flex items-center dark:text-slate-400">
                                <ListTodo className="w-3.5 h-3.5 mr-1" /> Subtarefas
                              </label>
                              <div className="space-y-1.5 mb-2">
                                {task.subtasks.map(sub => (
                                  <div key={sub.id} className="flex items-center group">
                                    <button 
                                      onClick={() => handleToggleSubtask(task.id, sub.id)}
                                      className="mr-2 shrink-0"
                                    >
                                      {sub.completed ? (
                                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                                      ) : (
                                        <Circle className="w-4 h-4 text-slate-300 dark:text-slate-500" />
                                      )}
                                    </button>
                                    
                                    {editingSubtaskId === sub.id ? (
                                      <input 
                                        autoFocus
                                        type="text"
                                        value={sub.title}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => handleUpdateSubtask(task.id, sub.id, e.target.value)}
                                        onBlur={() => setEditingSubtaskId(null)}
                                        onKeyDown={(e) => e.key === 'Enter' && setEditingSubtaskId(null)}
                                        className="flex-1 min-w-0 bg-slate-50 border border-indigo-300 rounded px-1.5 py-0.5 text-xs dark:bg-slate-900 dark:border-indigo-600 dark:text-white focus:outline-none"
                                      />
                                    ) : (
                                      <span className={`text-xs flex-1 min-w-0 truncate ${sub.completed ? 'text-slate-400 line-through dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'}`}>
                                        {sub.title}
                                      </span>
                                    )}

                                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0">
                                      <button 
                                        onClick={() => setEditingSubtaskId(sub.id)}
                                        className="p-1 text-slate-400 hover:text-indigo-500"
                                        title="Editar subtarefa"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteSubtask(task.id, sub.id)}
                                        className="p-1 text-slate-400 hover:text-rose-500"
                                        title="Excluir subtarefa"
                                      >
                                        <XIcon className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              <div className="flex gap-2">
                                <input 
                                  id={`subtask-input-${task.id}`}
                                  type="text"
                                  placeholder="Nova subtarefa..."
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddSubtask(task.id, (e.target as any).value);
                                      (e.target as any).value = '';
                                    }
                                  }}
                                  className="w-full text-xs p-2 rounded-lg bg-white border border-slate-200 focus:outline-none focus:border-indigo-400 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const input = document.getElementById(`subtask-input-${task.id}`) as HTMLInputElement;
                                    if (input && input.value) {
                                      handleAddSubtask(task.id, input.value);
                                      input.value = '';
                                      input.focus();
                                    }
                                  }}
                                  className="shrink-0 bg-indigo-50 border border-indigo-200 text-indigo-600 hover:bg-indigo-100 p-2 rounded-lg transition-colors flex items-center justify-center dark:bg-indigo-900/40 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/70"
                                  title="Adicionar subtarefa"
                                >
                                  <PlusCircle className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            
                            {/* Filtro Dropdown & Prioridade */}
                            <div className="flex flex-wrap gap-4">
                              <div>
                                 <label className="text-xs font-bold text-slate-500 mb-1 flex items-center dark:text-slate-400">Tag / Filtro</label>
                                 <select 
                                   value={task.filterTag}
                                   onChange={(e) => handleUpdateTask(task.id, { filterTag: e.target.value as TaskFilter })}
                                   className="text-xs p-1.5 rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300"
                                 >
                                   <option value="none">Nenhum</option>
                                   <option value="today">Hoje</option>
                                   <option value="tomorrow">Amanhã</option>
                                   <option value="week">Esta Semana</option>
                                   <option value="morning">Manhã</option>
                                   <option value="afternoon">Tarde</option>
                                 </select>
                              </div>
                              <div>
                                 <label className="text-xs font-bold text-slate-500 mb-1 flex items-center dark:text-slate-400">Prioridade</label>
                                 <select 
                                   value={task.priority || 'none'}
                                   onChange={(e) => handleUpdateTask(task.id, { priority: e.target.value as any })}
                                   className="text-xs p-1.5 rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300"
                                 >
                                   <option value="none">Normal</option>
                                   <option value="low">Baixa</option>
                                   <option value="medium">Média</option>
                                   <option value="high">Alta</option>
                                 </select>
                              </div>
                              <div>
                                 <label className="text-xs font-bold text-slate-500 mb-1 flex items-center dark:text-slate-400">Data (Opcional)</label>
                                 <input 
                                   type="date"
                                   value={task.dueDate || ''}
                                   onChange={(e) => handleUpdateTask(task.id, { dueDate: e.target.value })}
                                   className="text-xs p-1.5 rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300"
                                 />
                              </div>
                              <div className="flex flex-col gap-4">
                                <label className="text-xs font-bold text-slate-500 flex items-center dark:text-slate-400 mb-[-8px]">Repetição (Recorrência)</label>
                                <div className="flex flex-wrap gap-2 items-center">
                                  <select 
                                    value={task.repeat || 'none'}
                                    onChange={(e) => handleUpdateTask(task.id, { repeat: e.target.value as any })}
                                    className="text-xs p-1.5 rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 w-36 h-[30px]"
                                  >
                                    <option value="none">Não repete</option>
                                    <option value="daily">Todos os dias</option>
                                    <option value="weekdays">Dias úteis</option>
                                    <option value="weekly">Semanal</option>
                                    <option value="monthly">Mensal</option>
                                    <option value="custom_days">A cada X dias</option>
                                    <option value="infinite">Repetir para Sempre</option>
                                  </select>

                                  {task.repeat === 'custom_days' && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-slate-500 dark:text-slate-400">A cada</span>
                                      <input 
                                        type="number"
                                        min="1"
                                        value={task.repeatCustomDays || 1}
                                        onChange={(e) => handleUpdateTask(task.id, { repeatCustomDays: parseInt(e.target.value) || 1 })}
                                        className="text-xs p-1 rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 w-12 h-[30px] text-center"
                                      />
                                      <span className="text-xs text-slate-500 dark:text-slate-400">dias</span>
                                    </div>
                                  )}

                                  {task.repeat && task.repeat !== 'none' && task.repeat !== 'infinite' && (
                                    <div className="flex items-center gap-1 ml-auto sm:ml-2">
                                      <span className="text-xs text-slate-500 dark:text-slate-400">Vezes:</span>
                                      <input 
                                        type="number"
                                        min="0"
                                        placeholder="∞"
                                        title="0 para repetir infinitamente"
                                        value={task.repeatTimes || 0}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value) || 0;
                                          handleUpdateTask(task.id, { repeatTimes: val, repeatTimesLeft: val > 0 ? val - 1 : undefined });
                                        }}
                                        className="text-xs p-1 rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 w-16 h-[30px] text-center"
                                      />
                                      <span className="text-[10px] text-slate-400">(0 = ∞)</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {getFilteredTasks().length === 0 && (
                <div className="text-center py-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-3 dark:bg-slate-800">
                    <CheckCircle className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="text-slate-500 font-medium dark:text-slate-400">Nenhuma tarefa encontrada.</p>
                  <p className="text-xs text-slate-400 mt-1 dark:text-slate-500">Tudo limpo por aqui! Adicione novas tarefas acima.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
