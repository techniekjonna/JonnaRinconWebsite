import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar, List, Filter, Trash2, Edit2, CheckCircle2, Circle } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
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

interface DayData {
  date: string;
  statusId?: string;
  status?: AgendaStatus;
  tasks: AgendaTask[];
  studioSessionInfo?: AgendaDay['studioSessionInfo'];
}

const AgendaPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [daysData, setDaysData] = useState<Map<string, DayData>>(new Map());
  const [statuses, setStatuses] = useState<AgendaStatus[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [editingTask, setEditingTask] = useState<AgendaTask | null>(null);
  const [newStatusName, setNewStatusName] = useState('');
  const [showNewStatusInput, setShowNewStatusInput] = useState(false);

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    time: '',
    userDisplayName: '',
    productType: '',
  });

  useEffect(() => {
    const loadStatuses = async () => {
      const allStatuses = await getAgendaStatuses();
      setStatuses(allStatuses);
    };
    loadStatuses();
  }, []);

  useEffect(() => {
    const loadMonthData = async () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const days = await getAgendaDaysByMonth(year, month);
      const tasks = await getAgendaTasksByMonth(year, month);

      const map = new Map<string, DayData>();

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

      // Add days with only tasks (no status set)
      tasks.forEach(task => {
        if (!map.has(task.date!)) {
          map.set(task.date!, {
            date: task.date!,
            statusId: undefined,
            status: undefined,
            tasks: [task],
            studioSessionInfo: undefined,
          });
        }
      });

      setDaysData(map);
    };

    if (statuses.length > 0) {
      loadMonthData();
    }
  }, [currentDate, statuses]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
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
        ...editingTask,
        title: taskForm.title,
        description: taskForm.description,
        time: taskForm.time,
        userDisplayName: taskForm.userDisplayName,
        productType: taskForm.productType,
      });
    } else {
      await createAgendaTask({
        title: taskForm.title,
        description: taskForm.description || undefined,
        date: selectedDay,
        time: taskForm.time || undefined,
        userDisplayName: taskForm.userDisplayName || undefined,
        productType: taskForm.productType || undefined,
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

  const monthString = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

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
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Agenda</h1>
            <p className="text-sm text-white/30 mt-1">Manage your schedule and tasks</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setViewMode('calendar')} className={`px-4 py-2 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-red-600/20 border border-red-600/40 text-red-400' : 'bg-white/[0.04] border border-white/[0.06] text-white/40'}`}>
              <Calendar size={18} />
            </button>
            <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-red-600/20 border border-red-600/40 text-red-400' : 'bg-white/[0.04] border border-white/[0.06] text-white/40'}`}>
              <List size={18} />
            </button>
            <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value as FilterType)} className="px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/40 text-sm">
              <option value="all">All</option>
              <option value="available">Available</option>
              <option value="absent">Absent</option>
              <option value="studio">Studio</option>
              <option value="pending">Pending Tasks</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between bg-white/[0.08] border border-white/[0.06] rounded-2xl p-4">
          <button onClick={handlePrevMonth} className="p-2 rounded-lg hover:bg-white/[0.08]"><ChevronLeft size={20} className="text-white" /></button>
          <h2 className="text-lg font-semibold text-white min-w-[200px] text-center">{monthString}</h2>
          <button onClick={handleNextMonth} className="p-2 rounded-lg hover:bg-white/[0.08]"><ChevronRight size={20} className="text-white" /></button>
        </div>

        {viewMode === 'calendar' && (
          <div className="bg-white/[0.08] border border-white/[0.06] rounded-2xl p-6">
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-xs font-semibold text-white/40 py-2">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => {
                if (day === null) return <div key={`empty-${idx}`} className="aspect-square" />;
                const dateStr = formatDate(currentDate.getFullYear(), currentDate.getMonth(), day);
                const data = daysData.get(dateStr);
                return (
                  <button key={day} onClick={() => openDayModal(day)} className="aspect-square p-3 rounded-xl bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.10] transition-all flex flex-col items-start justify-start text-left">
                    <div className="text-sm font-semibold text-white">{day}</div>
                    {data?.status && <div className="text-[10px] font-medium mt-1 px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: data.status.color + '33' }}>{data.status.name}</div>}
                    {data?.tasks.length ? <div className="text-[10px] text-white/40 mt-1">{data.tasks.filter(t => !t.completed).length} todo</div> : null}
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
            <div className="relative bg-black border border-white/[0.06] rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-white/40 hover:text-white">✕</button>
              <h2 className="text-2xl font-bold text-white mb-6">{selectedDay}</h2>

              <div className="mb-6 pb-6 border-b border-white/[0.06]">
                <h3 className="text-sm font-semibold text-white/60 uppercase mb-3">Status</h3>
                <div className="space-y-2">
                  {statuses.map(s => (
                    <button key={s.id} onClick={() => handleStatusChange(s.id)} className={`w-full text-left px-4 py-3 rounded-lg transition-all ${dayData.statusId === s.id ? 'bg-white/[0.12] border border-white/[0.2]' : 'bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08]'}`}>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} /><span className="text-white font-medium">{s.name}</span></div>
                    </button>
                  ))}
                </div>
                {showNewStatusInput ? (
                  <div className="flex gap-2 mt-3">
                    <input value={newStatusName} onChange={(e) => setNewStatusName(e.target.value)} placeholder="New status name" className="flex-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white text-sm" />
                    <button onClick={handleCreateStatus} className="px-4 py-2 rounded-lg bg-red-600/20 text-red-400 text-sm">Save</button>
                  </div>
                ) : (
                  <button onClick={() => setShowNewStatusInput(true)} className="mt-3 w-full py-2 text-sm text-white/40 hover:text-white/60">+ Custom Status</button>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white/60 uppercase mb-3">Tasks</h3>
                <div className="space-y-2 mb-4">
                  {dayData.tasks.map(task => (
                    <div key={task.id} className="bg-white/[0.04] border border-white/[0.06] rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2">
                        <button onClick={() => handleToggleTaskComplete(task)} className="mt-0.5 flex-shrink-0">{task.completed ? <CheckCircle2 size={18} className="text-emerald-400" /> : <Circle size={18} className="text-white/30" />}</button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${task.completed ? 'text-white/40 line-through' : 'text-white'}`}>{task.title}</p>
                          {task.description && <p className="text-xs text-white/40 mt-1">{task.description}</p>}
                          {task.time && <p className="text-xs text-white/30 mt-1">⏰ {task.time}</p>}
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => setEditingTask(task)} className="p-1 text-white/40 hover:text-white"><Edit2 size={14} /></button>
                          <button onClick={() => handleDeleteTask(task.id)} className="p-1 text-white/40 hover:text-red-400"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 bg-white/[0.04] border border-white/[0.06] rounded-lg p-4">
                  <input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Task title" className="w-full px-3 py-2 rounded-lg bg-white/[0.08] border border-white/[0.06] text-white text-sm" />
                  <textarea value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} placeholder="Description (optional)" className="w-full px-3 py-2 rounded-lg bg-white/[0.08] border border-white/[0.06] text-white text-sm resize-none" rows={2} />
                  <input value={taskForm.time} onChange={(e) => setTaskForm({ ...taskForm, time: e.target.value })} placeholder="Time (e.g., 10:30 AM)" className="w-full px-3 py-2 rounded-lg bg-white/[0.08] border border-white/[0.06] text-white text-sm" />
                  <input value={taskForm.userDisplayName} onChange={(e) => setTaskForm({ ...taskForm, userDisplayName: e.target.value })} placeholder="Assign to (optional)" className="w-full px-3 py-2 rounded-lg bg-white/[0.08] border border-white/[0.06] text-white text-sm" />
                  <input value={taskForm.productType} onChange={(e) => setTaskForm({ ...taskForm, productType: e.target.value })} placeholder="Product type (optional)" className="w-full px-3 py-2 rounded-lg bg-white/[0.08] border border-white/[0.06] text-white text-sm" />
                  <button onClick={handleSaveTask} className="w-full py-2 px-4 rounded-lg bg-red-600/20 border border-red-600/40 text-red-400 hover:bg-red-600/30 transition-all text-sm font-medium">
                    {editingTask ? 'Update Task' : '+ Add Task'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AgendaPage;
