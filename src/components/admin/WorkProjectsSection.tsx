import React, { useState } from 'react';
import { useProjects } from '../../hooks/useProjects';
import { projectService } from '../../lib/firebase/services';
import { Project } from '../../lib/firebase/types';
import { Plus, Filter, Edit2, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';
import ProjectModal from '../projects/ProjectModal';

const STATUS_STYLE: Record<string, string> = {
  'completed':   'bg-green-500/20 text-green-400',
  'in-progress': 'bg-blue-500/20 text-blue-400',
  'on-hold':     'bg-orange-500/20 text-orange-400',
  'not-started': 'bg-yellow-500/20 text-yellow-400',
};

// ─── Compact project row ──────────────────────────────────────────────────────

const ProjectRow: React.FC<{
  project: Project;
  isAdmin: boolean;
  onOpen: (p: Project) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
}> = ({ project, isAdmin, onOpen, onDelete }) => (
  <div
    onClick={() => onOpen(project)}
    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.05] hover:border-white/[0.1] transition-all cursor-pointer group"
  >
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-white/90 truncate">{project.title}</p>
      {project.description && (
        <p className="text-xs text-white/35 truncate mt-0.5">{project.description}</p>
      )}
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">
      {(project as any).category && (
        <span className="hidden sm:block text-[10px] px-2 py-0.5 bg-purple-500/15 text-purple-400/80 rounded-full">
          {(project as any).category}
        </span>
      )}
      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[project.status] ?? STATUS_STYLE['not-started']}`}>
        {project.status.replace('-', ' ')}
      </span>
      {isAdmin && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <button onClick={(e) => { e.stopPropagation(); onOpen(project); }} className="p-1.5 text-white/30 hover:text-blue-400 transition-colors">
            <Edit2 size={13} />
          </button>
          <button onClick={(e) => onDelete(e, project.id)} className="p-1.5 text-white/30 hover:text-red-400 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  </div>
);

// ─── Collapsed "Voltooid" section ─────────────────────────────────────────────

const VoltooideProjecten: React.FC<{
  projects: Project[];
  isAdmin: boolean;
  onOpen: (p: Project) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
}> = ({ projects, isAdmin, onOpen, onDelete }) => {
  const [open, setOpen] = useState(false);

  if (projects.length === 0) return null;

  return (
    <div className="mt-6">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-white/25 hover:text-white/40 transition-colors text-xs font-semibold uppercase tracking-wider py-1"
      >
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        Voltooid
        <span className="ml-0.5 font-normal text-white/20">{projects.length}</span>
      </button>

      {open && (
        <div className="mt-2 space-y-1.5 opacity-60">
          {projects.map((p) => (
            <ProjectRow key={p.id} project={p} isAdmin={isAdmin} onOpen={onOpen} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const WorkProjectsSection: React.FC<{ isAdmin?: boolean }> = ({ isAdmin = true }) => {
  const { projects, loading, refetch } = useProjects();
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const activeProjects = projects.filter((p) => {
    if (p.status === 'completed') return false;
    if (selectedStatus && p.status !== selectedStatus) return false;
    return true;
  });

  const completedProjects = projects.filter((p) => p.status === 'completed');

  const handleOpen = (project: Project) => { setSelectedProject(project); setShowModal(true); };
  const handleCreate = () => { setSelectedProject(null); setShowModal(true); };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Project verwijderen?')) return;
    try { await projectService.deleteProject(id); } catch (err: any) { alert(err.message); }
  };

  const STATUS_FILTERS = ['in-progress', 'not-started', 'on-hold'];

  return (
    <div className="space-y-3">
      {/* Minimal header: only actions */}
      <div className="flex items-center justify-end gap-2">
        {isAdmin && (
          <button
            onClick={handleCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-all"
          >
            <Plus size={13} />
            New Project
          </button>
        )}
        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded-lg border transition-all text-xs ${
              selectedStatus
                ? 'bg-red-600 border-red-600 text-white'
                : 'bg-white/[0.06] border-white/[0.08] text-white/50 hover:text-white'
            }`}
          >
            <Filter size={14} />
          </button>
          {showFilters && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-black/95 backdrop-blur-xl border border-white/[0.08] rounded-xl p-2 shadow-2xl z-50">
              {selectedStatus && (
                <button onClick={() => { setSelectedStatus(null); setShowFilters(false); }} className="w-full text-left px-2 py-1 text-xs text-red-400 hover:text-red-300 mb-1">
                  Wis filter
                </button>
              )}
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setSelectedStatus(selectedStatus === s ? null : s); setShowFilters(false); }}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                    selectedStatus === s ? 'bg-red-600/20 text-red-400' : 'text-white/60 hover:bg-white/[0.08]'
                  }`}
                >
                  {s.replace('-', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active projects */}
      {loading ? (
        <div className="py-10 flex items-center justify-center">
          <LoadingSpinner text="Projecten laden..." />
        </div>
      ) : activeProjects.length === 0 ? (
        <div className="py-10 text-center text-white/30 text-sm">
          {selectedStatus ? `Geen ${selectedStatus.replace('-', ' ')} projecten` : 'Geen projecten'}
        </div>
      ) : (
        <div className="space-y-1.5">
          {activeProjects.map((p) => (
            <ProjectRow key={p.id} project={p} isAdmin={isAdmin} onOpen={handleOpen} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Voltooid (completed) — collapsed */}
      <VoltooideProjecten
        projects={completedProjects}
        isAdmin={isAdmin}
        onOpen={handleOpen}
        onDelete={handleDelete}
      />

      {showModal && (
        <ProjectModal
          project={selectedProject}
          isOpen={showModal}
          onClose={() => { setShowModal(false); setSelectedProject(null); }}
          onSave={() => { setShowModal(false); setSelectedProject(null); refetch(); }}
        />
      )}
    </div>
  );
};

export default WorkProjectsSection;
