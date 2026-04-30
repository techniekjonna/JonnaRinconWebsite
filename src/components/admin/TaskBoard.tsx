import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../lib/firebase/config';
import {
  collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, Timestamp, where,
} from 'firebase/firestore';
import {
  Plus, Trash2, Edit2, CheckCircle2, Circle, ChevronDown, ChevronRight,
  X, Calendar, User, Paperclip, AlignLeft, MoreHorizontal,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TaskSection {
  id: string;
  title: string;
  order: number;
}

interface Task {
  id: string;
  sectionId: string;
  parentTaskId?: string;
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  completed: boolean;
  order: number;
  createdAt?: Timestamp;
}

// ─── Task Modal ───────────────────────────────────────────────────────────────

const TaskModal: React.FC<{
  task: Task;
  subtasks: Task[];
  onClose: () => void;
  onUpdate: (id: string, data: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onAddSubtask: (parentId: string, title: string) => void;
  onToggle: (task: Task) => void;
}> = ({ task, subtasks, onClose, onUpdate, onDelete, onAddSubtask, onToggle }) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [assignee, setAssignee] = useState(task.assignee || '');
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [addingSubtask, setAddingSubtask] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const handleSave = () => {
    const changed: Partial<Task> = {};
    if (title !== task.title) changed.title = title;
    if (description !== task.description) changed.description = description;
    if (assignee !== task.assignee) changed.assignee = assignee;
    if (dueDate !== task.dueDate) changed.dueDate = dueDate;
    if (Object.keys(changed).length) onUpdate(task.id, changed);
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    onAddSubtask(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle('');
    setAddingSubtask(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={onClose}>
      <div
        className="h-full w-full max-w-md bg-[#1a1a1a] border-l border-white/[0.08] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="sticky top-0 bg-[#1a1a1a] border-b border-white/[0.06] px-4 py-3 flex items-center justify-between z-10">
          <button
            onClick={() => onToggle(task)}
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            {task.completed
              ? <CheckCircle2 size={16} className="text-emerald-400" />
              : <Circle size={16} className="text-white/30" />}
            <span>{task.completed ? 'Voltooid' : 'Markeer voltooid'}</span>
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => { handleSave(); onDelete(task.id); }} className="p-1.5 text-white/40 hover:text-red-400 transition-colors">
              <Trash2 size={15} />
            </button>
            <button onClick={() => { handleSave(); onClose(); }} className="p-1.5 text-white/40 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Title */}
          <textarea
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSave}
            rows={2}
            className="w-full bg-transparent text-xl font-bold text-white resize-none focus:outline-none placeholder-white/20 leading-snug"
            placeholder="Taaknaam..."
          />

          {/* Meta: assignee + due date */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 w-28 flex-shrink-0">
                <User size={14} className="text-white/30" />
                <span className="text-xs text-white/40">Verantw.</span>
              </div>
              <input
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                onBlur={handleSave}
                placeholder="Naam toevoegen…"
                className="flex-1 bg-white/[0.04] hover:bg-white/[0.07] border border-transparent hover:border-white/[0.1] rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/[0.2] transition-all"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 w-28 flex-shrink-0">
                <Calendar size={14} className="text-white/30" />
                <span className="text-xs text-white/40">Vervaldatum</span>
              </div>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                onBlur={handleSave}
                className="flex-1 bg-white/[0.04] hover:bg-white/[0.07] border border-transparent hover:border-white/[0.1] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-white/[0.2] transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlignLeft size={14} className="text-white/30" />
              <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Beschrijving</span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleSave}
              rows={4}
              placeholder="Voeg een beschrijving toe…"
              className="w-full bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm text-white/80 placeholder-white/20 resize-none focus:outline-none focus:border-white/[0.15] transition-all"
            />
          </div>

          {/* Subtasks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ChevronRight size={14} className="text-white/30" />
                <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                  Subtaken
                  {subtasks.length > 0 && (
                    <span className="ml-1.5 text-white/25">({subtasks.filter(s => s.completed).length}/{subtasks.length})</span>
                  )}
                </span>
              </div>
              <button
                onClick={() => setAddingSubtask(true)}
                className="p-1 rounded-lg hover:bg-white/[0.06] transition-colors"
              >
                <Plus size={14} className="text-white/40" />
              </button>
            </div>

            <div className="space-y-1">
              {subtasks.map((sub) => (
                <div key={sub.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] group">
                  <button onClick={() => onToggle(sub)} className="flex-shrink-0">
                    {sub.completed
                      ? <CheckCircle2 size={14} className="text-emerald-400" />
                      : <Circle size={14} className="text-white/25" />}
                  </button>
                  <span className={`flex-1 text-sm ${sub.completed ? 'text-white/30 line-through' : 'text-white/70'}`}>
                    {sub.title}
                  </span>
                  <button
                    onClick={() => onDelete(sub.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-white/30 hover:text-red-400 transition-all"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {addingSubtask && (
                <div className="flex items-center gap-2 px-2 py-1">
                  <Circle size={14} className="text-white/20 flex-shrink-0" />
                  <input
                    autoFocus
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddSubtask();
                      if (e.key === 'Escape') { setAddingSubtask(false); setNewSubtaskTitle(''); }
                    }}
                    onBlur={() => { if (newSubtaskTitle.trim()) handleAddSubtask(); else setAddingSubtask(false); }}
                    placeholder="Subtaaknaam…"
                    className="flex-1 bg-transparent text-sm text-white placeholder-white/20 focus:outline-none"
                  />
                </div>
              )}

              {!addingSubtask && (
                <button
                  onClick={() => setAddingSubtask(true)}
                  className="flex items-center gap-2 px-2 py-1.5 w-full text-left text-xs text-white/30 hover:text-white/50 transition-colors"
                >
                  <Plus size={12} />
                  <span>Subtaak toevoegen</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Task Row ─────────────────────────────────────────────────────────────────

const TaskRow: React.FC<{
  task: Task;
  subtasks: Task[];
  depth: number;
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<Task>) => void;
  onAddSubtask: (parentId: string, title: string) => void;
  onOpenModal: (task: Task) => void;
}> = ({ task, subtasks, depth, onToggle, onDelete, onUpdate, onAddSubtask, onOpenModal }) => {
  const [expanded, setExpanded] = useState(true);
  const hasSubtasks = subtasks.length > 0;

  return (
    <>
      <div
        className={`flex items-center gap-2 px-3 py-2 hover:bg-white/[0.04] rounded-lg group cursor-pointer transition-colors ${depth > 0 ? 'ml-7' : ''}`}
        onClick={() => onOpenModal(task)}
      >
        {/* Expand toggle for subtasks */}
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          className={`flex-shrink-0 w-4 h-4 flex items-center justify-center ${hasSubtasks ? 'visible' : 'invisible'}`}
        >
          {expanded
            ? <ChevronDown size={12} className="text-white/30" />
            : <ChevronRight size={12} className="text-white/30" />}
        </button>

        {/* Checkbox */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(task); }}
          className="flex-shrink-0"
        >
          {task.completed
            ? <CheckCircle2 size={16} className="text-emerald-400" />
            : <Circle size={16} className="text-white/25 group-hover:text-white/40 transition-colors" />}
        </button>

        {/* Title */}
        <span className={`flex-1 text-sm min-w-0 truncate ${task.completed ? 'text-white/30 line-through' : 'text-white/80'}`}>
          {task.title}
        </span>

        {/* Assignee badge */}
        {task.assignee && (
          <span className="hidden sm:flex items-center gap-1 text-xs text-white/30 bg-white/[0.06] px-2 py-0.5 rounded-full flex-shrink-0">
            <User size={10} />
            {task.assignee}
          </span>
        )}

        {/* Due date */}
        {task.dueDate && (
          <span className="hidden sm:block text-xs text-white/25 flex-shrink-0 w-24 text-right">
            {new Date(task.dueDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
          </span>
        )}

        {/* Delete */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          className="opacity-0 group-hover:opacity-100 p-1 text-white/30 hover:text-red-400 transition-all flex-shrink-0"
        >
          <X size={12} />
        </button>
      </div>

      {/* Subtasks */}
      {hasSubtasks && expanded && subtasks.map((sub) => (
        <TaskRow
          key={sub.id}
          task={sub}
          subtasks={[]}
          depth={depth + 1}
          onToggle={onToggle}
          onDelete={onDelete}
          onUpdate={onUpdate}
          onAddSubtask={onAddSubtask}
          onOpenModal={onOpenModal}
        />
      ))}
    </>
  );
};

// ─── Section ──────────────────────────────────────────────────────────────────

const Section: React.FC<{
  section: TaskSection;
  tasks: Task[];
  allTasks: Task[];
  onToggle: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTask: (id: string, data: Partial<Task>) => void;
  onAddTask: (sectionId: string, title: string) => void;
  onAddSubtask: (parentId: string, title: string) => void;
  onDeleteSection: (id: string) => void;
  onOpenModal: (task: Task) => void;
}> = ({ section, tasks, allTasks, onToggle, onDeleteTask, onUpdateTask, onAddTask, onAddSubtask, onDeleteSection, onOpenModal }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Top-level tasks in this section (no parentTaskId)
  const rootTasks = tasks.filter(t => !t.parentTaskId);
  const getSubtasks = (parentId: string) => allTasks.filter(t => t.parentTaskId === parentId);

  const handleAdd = () => {
    if (!newTaskTitle.trim()) return;
    onAddTask(section.id, newTaskTitle.trim());
    setNewTaskTitle('');
    setAddingTask(false);
  };

  return (
    <div className="mb-4">
      {/* Section header */}
      <div className="flex items-center gap-2 py-2 group">
        <button onClick={() => setCollapsed(!collapsed)} className="flex items-center gap-1.5 text-left flex-1 min-w-0">
          {collapsed
            ? <ChevronRight size={14} className="text-white/40 flex-shrink-0" />
            : <ChevronDown size={14} className="text-white/40 flex-shrink-0" />}
          <span className="text-sm font-semibold text-white/80 truncate">{section.title}</span>
          <span className="text-xs text-white/25 ml-1">{rootTasks.length}</span>
        </button>
        <button
          onClick={() => setAddingTask(true)}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/[0.06] transition-all"
        >
          <Plus size={13} className="text-white/40" />
        </button>
        <button
          onClick={() => onDeleteSection(section.id)}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/[0.06] transition-all"
        >
          <X size={13} className="text-white/30 hover:text-red-400" />
        </button>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06] mb-1" />

      {/* Tasks */}
      {!collapsed && (
        <>
          {rootTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              subtasks={getSubtasks(task.id)}
              depth={0}
              onToggle={onToggle}
              onDelete={onDeleteTask}
              onUpdate={onUpdateTask}
              onAddSubtask={onAddSubtask}
              onOpenModal={onOpenModal}
            />
          ))}

          {/* Add task row */}
          {addingTask ? (
            <div className="flex items-center gap-2 px-3 py-2 ml-4">
              <Circle size={16} className="text-white/20 flex-shrink-0" />
              <input
                autoFocus
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd();
                  if (e.key === 'Escape') { setAddingTask(false); setNewTaskTitle(''); }
                }}
                onBlur={() => { if (newTaskTitle.trim()) handleAdd(); else setAddingTask(false); }}
                placeholder="Taaknaam…"
                className="flex-1 bg-transparent text-sm text-white placeholder-white/20 focus:outline-none"
              />
            </div>
          ) : (
            <button
              onClick={() => setAddingTask(true)}
              className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-xs text-white/25 hover:text-white/50 transition-colors ml-4 rounded-lg hover:bg-white/[0.03]"
            >
              <Plus size={12} />
              <span>Taak toevoegen</span>
            </button>
          )}
        </>
      )}
    </div>
  );
};

