import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar, List, Filter } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  getAgendaDaysByMonth,
  getAgendaTasksByMonth,
  getAgendaStatuses,
  setAgendaDayStatus,
  createAgendaTask,
  BUILT_IN_STATUSES,
} from '../../lib/firebase/services/agendaService';
import { AgendaDay, AgendaTask, AgendaStatus } from '../../lib/firebase/types';

type ViewMode = 'calendar' | 'list';
type FilterType = 'all' | 'available' | 'absent' | 'studio' | 'completed' | 'pending';

interface DayData {
  date: string;
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
  const [modalMode, setModalMode] = useState<'status' | 'task'>('status');
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Load statuses on mount
  useEffect(() => {
    const loadStatuses = async () => {
      const allStatuses = await getAgendaStatuses();
      setStatuses(allStatuses);
    };
    loadStatuses();
  }, []);

  // Load month data
  useEffect(() => {
    const loadMonthData = async () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const days = await getAgendaDaysByMonth(year, month);
      const tasks = await getAgendaTasksByMonth(year, month);

      const map = new Map<string, DayData>();

      days.forEach(day => {
        map.set(day.date, {
          date: day.date,
          status: day.statusId ? statuses.find(s => s.id === day.statusId) : undefined,
          tasks: tasks.filter(t => t.date === day.date),
          studioSessionInfo: day.studioSessionInfo,
        });
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

  const monthString = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  // Calendar grid
  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const handleDayClick = (day: number) => {
    const dateStr = formatDate(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDay(dateStr);
    setModalMode('status');
    setShowModal(true);
  };

  const handleStatusChange = async (statusId: string | null, note: string = '') => {
    if (!selectedDay) return;
    await setAgendaDayStatus(selectedDay, statusId, note);
    setShowModal(false);
    setSelectedDay(null);
    // Reload
    setCurrentDate(new Date(currentDate));
  };

  const handleAddTask = async (taskData: Partial<AgendaTask>) => {
    if (!selectedDay) return;
    await createAgendaTask({
      title: taskData.title || '',
      description: taskData.description,
      date: selectedDay,
      userId: taskData.userId,
      userDisplayName: taskData.userDisplayName,
      productType: taskData.productType,
      time: taskData.time,
      completed: false,
    });
    setShowModal(false);
    setSelectedDay(null);
    setCurrentDate(new Date(currentDate));
  };

  const dayData = selectedDay && daysData.has(selectedDay) ? daysData.get(selectedDay)! : null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Agenda</h1>
            <p className="text-sm text-white/30 mt-1">Plan your days, manage tasks and availability</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-lg transition-all ${
                viewMode === 'calendar'
                  ? 'bg-red-600/20 border border-red-600/40 text-red-400'
                  : 'bg-white/[0.04] border border-white/[0.06] text-white/40 hover:bg-white/[0.08]'
              }`}
            >
              <Calendar size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-red-600/20 border border-red-600/40 text-red-400'
                  : 'bg-white/[0.04] border border-white/[0.06] text-white/40 hover:bg-white/[0.08]'
              }`}
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/40 hover:bg-white/[0.08]"
            >
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between bg-white/[0.08] border border-white/[0.06] rounded-2xl p-4">
          <button onClick={handlePrevMonth} className="p-2 rounded-lg hover:bg-white/[0.08]">
            <ChevronLeft size={20} className="text-white" />
          </button>
          <h2 className="text-lg font-semibold text-white min-w-[200px] text-center">{monthString}</h2>
          <button onClick={handleNextMonth} className="p-2 rounded-lg hover:bg-white/[0.08]">
            <ChevronRight size={20} className="text-white" />
          </button>
        </div>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="bg-white/[0.08] border border-white/[0.06] rounded-2xl p-6">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-semibold text-white/40 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="aspect-square" />;
                }

                const dateStr = formatDate(currentDate.getFullYear(), currentDate.getMonth(), day);
                const data = daysData.get(dateStr);
                const status = data?.status;

                return (
                  <button
                    key={day}
                    onClick={() => handleDayClick(day)}
                    className="aspect-square p-3 rounded-xl bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.10] transition-all flex flex-col items-start justify-start text-left"
                  >
                    <div className="text-sm font-semibold text-white">{day}</div>
                    {status && (
                      <div className="text-[10px] font-medium mt-1 px-1.5 py-0.5 rounded-full text-white/60 bg-white/[0.04]">
                        {status.name}
                      </div>
                    )}
                    {data?.tasks && data.tasks.length > 0 && (
                      <div className="text-[10px] text-white/40 mt-1">
                        {data.tasks.length} task{data.tasks.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="space-y-3">
            {Array.from(daysData.entries())
              .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
              .map(([date, data]) => (
                <div
                  key={date}
                  onClick={() => {
                    setSelectedDay(date);
                    setShowModal(true);
                  }}
                  className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-4 hover:border-white/[0.12] cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white">{date}</h3>
                      {data.status && (
                        <p className="text-sm text-white/40 mt-1">{data.status.name}</p>
                      )}
                      {data.tasks.length > 0 && (
                        <p className="text-sm text-white/30 mt-1">
                          {data.tasks.filter(t => !t.completed).length} pending task{data.tasks.filter(t => !t.completed).length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    <Plus size={20} className="text-white/40" />
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Modal */}
        {showModal && dayData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            <div className="relative bg-black border border-white/[0.06] rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white"
              >
                ✕
              </button>

              <h2 className="text-2xl font-bold text-white mb-6">{selectedDay}</h2>

              {/* Status section */}
              <div className="mb-6 pb-6 border-b border-white/[0.06]">
                <h3 className="text-sm font-semibold text-white/60 uppercase mb-3">Status</h3>
                <div className="space-y-2">
                  {statuses.map(status => (
                    <button
                      key={status.id}
                      onClick={() => handleStatusChange(status.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                        dayData.status?.id === status.id
                          ? 'bg-white/[0.12] border border-white/[0.2]'
                          : 'bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: status.color }}
                        />
                        <span className="text-white font-medium">{status.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tasks section */}
              <div>
                <h3 className="text-sm font-semibold text-white/60 uppercase mb-3">Tasks</h3>
                <div className="space-y-2 mb-4">
                  {dayData.tasks.map(task => (
                    <div
                      key={task.id}
                      className="bg-white/[0.04] border border-white/[0.06] rounded-lg p-3"
                    >
                      <p className="text-white font-medium text-sm">{task.title}</p>
                      {task.description && (
                        <p className="text-white/40 text-xs mt-1">{task.description}</p>
                      )}
                    </div>
                  ))}
                </div>
                <button className="w-full py-2 px-4 rounded-lg bg-red-600/20 border border-red-600/40 text-red-400 hover:bg-red-600/30 transition-all text-sm font-medium">
                  + Add Task
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AgendaPage;
