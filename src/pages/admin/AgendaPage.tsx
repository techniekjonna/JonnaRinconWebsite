import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar, List, Filter, Trash2, Edit2, CheckCircle2, Circle, ChevronDown } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import TaskBoard from '../../components/admin/TaskBoard';
import { SocialPlannerContent } from './ContentPage';
import {
  getAgendaDaysByMonth,
  getAgendaTasksByMonth,
  getAgendaStatuses,
  setAgendaDayStatus,
  createAgendaTask,
  updateAgendaTask,
  deleteAgendaTask,
  createAgendaStatus,
  BUILT_IN_STATUSES,
} from '../../lib/firebase/services/agendaService';
import { AgendaDay, AgendaTask, AgendaStatus } from '../../lib/firebase/types';

type ViewMode = 'calendar' | 'list';
type FilterType = 'all' | 'available' | 'absent' | 'studio' | 'completed' | 'pending';
type TabType = 'agenda' | 'social' | 'tasks';

interface DayData {
  date: string;
  statusId?: string;
  status?: AgendaStatus;
  tasks: AgendaTask[];
  studioSessionInfo?: AgendaDay['studioSessionInfo'];
}

// Strip time from date for consistent comparison
const today = new Date();
today.setHours(0, 0, 0, 0);
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

const AgendaPage: React.FC = () => {
  const isMobileInit = typeof window !== 'undefined' && window.innerWidth < 768;
  const [activeTab, setActiveTab] = useState<TabType>('agenda');
  const [startDate, setStartDate] = useState(today); // start showing from today
  const [currentDate, setCurrentDate] = useState(new Date()); // still used to trigger data reloads
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [daysData, setDaysData] = useState<Map<string, DayData>>(new Map());
  const [statuses, setStatuses] = useState<AgendaStatus[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [editingTask, setEditingTask] = useState<AgendaTask | null>(null);
  const [newStatusName, setNewStatusName] = useState('');
  const [showNewStatusInput, setShowNewStatusInput] = useState(false);
  const [isMobile, setIsMobile] = useState(isMobileInit);
  const [daysToShow, setDaysToShow] = useState(isMobileInit ? 7 : 14);

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    time: '',
    userDisplayName: '',
    productType: '',
  });
  const [expandedStatus, setExpandedStatus] = useState(true);
  const [expandedTasks, setExpandedTasks] = useState(true);

  useEffect(() => {
    const loadStatuses = async () => {
      const allStatuses = await getAgendaStatuses();
      setStatuses(allStatuses);
    };
    loadStatuses();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const isNowMobile = window.innerWidth < 768;
      if (isNowMobile !== isMobile) {
        setIsMobile(isNowMobile);
        setDaysToShow(isNowMobile ? 7 : 14);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  useEffect(() => {
    const loadRangeData = async () => {
      // Load data for months that the current view range spans
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + daysToShow - 1);

      const monthsToLoad = new Set<string>();
      const d = new Date(startDate);
      while (d <= endDate) {
        monthsToLoad.add(`${d.getFullYear()}-${d.getMonth()}`);
        d.setMonth(d.getMonth() + 1);
      }

      const map = new Map<string, DayData>();

      for (const monthKey of monthsToLoad) {
        const [year, month] = monthKey.split('-').map(Number);
        const [days, tasks] = await Promise.all([
          getAgendaDaysByMonth(year, month),
          getAgendaTasksByMonth(year, month),
        ]);

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = formatDate(year, month, day);
          if (!map.has(dateStr)) {
            map.set(dateStr, { date: dateStr, statusId: undefined, status: undefined, tasks: [], studioSessionInfo: undefined });
          }
        }

        days.forEach(day => {
          const dayStatus = day.statusId ? statuses.find(s => s.id === day.statusId) : undefined;
          map.set(day.date, {
            date: day.date,
            statusId: day.statusId || undefined,
            status: dayStatus,
            tasks: tasks.filter(t => t.date === day.date),
            studioSessionInfo: day.studioSessionInfo,
          });
        });

        tasks.forEach(task => {
          if (!map.has(task.date!)) {
            map.set(task.date!, { date: task.date!, statusId: undefined, status: undefined, tasks: [task], studioSessionInfo: undefined });
          }
        });
      }

      setDaysData(map);
    };

    if (statuses.length > 0) {
      loadRangeData();
    }
  }, [startDate, currentDate, daysToShow, statuses]);

  const handlePrevPeriod = () => {
    const d = new Date(startDate);
    d.setDate(d.getDate() - daysToShow);
    setStartDate(d);
  };

  const handleNextPeriod = () => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + daysToShow);
    setStartDate(d);
  };

  const handleGoToToday = () => {
    setStartDate(new Date(today));
  };



  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const openDayModal = (day: number) => {
    const dateStr = formatDate(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDay(dateStr);
    setTaskForm({ title: '', description: '', time: '', userDisplayName: '', productType: '' });
    setEditingTask(null);
    setShowModal(true);
  };

  const handleStatusChange = async (statusId: string) => {
    if (!selectedDay) return;
    await setAgendaDayStatus(selectedDay, statusId);
    setCurrentDate(new Date(currentDate));
  };

  const handleSaveTask = async () => {
    if (!selectedDay || !taskForm.title) return;

    if (editingTask) {
      await updateAgendaTask(editingTask.id, {
        title: taskForm.title,
        description: taskForm.description || '',
        time: taskForm.time || '',
        userDisplayName: taskForm.userDisplayName || '',
        productType: taskForm.productType || '',
      });
    } else {
      await createAgendaTask({
        title: taskForm.title,
        ...(taskForm.description && { description: taskForm.description }),
        date: selectedDay,
        ...(taskForm.time && { time: taskForm.time }),
        ...(taskForm.userDisplayName && { userDisplayName: taskForm.userDisplayName }),
        ...(taskForm.productType && { productType: taskForm.productType }),
        completed: false,
      });
    }

    setTaskForm({ title: '', description: '', time: '', userDisplayName: '', productType: '' });
    setEditingTask(null);
    setCurrentDate(new Date(currentDate));
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteAgendaTask(taskId);
    setCurrentDate(new Date(currentDate));
  };

  const handleToggleTaskComplete = async (task: AgendaTask) => {
    await updateAgendaTask(task.id, { completed: !task.completed });
    setCurrentDate(new Date(currentDate));
  };

  const handleCreateStatus = async () => {
    if (!newStatusName) return;
    const colors = ['#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    await createAgendaStatus(newStatusName, randomColor, randomColor);
    setNewStatusName('');
    setShowNewStatusInput(false);
    setCurrentDate(new Date(currentDate));
  };

  const getStatusAbbrev = (status: AgendaStatus): string => {
    const abbrevMap: { [key: string]: string } = {
      'beschikbaar': 'A',
      'afwezig': 'X',
      'beschikbaar_studio': 'S',
    };
    return abbrevMap[status.type] || status.name.charAt(0).toUpperCase();
  };

  // Build date range starting from startDate
  const calendarDateRange: Date[] = [];
  for (let i = 0; i < daysToShow; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    calendarDateRange.push(d);
  }

  // Calculate padding to align first day with day of week (Monday = 0)
  let firstDayOfWeek = calendarDateRange[0].getDay(); // 0=Sun, 1=Mon, etc
  // Convert to Monday-based: Sun=6, Mon=0, Tue=1, etc
  firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const paddingDays = firstDayOfWeek; // empty cells before first day

  // Date range label
  const lastDate = calendarDateRange[calendarDateRange.length - 1];
  const monthString = startDate.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });

  const dayData = selectedDay && daysData.has(selectedDay) ? daysData.get(selectedDay)! : null;

  const filteredDays = Array.from(daysData.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .filter(([_, data]) => {
      if (activeFilter === 'available') return data.status?.type === 'beschikbaar';
      if (activeFilter === 'absent') return data.status?.type === 'afwezig';
      if (activeFilter === 'studio') return data.status?.type === 'beschikbaar_studio';
      if (activeFilter === 'completed') return data.tasks.some(t => t.completed);
      if (activeFilter === 'pending') return data.tasks.some(t => !t.completed);
      return true;
    });

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-3">Agenda</h1>

          {/* Main Tabs */}
          <div className="flex gap-2 border-b border-white/[0.1] overflow-x-auto mb-4">
            {(['agenda', 'social', 'tasks'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap border-b-2 ${
                  activeTab === tab
                    ? 'text-white border-red-500'
                    : 'text-white/50 border-transparent hover:text-white/70'
                }`}
              >
                {tab === 'agenda' && 'AGENDA'}
                {tab === 'social' && 'SOCIAL PLANNER'}
                {tab === 'tasks' && 'TASKS'}
              </button>
            ))}
          </div>
        </div>

        {/* AGENDA TAB CONTENT */}
        {activeTab === 'agenda' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <button onClick={() => setViewMode('calendar')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-red-600/20 border border-red-600/40 text-red-400' : 'bg-white/[0.04] border border-white/[0.06] text-white/40'}`}>
                  <Calendar size={16} />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-red-600/20 border border-red-600/40 text-red-400' : 'bg-white/[0.04] border border-white/[0.06] text-white/40'}`}>
                  <List size={16} />
                </button>
                <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value as FilterType)} className="px-2 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/40 text-xs">
                  <option value="all">Alles</option>
                  <option value="available">Beschikbaar</option>
                  <option value="absent">Afwezig</option>
                  <option value="studio">Studio</option>
                  <option value="pending">Openstaand</option>
                  <option value="completed">Voltooid</option>
                </select>
              </div>
            </div>

        <div className="flex items-center justify-between bg-white/[0.08] border border-white/[0.06] rounded-xl px-3 py-2">
          <button onClick={handlePrevPeriod} className="p-1 rounded-lg hover:bg-white/[0.08]"><ChevronLeft size={16} className="text-white" /></button>
          <div className="flex items-center gap-2">
            <button onClick={handleGoToToday} className="text-[11px] text-red-400 hover:text-red-300 font-semibold px-2 py-0.5 rounded bg-red-600/10 hover:bg-red-600/20 transition-colors">Vandaag</button>
            <h2 className="text-xs font-semibold text-white text-center capitalize">{monthString}</h2>
          </div>
          <button onClick={handleNextPeriod} className="p-1 rounded-lg hover:bg-white/[0.08]"><ChevronRight size={16} className="text-white" /></button>
        </div>

        {viewMode === 'calendar' && (
          <div className="bg-white/[0.08] border border-white/[0.06] rounded-2xl p-3 md:p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-1.5 flex-wrap">
                {[7, 14, 30].map(days => (
                  <button
                    key={days}
                    onClick={() => setDaysToShow(days)}
                    className={`px-2 py-0.5 rounded text-xs font-semibold transition-all ${
                      daysToShow === days
                        ? 'bg-red-600/20 border border-red-600/40 text-red-400'
                        : 'bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white/60'
                    }`}
                  >
                    {days}d
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(d => (
                <div key={d} className="text-center text-[10px] font-semibold text-white/40 py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {/* Padding cells for alignment */}
              {Array.from({ length: paddingDays }).map((_, i) => (
                <div key={`pad-${i}`} />
              ))}
              {calendarDateRange.map((date) => {
                const dateStr = formatDate(date.getFullYear(), date.getMonth(), date.getDate());
                const isToday = dateStr === todayStr;
                const data = daysData.get(dateStr);
                return (
                  <button
                    key={dateStr}
                    onClick={() => {
                      setSelectedDay(dateStr);
                      setTaskForm({ title: '', description: '', time: '', userDisplayName: '', productType: '' });
                      setEditingTask(null);
                      setShowModal(true);
                    }}
                    className={`relative p-1 rounded-lg border transition-all flex flex-col items-center justify-start text-center min-h-[44px] ${
                      isToday
                        ? 'bg-red-600/10 border-red-500/50 hover:bg-red-600/20'
                        : 'bg-white/[0.04] border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.08]'
                    }`}
                    style={isToday ? { boxShadow: '0 0 8px rgba(220,38,38,0.3), 0 0 16px rgba(220,38,38,0.1)' } : {}}
                  >
                    {data?.status && (
                      <div className="text-[7px] font-bold px-0.5 rounded w-full text-center leading-tight mb-0.5" style={{ backgroundColor: data.status.color + '33', color: data.status.color }}>
                        {getStatusAbbrev(data.status)}
                      </div>
                    )}
                    <span className={`text-xs font-bold leading-none ${isToday ? 'text-red-400' : 'text-white/80'}`}>{date.getDate()}</span>
                    {data?.tasks.length ? (
                      <span className="text-[7px] text-white/40 mt-0.5 leading-none">{data.tasks.filter(t => !t.completed).length}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === 'list' && (
          <div className="space-y-3">
            {filteredDays.map(([date, data]) => (
              <div key={date} onClick={() => { setSelectedDay(date); setShowModal(true); }} className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-4 hover:border-white/[0.12] cursor-pointer transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{date}</h3>
                    {data.status && <p className="text-sm mt-1" style={{ color: data.status.color }}>{data.status.name}</p>}
                    {data.tasks.length > 0 && <p className="text-sm text-white/30 mt-1">{data.tasks.filter(t => !t.completed).length} pending</p>}
                  </div>
                  <Plus size={20} className="text-white/40" />
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && dayData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <div className="relative bg-black border border-white/[0.06] rounded-2xl max-w-sm w-full max-h-[85vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-black/80 backdrop-blur-sm border-b border-white/[0.06] px-5 py-4 flex items-center justify-between z-10">
                <h2 className="text-lg font-bold text-white">{selectedDay}</h2>
                <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white"><Plus size={20} className="rotate-45" /></button>
              </div>

              <div className="px-5 py-4 space-y-3">
                {/* Status Section */}
                <div className="bg-white/[0.04] border border-white/[0.06] rounded-lg overflow-hidden">
                  <button onClick={() => setExpandedStatus(!expandedStatus)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.06]">
                    <span className="text-xs font-semibold text-white/60 uppercase">Status</span>
                    <ChevronDown size={16} className={`text-white/40 transition-transform ${expandedStatus ? 'rotate-180' : ''}`} />
                  </button>
                  {expandedStatus && (
                    <div className="border-t border-white/[0.06] px-4 py-3 space-y-1.5 max-h-48 overflow-y-auto">
                      {statuses.map(s => (
                        <button key={s.id} onClick={() => handleStatusChange(s.id)} className={`w-full text-left px-2 py-1.5 rounded text-xs transition-all flex items-center gap-2 ${dayData.statusId === s.id ? 'bg-white/[0.12] text-white' : 'text-white/50 hover:text-white/70'}`}>
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                          <span>{s.name}</span>
                        </button>
                      ))}
                      {!showNewStatusInput ? (
                        <button onClick={() => setShowNewStatusInput(true)} className="w-full text-left px-2 py-1.5 text-xs text-white/40 hover:text-white/60 rounded">+ Add Custom</button>
                      ) : (
                        <div className="flex gap-1.5 mt-2">
                          <input value={newStatusName} onChange={(e) => setNewStatusName(e.target.value)} placeholder="Status name" className="flex-1 px-2 py-1 rounded bg-white/[0.08] border border-white/[0.06] text-white text-xs" />
                          <button onClick={handleCreateStatus} className="px-2 py-1 rounded bg-red-600/20 text-red-400 text-xs">Save</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Tasks Section */}
                <div className="bg-white/[0.04] border border-white/[0.06] rounded-lg overflow-hidden">
                  <button onClick={() => setExpandedTasks(!expandedTasks)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.06]">
                    <span className="text-xs font-semibold text-white/60 uppercase">Tasks {dayData.tasks.length > 0 && <span className="ml-1 text-red-400">({dayData.tasks.filter(t => !t.completed).length})</span>}</span>
                    <ChevronDown size={16} className={`text-white/40 transition-transform ${expandedTasks ? 'rotate-180' : ''}`} />
                  </button>
                  {expandedTasks && (
                    <div className="border-t border-white/[0.06] px-4 py-3 space-y-2 max-h-60 overflow-y-auto">
                      {dayData.tasks.map(task => (
                        <div key={task.id} className="flex items-start gap-2 p-2 rounded bg-white/[0.02] group">
                          <button onClick={() => handleToggleTaskComplete(task)} className="mt-0.5 flex-shrink-0">{task.completed ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Circle size={14} className="text-white/30" />}</button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium ${task.completed ? 'text-white/40 line-through' : 'text-white'}`}>{task.title}</p>
                            {task.time && <p className="text-[10px] text-white/30">⏰ {task.time}</p>}
                          </div>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setEditingTask(task)} className="p-0.5 text-white/40 hover:text-white"><Edit2 size={12} /></button>
                            <button onClick={() => handleDeleteTask(task.id)} className="p-0.5 text-white/40 hover:text-red-400"><Trash2 size={12} /></button>
                          </div>
                        </div>
                      ))}

                      {/* Task Form */}
                      <div className="border-t border-white/[0.06] pt-2 mt-2 space-y-1.5">
                        <input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="New task" className="w-full px-2 py-1.5 rounded bg-white/[0.08] border border-white/[0.06] text-white text-xs" />
                        <div className="grid grid-cols-2 gap-1.5">
                          <input value={taskForm.time} onChange={(e) => setTaskForm({ ...taskForm, time: e.target.value })} placeholder="Time" className="px-2 py-1 rounded bg-white/[0.08] border border-white/[0.06] text-white text-xs" />
                          <input value={taskForm.userDisplayName} onChange={(e) => setTaskForm({ ...taskForm, userDisplayName: e.target.value })} placeholder="Assign" className="px-2 py-1 rounded bg-white/[0.08] border border-white/[0.06] text-white text-xs" />
                        </div>
                        <button onClick={handleSaveTask} className="w-full py-1.5 rounded bg-red-600/20 border border-red-600/40 text-red-400 hover:bg-red-600/30 text-xs font-medium">
                          {editingTask ? 'Update' : '+ Task'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
          </div>
        )}

        {/* SOCIAL PLANNER TAB */}
        {activeTab === 'social' && (
          <SocialPlannerContent />
        )}

        {/* TASKS TAB */}
        {activeTab === 'tasks' && (
          <TaskBoard />
        )}
      </div>

      {/* Modal stays outside tabs */}
      {showModal && dayData && activeTab === 'agenda' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-black border border-white/[0.06] rounded-2xl max-w-sm w-full max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-black/80 backdrop-blur-sm border-b border-white/[0.06] px-5 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-white">{selectedDay}</h2>
              <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white"><Plus size={20} className="rotate-45" /></button>
            </div>

            <div className="px-5 py-4 space-y-3">
              {/* Status Section */}
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-lg overflow-hidden">
                <button onClick={() => setExpandedStatus(!expandedStatus)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.06]">
                  <span className="text-xs font-semibold text-white/60 uppercase">Status</span>
                  <ChevronDown size={16} className={`text-white/40 transition-transform ${expandedStatus ? 'rotate-180' : ''}`} />
                </button>
                {expandedStatus && (
                  <div className="border-t border-white/[0.06] px-4 py-3 space-y-1.5 max-h-48 overflow-y-auto">
                    {statuses.map(s => (
                      <button key={s.id} onClick={() => handleStatusChange(s.id)} className={`w-full text-left px-2 py-1.5 rounded text-xs transition-all flex items-center gap-2 ${dayData.statusId === s.id ? 'bg-white/[0.12] text-white' : 'text-white/50 hover:text-white/70'}`}>
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                        <span>{s.name}</span>
                      </button>
                    ))}
                    {!showNewStatusInput ? (
                      <button onClick={() => setShowNewStatusInput(true)} className="w-full text-left px-2 py-1.5 text-xs text-white/40 hover:text-white/60 rounded">+ Add Custom</button>
                    ) : (
                      <div className="flex gap-1.5 mt-2">
                        <input value={newStatusName} onChange={(e) => setNewStatusName(e.target.value)} placeholder="Status name" className="flex-1 px-2 py-1 rounded bg-white/[0.08] border border-white/[0.06] text-white text-xs" />
                        <button onClick={handleCreateStatus} className="px-2 py-1 rounded bg-red-600/20 text-red-400 text-xs">Save</button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tasks Section */}
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-lg overflow-hidden">
                <button onClick={() => setExpandedTasks(!expandedTasks)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.06]">
                  <span className="text-xs font-semibold text-white/60 uppercase">Tasks {dayData.tasks.length > 0 && <span className="ml-1 text-red-400">({dayData.tasks.filter(t => !t.completed).length})</span>}</span>
                  <ChevronDown size={16} className={`text-white/40 transition-transform ${expandedTasks ? 'rotate-180' : ''}`} />
                </button>
                {expandedTasks && (
                  <div className="border-t border-white/[0.06] px-4 py-3 space-y-2 max-h-60 overflow-y-auto">
                    {dayData.tasks.map(task => (
                      <div key={task.id} className="flex items-start gap-2 p-2 rounded bg-white/[0.02] group">
                        <button onClick={() => handleToggleTaskComplete(task)} className="mt-0.5 flex-shrink-0">{task.completed ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Circle size={14} className="text-white/30" />}</button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium ${task.completed ? 'text-white/40 line-through' : 'text-white'}`}>{task.title}</p>
                          {task.time && <p className="text-[10px] text-white/30">⏰ {task.time}</p>}
                        </div>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditingTask(task)} className="p-0.5 text-white/40 hover:text-white"><Edit2 size={12} /></button>
                          <button onClick={() => handleDeleteTask(task.id)} className="p-0.5 text-white/40 hover:text-red-400"><Trash2 size={12} /></button>
                        </div>
                      </div>
                    ))}

                    {/* Task Form */}
                    <div className="border-t border-white/[0.06] pt-2 mt-2 space-y-1.5">
                      <input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="New task" className="w-full px-2 py-1.5 rounded bg-white/[0.08] border border-white/[0.06] text-white text-xs" />
                      <div className="grid grid-cols-2 gap-1.5">
                        <input value={taskForm.time} onChange={(e) => setTaskForm({ ...taskForm, time: e.target.value })} placeholder="Time" className="px-2 py-1 rounded bg-white/[0.08] border border-white/[0.06] text-white text-xs" />
                        <input value={taskForm.userDisplayName} onChange={(e) => setTaskForm({ ...taskForm, userDisplayName: e.target.value })} placeholder="Assign" className="px-2 py-1 rounded bg-white/[0.08] border border-white/[0.06] text-white text-xs" />
                      </div>
                      <button onClick={handleSaveTask} className="w-full py-1.5 rounded bg-red-600/20 border border-red-600/40 text-red-400 hover:bg-red-600/30 text-xs font-medium">
                        {editingTask ? 'Update' : '+ Task'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AgendaPage;
