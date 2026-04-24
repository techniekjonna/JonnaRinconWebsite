import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, List, CheckCircle2, Circle } from 'lucide-react';
import ManagerLayout from '../../components/manager/ManagerLayout';
import {
  getAgendaDaysByMonth,
  getAgendaTasksByMonth,
  getAgendaStatuses,
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

const ManagerAgendaPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [daysData, setDaysData] = useState<Map<string, DayData>>(new Map());
  const [statuses, setStatuses] = useState<AgendaStatus[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
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
        const dayStatus = day.statusId ? statuses.find(s => s.id === day.statusId) : undefined;
        map.set(day.date, {
          date: day.date,
          statusId: day.statusId || undefined,
          status: dayStatus,
          tasks: tasks.filter(t => t.date === day.date),
          studioSessionInfo: day.studioSessionInfo,
        });
      });

      // Add days with only tasks
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
    setShowDetails(true);
  };

  const dayData = selectedDay && daysData.has(selectedDay) ? daysData.get(selectedDay)! : null;

  return (
    <ManagerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Agenda</h1>
            <p className="text-sm text-white/30 mt-1">View schedule and availability</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setViewMode('calendar')} className={`px-4 py-2 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-blue-600/20 border border-blue-600/40 text-blue-400' : 'bg-white/[0.04] border border-white/[0.06] text-white/40'}`}>
              <Calendar size={18} />
            </button>
            <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-blue-600/20 border border-blue-600/40 text-blue-400' : 'bg-white/[0.04] border border-white/[0.06] text-white/40'}`}>
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
                if (day === null) return <div key={`empty-${idx}`} className="aspect-square" />;
                const dateStr = formatDate(currentDate.getFullYear(), currentDate.getMonth(), day);
                const data = daysData.get(dateStr);
                return (
                  <button key={day} onClick={() => handleDayClick(day)} className="aspect-square p-3 rounded-xl bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.10] transition-all flex flex-col items-start justify-start text-left cursor-pointer">
                    <div className="text-sm font-semibold text-white">{day}</div>
                    {data?.status && <div className="text-[10px] font-medium mt-1 px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: data.status.color + '33' }}>{data.status.name}</div>}
                    {data?.tasks.length ? <div className="text-[10px] text-white/40 mt-1">{data.tasks.filter(t => !t.completed).length} todo</div> : null}
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
              .filter(([_, data]) => {
                if (activeFilter === 'available') return data.status?.type === 'beschikbaar';
                if (activeFilter === 'absent') return data.status?.type === 'afwezig';
                if (activeFilter === 'studio') return data.status?.type === 'beschikbaar_studio';
                if (activeFilter === 'completed') return data.tasks.some(t => t.completed);
                if (activeFilter === 'pending') return data.tasks.some(t => !t.completed);
                return true;
              })
              .map(([date, data]) => (
                <div key={date} onClick={() => { setSelectedDay(date); setShowDetails(true); }} className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-4 hover:border-white/[0.12] cursor-pointer transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{date}</h3>
                      {data.status && <p className="text-sm mt-1" style={{ color: data.status.color }}>{data.status.name}</p>}
                      {data.tasks.length > 0 && <p className="text-sm text-white/30 mt-1">{data.tasks.filter(t => !t.completed).length} pending</p>}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Details Modal (Read-only) */}
        {showDetails && dayData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowDetails(false)}
            />
            <div className="relative bg-black border border-white/[0.06] rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
              <button
                onClick={() => setShowDetails(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white"
              >
                ✕
              </button>

              <h2 className="text-2xl font-bold text-white mb-6">{selectedDay}</h2>

              {/* Status section */}
              {dayData.status && (
                <div className="mb-6 pb-6 border-b border-white/[0.06]">
                  <h3 className="text-sm font-semibold text-white/60 uppercase mb-3">Status</h3>
                  <div
                    className="px-4 py-3 rounded-lg border"
                    style={{
                      backgroundColor: dayData.status.color + '15',
                      borderColor: dayData.status.color + '40',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: dayData.status.color }}
                      />
                      <span className="text-white font-medium">{dayData.status.name}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Studio Session Info */}
              {dayData.studioSessionInfo && (
                <div className="mb-6 pb-6 border-b border-white/[0.06]">
                  <h3 className="text-sm font-semibold text-white/60 uppercase mb-3">Studio Session</h3>
                  <div className="bg-white/[0.04] border border-white/[0.06] rounded-lg p-4 space-y-2">
                    {dayData.studioSessionInfo.clientName && (
                      <p className="text-white text-sm">
                        <span className="text-white/40">Client:</span> {dayData.studioSessionInfo.clientName}
                      </p>
                    )}
                    {dayData.studioSessionInfo.clientEmail && (
                      <p className="text-white text-sm">
                        <span className="text-white/40">Email:</span> {dayData.studioSessionInfo.clientEmail}
                      </p>
                    )}
                    {dayData.studioSessionInfo.sessionType && (
                      <p className="text-white text-sm">
                        <span className="text-white/40">Type:</span> {dayData.studioSessionInfo.sessionType}
                      </p>
                    )}
                    {dayData.studioSessionInfo.notes && (
                      <p className="text-white text-sm">
                        <span className="text-white/40">Notes:</span> {dayData.studioSessionInfo.notes}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Tasks section */}
              {dayData.tasks.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white/60 uppercase mb-3">Tasks</h3>
                  <div className="space-y-2">
                    {dayData.tasks.map(task => (
                      <div key={task.id} className="bg-white/[0.04] border border-white/[0.06] rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 flex-shrink-0">{task.completed ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Circle size={16} className="text-white/30" />}</div>
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${task.completed ? 'text-white/40 line-through' : 'text-white'}`}>{task.title}</p>
                            {task.description && <p className="text-white/40 text-xs mt-1">{task.description}</p>}
                            {task.time && <p className="text-white/30 text-xs mt-1">⏰ {task.time}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ManagerLayout>
  );
};

export default ManagerAgendaPage;
