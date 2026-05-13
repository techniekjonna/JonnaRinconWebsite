import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import ManagerLayout from '../../components/manager/ManagerLayout';
import { projectService } from '../../lib/firebase/services';
import { useProjects } from '../../hooks/useProjects';
import { Project } from '../../lib/firebase/types';
import { Plus, Filter, Edit2, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import ProjectModal from '../../components/projects/ProjectModal';

const BUILT_IN_CATEGORIES = ['artist', 'producer'];

function deriveCategories(projects: Project[]): string[] {
  const custom = new Set<string>();
  projects.forEach((p) => {
    const cat = (p as any).category as string | undefined;
    if (cat && cat !== 'other' && !BUILT_IN_CATEGORIES.includes(cat)) custom.add(cat);
  });
  return ['all', ...BUILT_IN_CATEGORIES, ...Array.from(custom), 'other'];
}

const STATUS_STYLES: Record<string, string> = {
  completed:     'bg-green-500/20 text-green-400',
  'in-progress': 'bg-blue-500/20 text-blue-400',
  'on-hold':     'bg-orange-500/20 text-orange-400',
  'not-started': 'bg-yellow-500/20 text-yellow-400',
};

interface ProjectRowProps {
  project: Project;
  isAdmin: boolean;
  onOpen: (p: Project) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
}

const ProjectRow: React.FC<ProjectRowProps> = ({ project, isAdmin, onOpen, onDelete }) => (
  <div
    onClick={() => onOpen(project)}
    className="bg-white/[0.04] border border-white/[0.05] rounded-lg px-3 py-2 hover:bg-white/[0.07] transition-all flex items-center gap-3 group cursor-pointer"
  >
    <div className="flex-1 min-w-0 flex items-center gap-2">
      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${STATUS_STYLES[project.status] ?? 'bg-white/10 text-white/50'}`}>
        {project.status.replace('-', ' ')}
      </span>
      <p className="font-medium text-white text-sm truncate">{project.title}</p>
      {(project as any).category && (
        <span className="hidden sm:inline text-[10px] px-1.5 py-0.5 bg-purple-500/15 text-purple-400 rounded flex-shrink-0">
          {(project as any).category}
        </span>
      )}
    </div>
    {isAdmin && (
      <div
        className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onOpen(project); }}
          className="p-1.5 text-white/30 hover:text-blue-400 transition-colors"
          title="Edit"
        >
          <Edit2 size={13} />
        </button>
        <button
          onClick={(e) => onDelete(e, project.id)}
          className="p-1.5 text-white/30 hover:text-red-400 transition-colors"
          title="Delete"
        >
          <Trash2 size={13} />
        </button>
      </div>
    )}
  </div>
);

export const ProjectsContent: React.FC<{ isAdmin?: boolean }> = ({ isAdmin = true }) => {
  const { projects, loading, refetch } = useProjects();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [completedExpanded, setCompletedExpanded] = useState(false);

  const categoryTabs = deriveCategories(projects);

  const filtered = projects.filter((p) => {
    const cat = ((p as any).category as string | undefined) || 'other';
    if (activeTab !== 'all' && cat !== activeTab) return false;
    if (selectedStatus && p.status !== selectedStatus) return false;
    return true;
  });

  const activeProjects = filtered.filter((p) => p.status !== 'completed');
  const completedProjects = filtered.filter((p) => p.status === 'completed');

  const handleCreate = () => { setSelectedProject(null); setShowModal(true); };
  const handleOpenProject = (project: Project) => { setSelectedProject(project); setShowModal(true); };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await projectService.deleteProject(id);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const hasActiveFilters = selectedStatus !== null;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1 overflow-x-auto">
          {categoryTabs.map((tab) => {
            const isActiveTab = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 font-semibold text-[11px] whitespace-nowrap rounded-lg transition-all ${
                  isActiveTab
                    ? 'bg-white/[0.10] text-white'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/[0.05]'
                }`}
              >
                {tab.toUpperCase()}
              </button>
            );
          })}
        </div>
        {isAdmin && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-1.5 rounded-lg border transition-all text-sm ${
                  hasActiveFilters
                    ? 'bg-red-600 border-red-600 text-white'
                    : 'bg-white/[0.05] border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.10]'
                }`}
              >
                <Filter size={14} />
              </button>
              {showFilters && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-black/95 backdrop-blur-xl border border-white/[0.08] rounded-xl p-3 shadow-2xl z-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-white/60 uppercase">Status</span>
                    {hasActiveFilters && (
                      <button onClick={() => setSelectedStatus(null)} className="text-xs text-red-400 hover:text-red-300">Clear</button>
                    )}
                  </div>
                  {['not-started', 'in-progress', 'completed', 'on-hold'].map((status) => (
                    <button
                      key={status}
                      onClick={() => { setSelectedStatus(selectedStatus === status ? null : status); setShowFilters(false); }}
                      className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                        selectedStatus === status ? 'bg-red-600/20 text-red-400' : 'text-white/70 hover:bg-white/[0.08]'
                      }`}
                    >
                      {status.replace('-', ' ').toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleCreate}
              className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:from-red-700 hover:to-pink-700 transition-all flex items-center gap-1.5 text-xs"
            >
              <Plus size={13} />
              Nieuw
            </button>
          </div>
        )}
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="py-10">
          <LoadingSpinner text="Loading projects..." />
        </div>
      ) : activeProjects.length === 0 && completedProjects.length === 0 ? (
        <div className="py-10 text-center text-white/40 text-sm">
          Geen projecten gevonden
        </div>
      ) : (
        <div className="space-y-1">
          {activeProjects.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              isAdmin={isAdmin}
              onOpen={handleOpenProject}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Voltooid section — collapsed by default */}
      {completedProjects.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setCompletedExpanded(!completedExpanded)}
            className="flex items-center gap-1.5 py-1 text-white/25 hover:text-white/40 transition-colors w-full text-left"
          >
            {completedExpanded
              ? <ChevronDown size={12} className="flex-shrink-0" />
              : <ChevronRight size={12} className="flex-shrink-0" />}
            <span className="text-xs font-medium uppercase tracking-wide">Voltooid ({completedProjects.length})</span>
          </button>
          {completedExpanded && (
            <div className="space-y-1 mt-1 opacity-50">
              {completedProjects.map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  isAdmin={isAdmin}
                  onOpen={handleOpenProject}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}

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

const ProjectsAdminPage: React.FC = () => (
  <AdminLayout>
    <ProjectsContent isAdmin={true} />
  </AdminLayout>
);

export default ProjectsAdminPage;

export const ManagerProjectsPage: React.FC = () => (
  <ManagerLayout>
    <ProjectsContent isAdmin={false} />
  </ManagerLayout>
);
