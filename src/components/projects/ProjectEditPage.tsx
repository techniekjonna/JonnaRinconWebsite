import React, { useState, useEffect } from 'react';
import { Project, ProjectSubTask, AgendaDay } from '../../lib/firebase/types';
import { Plus, Trash2, GripVertical, Calendar, X } from 'lucide-react';
import { projectService } from '../../lib/firebase/services';
import { getAgendaDaysByMonth } from '../../lib/firebase/services/agendaService';

interface ProjectEditPageProps {
  project: Partial<Project>;
  onFormChange: (data: Partial<Project>) => void;
  loading: boolean;
  onSave: () => Promise<void>;
  onCancel: () => void;
}

const ProjectEditPage: React.FC<ProjectEditPageProps> = ({
  project,
  onFormChange,
  loading,
  onSave,
  onCancel,
}) => {
  const [newSubTask, setNewSubTask] = useState('');
  const [subTasks, setSubTasks] = useState<any[]>(project.subTasks || []);
  const [editingSubTask, setEditingSubTask] = useState<string | null>(null);
  const [localSubTaskCounter, setLocalSubTaskCounter] = useState(0);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Agenda scheduling
  const [showAgendaPicker, setShowAgendaPicker] = useState(false);
  const [agendaDays, setAgendaDays] = useState<AgendaDay[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<string[]>(project.availableDateRanges?.map(r => r.startDate) || []);

  useEffect(() => {
    loadAgendaDays();
  }, [currentMonth]);

  const loadAgendaDays = async () => {
    try {
      const days = await getAgendaDaysByMonth(currentMonth.getFullYear(), currentMonth.getMonth());
      setAgendaDays(days);
    } catch (error) {
      console.error('Failed to load agenda days:', error);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    onFormChange({
      ...project,
      [field]: value,
    });
  };

  const handleAddSubTask = async () => {
    if (!newSubTask.trim()) return;

    try {
      if (project.id) {
        // If project exists, save to Firebase
        const subTask = await projectService.createSubTask(project.id, {
          title: newSubTask,
          status: 'not-started',
          order: subTasks.length,
        });
        setSubTasks([...subTasks, subTask]);
      } else {
        // For new projects, create locally with temporary ID
        const localId = `local-${localSubTaskCounter}`;
        const newLocalSubTask = {
          id: localId,
          projectId: '',
          title: newSubTask,
          status: 'not-started',
          order: subTasks.length,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setSubTasks([...subTasks, newLocalSubTask]);
        setLocalSubTaskCounter(localSubTaskCounter + 1);
      }
      setNewSubTask('');
    } catch (error) {
      console.error('Failed to create sub-task:', error);
    }
  };

  const handleDeleteSubTask = async (id: string) => {
    try {
      // Only delete from Firebase if it has a real ID (not local)
      if (!id.startsWith('local-')) {
        await projectService.deleteSubTask(id);
      }
      setSubTasks(subTasks.filter(t => t.id !== id));
    } catch (error) {
      console.error('Failed to delete sub-task:', error);
    }
  };

  const handleUpdateSubTask = async (id: string, title: string) => {
    try {
      // Only update in Firebase if it has a real ID (not local)
      if (!id.startsWith('local-')) {
        await projectService.updateSubTask(id, { title } as any);
      }
      setSubTasks(subTasks.map(t => (t.id === id ? { ...t, title } : t)));
      setEditingSubTask(null);
    } catch (error) {
      console.error('Failed to update sub-task:', error);
    }
  };

  const handleSelectDate = (date: string) => {
    if (selectedDates.includes(date)) {
      setSelectedDates(selectedDates.filter(d => d !== date));
    } else {
      setSelectedDates([...selectedDates, date]);
    }
  };

  const handleSaveDates = () => {
    const ranges = selectedDates.sort().map(date => ({
      startDate: date,
      endDate: date,
    }));
    handleFieldChange('availableDateRanges', ranges);
    setShowAgendaPicker(false);
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

  const monthString = currentMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-xs font-semibold text-white/60 uppercase mb-2">Project Title</label>
        <input
          type="text"
          value={project.title || ''}
          onChange={e => handleFieldChange('title', e.target.value)}
          placeholder="Enter project title"
          className="w-full px-3 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/20"
        />
      </div>

      {/* Status */}
      <div>
        <label className="block text-xs font-semibold text-white/60 uppercase mb-2">Status</label>
        <select
          value={project.status || 'not-started'}
          onChange={e => handleFieldChange('status', e.target.value)}
          className="w-full px-3 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20"
        >
          <option value="not-started">Not Started</option>
          <option value="in-progress">In Progress</option>
          <option value="on-hold">On Hold</option>
          <option value="awaiting-feedback">Awaiting Feedback</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-semibold text-white/60 uppercase mb-2">Category</label>
        {!showCustomInput ? (
          <div className="flex gap-2 flex-wrap">
            {(['artist', 'producer', 'other'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleFieldChange('category', cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  (project as any).category === cat
                    ? 'bg-red-600/20 border-red-600/50 text-red-400'
                    : 'bg-white/[0.04] border-white/[0.1] text-white/50 hover:text-white hover:border-white/20'
                }`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
            {(project as any).category && !['artist', 'producer', 'other'].includes((project as any).category) && (
              <button
                type="button"
                onClick={() => handleFieldChange('category', (project as any).category)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border bg-red-600/20 border-red-600/50 text-red-400 flex items-center gap-1"
              >
                {((project as any).category as string).toUpperCase()}
                <X size={12} onClick={(e) => { e.stopPropagation(); handleFieldChange('category', 'other'); }} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowCustomInput(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-dashed border-white/[0.15] text-white/30 hover:text-white/60 hover:border-white/30 transition-all flex items-center gap-1"
            >
              <Plus size={11} />Add new
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={customCategoryInput}
              onChange={(e) => setCustomCategoryInput(e.target.value)}
              placeholder="Category name..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customCategoryInput.trim()) {
                  handleFieldChange('category', customCategoryInput.trim().toLowerCase());
                  setShowCustomInput(false);
                  setCustomCategoryInput('');
                }
                if (e.key === 'Escape') { setShowCustomInput(false); setCustomCategoryInput(''); }
              }}
              className="flex-1 px-3 py-1.5 bg-white/[0.05] border border-white/10 rounded-lg text-white text-xs placeholder-white/40 focus:outline-none focus:border-red-500/40"
            />
            <button
              type="button"
              onClick={() => {
                if (customCategoryInput.trim()) {
                  handleFieldChange('category', customCategoryInput.trim().toLowerCase());
                }
                setShowCustomInput(false);
                setCustomCategoryInput('');
              }}
              className="px-3 py-1.5 rounded-lg bg-red-600/20 border border-red-600/40 text-red-400 text-xs hover:bg-red-600/30 transition"
            >
              Save
            </button>
            <button type="button" onClick={() => { setShowCustomInput(false); setCustomCategoryInput(''); }}
              className="px-2 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-white/40 hover:text-white text-xs transition">
              <X size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-white/60 uppercase mb-2">Description</label>
        <textarea
          value={project.description || ''}
          onChange={e => handleFieldChange('description', e.target.value)}
          placeholder="Enter project description"
          rows={4}
          className="w-full px-3 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/20"
        />
      </div>

      {/* Cover Image URL */}
      <div>
        <label className="block text-xs font-semibold text-white/60 uppercase mb-2">Cover Image URL</label>
        <input
          type="text"
          value={project.coverUrl || ''}
          onChange={e => handleFieldChange('coverUrl', e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/20"
        />
        {project.coverUrl && (
          <img
            src={project.coverUrl}
            alt="Cover preview"
            className="mt-2 w-full h-20 rounded-lg object-cover"
            onError={e => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
      </div>

      {/* Internal Data Link */}
      <div>
        <label className="block text-xs font-semibold text-white/60 uppercase mb-2">Internal Data Link</label>
        <input
          type="text"
          value={project.internalDataLink || ''}
          onChange={e => {
            let url = e.target.value;
            if (url && !url.endsWith('/download')) {
              handleFieldChange('downloadSuffix', '/download');
            }
            handleFieldChange('internalDataLink', url);
          }}
          placeholder="https://..."
          className="w-full px-3 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/20"
        />
        <p className="text-xs text-white/40 mt-1">/download will be appended if missing</p>
      </div>

      {/* Sub-Tasks Section */}
      <div className="border-t border-white/10 pt-4">
        <h3 className="text-xs font-semibold text-white/60 uppercase mb-3">Sub-Tasks</h3>

        {project.id && (
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newSubTask}
              onChange={e => setNewSubTask(e.target.value)}
              onKeyPress={e => {
                if (e.key === 'Enter') {
                  handleAddSubTask();
                }
              }}
              placeholder="Add new sub-task..."
              className="flex-1 px-3 py-2 bg-white/[0.05] border border-white/10 rounded text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/20"
            />
            <button
              onClick={handleAddSubTask}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
        )}

        {subTasks.length > 0 ? (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {subTasks.map(task => (
              <div
                key={task.id}
                className="flex items-center gap-2 p-2 rounded bg-white/[0.02] hover:bg-white/[0.05] group"
              >
                <GripVertical size={16} className="text-white/20 cursor-grab" />
                {editingSubTask === task.id ? (
                  <>
                    <input
                      type="text"
                      defaultValue={task.title}
                      autoFocus
                      onBlur={e => handleUpdateSubTask(task.id, e.target.value)}
                      onKeyPress={e => {
                        if (e.key === 'Enter') {
                          handleUpdateSubTask(task.id, e.currentTarget.value);
                        }
                      }}
                      className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-sm text-white"
                    />
                  </>
                ) : (
                  <>
                    <p
                      onClick={() => setEditingSubTask(task.id)}
                      className="flex-1 text-sm text-white/70 cursor-pointer hover:text-white"
                    >
                      {task.title}
                    </p>
                    <button
                      onClick={() => handleDeleteSubTask(task.id)}
                      className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-600/20 text-red-400 rounded transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-white/40">No sub-tasks yet</p>
        )}
      </div>

      {/* Agenda Scheduling Section */}
      <div className="border-t border-white/10 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-white/60 uppercase">Schedule Dates</h3>
          <button
            onClick={() => setShowAgendaPicker(!showAgendaPicker)}
            className="p-2 hover:bg-white/10 rounded transition-colors text-white/40 hover:text-white"
          >
            <Calendar size={16} />
          </button>
        </div>

        {selectedDates.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {selectedDates.sort().map(date => (
              <span
                key={date}
                className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs font-medium flex items-center gap-1"
              >
                {date}
                <button
                  onClick={() => setSelectedDates(selectedDates.filter(d => d !== date))}
                  className="hover:text-blue-300"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {showAgendaPicker && (
          <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4 mb-3">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="text-white/40 hover:text-white"
              >
                ←
              </button>
              <span className="text-sm font-semibold text-white">{monthString}</span>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="text-white/40 hover:text-white"
              >
                →
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-3">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                <div key={d} className="text-center text-[10px] font-semibold text-white/40">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 mb-3">
              {calendarDays.map((day, idx) => {
                if (day === null) return <div key={`empty-${idx}`} />;
                const dateStr = formatDate(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                const isSelected = selectedDates.includes(dateStr);
                const agendaDay = agendaDays.find(d => d.date === dateStr);
                const isAvailable = agendaDay && agendaDay.statusId === 'beschikbaar' || agendaDay?.statusId === 'beschikbaar_studio';

                return (
                  <button
                    key={day}
                    onClick={() => handleSelectDate(dateStr)}
                    className={`aspect-square flex items-center justify-center text-xs font-semibold rounded transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : isAvailable
                        ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                        : 'bg-white/[0.02] text-white/20'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowAgendaPicker(false)}
                className="flex-1 py-2 px-3 rounded bg-white/[0.05] border border-white/10 text-white/60 hover:text-white text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDates}
                className="flex-1 py-2 px-3 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
              >
                Save Dates
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-white/10">
        <button
          onClick={onCancel}
          className="flex-1 py-2 px-4 bg-white/[0.05] border border-white/10 text-white rounded-lg hover:bg-white/[0.08] transition-colors font-semibold"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            // Update form with local sub-tasks before saving
            onFormChange({
              ...project,
              localSubTasks: subTasks,
            });
            // Small delay to ensure state is updated
            setTimeout(onSave, 0);
          }}
          disabled={loading}
          className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white rounded-lg transition-colors font-semibold"
        >
          {loading ? 'Saving...' : 'Save Project'}
        </button>
      </div>
    </div>
  );
};

export default ProjectEditPage;