// ─── TaskBoard ────────────────────────────────────────────────────────────────

const TaskBoard: React.FC = () => {
  const [sections, setSections] = useState<TaskSection[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');

  // Load sections
  useEffect(() => {
    const q = query(collection(db, 'taskSections'), orderBy('order', 'asc'));
    return onSnapshot(q, (snap) => {
      setSections(snap.docs.map(d => ({ id: d.id, ...d.data() } as TaskSection)));
    });
  }, []);

  // Load all tasks
  useEffect(() => {
    const q = query(collection(db, 'panelTasks'), orderBy('order', 'asc'));
    return onSnapshot(q, (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
    });
  }, []);

  const addSection = async () => {
    if (!newSectionTitle.trim()) return;
    await addDoc(collection(db, 'taskSections'), {
      title: newSectionTitle.trim(),
      order: sections.length,
      createdAt: serverTimestamp(),
    });
    setNewSectionTitle('');
    setAddingSection(false);
  };

  const deleteSection = async (id: string) => {
    if (!confirm('Sectie verwijderen? Alle taken in deze sectie worden ook verwijderd.')) return;
    const sectionTasks = tasks.filter(t => t.sectionId === id);
    await Promise.all(sectionTasks.map(t => deleteDoc(doc(db, 'panelTasks', t.id))));
    await deleteDoc(doc(db, 'taskSections', id));
  };

  const addTask = async (sectionId: string, title: string) => {
    const sectionTasks = tasks.filter(t => t.sectionId === sectionId && !t.parentTaskId);
    await addDoc(collection(db, 'panelTasks'), {
      sectionId,
      title,
      completed: false,
      order: sectionTasks.length,
      createdAt: serverTimestamp(),
    });
  };

  const addSubtask = async (parentTaskId: string, title: string) => {
    const parent = tasks.find(t => t.id === parentTaskId);
    if (!parent) return;
    const siblings = tasks.filter(t => t.parentTaskId === parentTaskId);
    await addDoc(collection(db, 'panelTasks'), {
      sectionId: parent.sectionId,
      parentTaskId,
      title,
      completed: false,
      order: siblings.length,
      createdAt: serverTimestamp(),
    });
  };

  const updateTask = async (id: string, data: Partial<Task>) => {
    await updateDoc(doc(db, 'panelTasks', id), data);
    if (selectedTask?.id === id) setSelectedTask(prev => prev ? { ...prev, ...data } : null);
  };

  const deleteTask = async (id: string) => {
    // Also delete subtasks
    const children = tasks.filter(t => t.parentTaskId === id);
    await Promise.all(children.map(c => deleteDoc(doc(db, 'panelTasks', c.id))));
    await deleteDoc(doc(db, 'panelTasks', id));
    if (selectedTask?.id === id) setSelectedTask(null);
  };

  const toggleTask = async (task: Task) => {
    await updateTask(task.id, { completed: !task.completed });
  };

  const getTasksForSection = (sectionId: string) =>
    tasks.filter(t => t.sectionId === sectionId);

  const completedCount = tasks.filter(t => t.completed && !t.parentTaskId).length;
  const totalCount = tasks.filter(t => !t.parentTaskId).length;

  return (
    <div className="flex gap-0 relative">
      {/* Main board */}
      <div className={`flex-1 min-w-0 transition-all duration-200 ${selectedTask ? 'pr-2' : ''}`}>
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-white/30">{completedCount}/{totalCount} voltooid</p>
          <button
            onClick={() => setAddingSection(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/50 hover:text-white text-xs font-medium transition-colors hover:bg-white/[0.09]"
          >
            <Plus size={13} />
            Sectie
          </button>
        </div>

        {/* Column headers */}
        <div className="flex items-center gap-2 px-3 pb-1 mb-1 border-b border-white/[0.05]">
          <div className="w-4 flex-shrink-0" />
          <div className="w-4 flex-shrink-0" />
          <div className="flex-1 text-[10px] font-semibold text-white/25 uppercase tracking-wider">Naam</div>
          <div className="hidden sm:block text-[10px] font-semibold text-white/25 uppercase tracking-wider w-28 text-right">Verantwoordelijke</div>
          <div className="hidden sm:block text-[10px] font-semibold text-white/25 uppercase tracking-wider w-24 text-right">Vervaldatum</div>
          <div className="w-6" />
        </div>

        {/* Sections */}
        {sections.length === 0 && !addingSection && (
          <div className="text-center py-12 text-white/30">
            <p className="text-sm mb-3">Geen secties</p>
            <button
              onClick={() => setAddingSection(true)}
              className="text-xs text-white/40 hover:text-white transition-colors underline underline-offset-2"
            >
              Voeg een sectie toe
            </button>
          </div>
        )}

        {sections.map((section) => (
          <Section
            key={section.id}
            section={section}
            tasks={getTasksForSection(section.id)}
            allTasks={tasks}
            onToggle={toggleTask}
            onDeleteTask={deleteTask}
            onUpdateTask={updateTask}
            onAddTask={addTask}
            onAddSubtask={addSubtask}
            onDeleteSection={deleteSection}
            onOpenModal={setSelectedTask}
          />
        ))}

        {/* Add section input */}
        {addingSection && (
          <div className="flex items-center gap-2 py-2 px-1 mt-2 border-t border-white/[0.06]">
            <input
              autoFocus
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addSection();
                if (e.key === 'Escape') { setAddingSection(false); setNewSectionTitle(''); }
              }}
              onBlur={() => { if (newSectionTitle.trim()) addSection(); else setAddingSection(false); }}
              placeholder="Sectienaam…"
              className="flex-1 bg-transparent text-sm font-semibold text-white placeholder-white/25 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Task detail modal (side panel) */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          subtasks={tasks.filter(t => t.parentTaskId === selectedTask.id)}
          onClose={() => setSelectedTask(null)}
          onUpdate={updateTask}
          onDelete={deleteTask}
          onAddSubtask={addSubtask}
          onToggle={toggleTask}
        />
      )}
    </div>
  );
};

export default TaskBoard;
