import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import ManagerLayout from '../../components/manager/ManagerLayout';
import { projectService } from '../../lib/firebase/services';
import { useProjects } from '../../hooks/useProjects';
import { Project } from '../../lib/firebase/types';
import { Plus, Filter, Edit2, Trash2 } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import ProjectModal from '../../components/projects/ProjectModal';

type ProjectCategory = 'all' | 'artist' | 'producer' | 'other';

// Shared inner content — usable in admin (editable) and manager (read-only)
export const ProjectsContent: React.FC<{ isAdmin?: boolean }> = ({ isAdmin = true }) => {
  const { projects, loading } = useProjects();
  const [activeTab, setActiveTab] = useState<ProjectCategory>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const filteredProjects = projects.filter(p => {
    const projectCategory = (p as any).category || 'other';
    if (activeTab !== 'all' && projectCategory !== activeTab) return false;
    if (selectedStatus && p.status !== selectedStatus) return false;
    return true;
  });

  const handleCreate = () => { setEditingProject(null); setShowModal(true); };
  const handleEdit = (project: Project) => { setEditingProject(project); setShowModal(true); };

  const handleDelete = async (id: string) => {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Projecten</h1>
          <p className="text-white/40 mt-1 text-sm">Muziekproductieprojecten</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreate}
              className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-2 rounded-xl font-semibold hover:from-red-700 hover:to-pink-700 transition-all flex items-center gap-2 text-sm"
            >
              <Plus size={16} />
              <span>New Project</span>
            </button>
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-xl border transition-all text-sm ${
                  hasActiveFilters
                    ? 'bg-red-600 border-red-600 text-white'
                    : 'bg-white/[0.06] border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.12]'
                }`}
              >
                <Filter size={16} />
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
                      onClick={() => setSelectedStatus(selectedStatus === status ? null : status)}
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
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-white/[0.1]">
        {(['all', 'artist', 'producer', 'other'] as ProjectCategory[]).map((tab) => {
          const label = tab === 'all' ? 'ALL' : tab.toUpperCase();
          const isActiveTab = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 font-semibold text-sm transition-all relative ${
                isActiveTab ? 'text-white' : 'text-white/40 hover:text-white'
              }`}
            >
              <span>{label}</span>
              {isActiveTab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-600 to-pink-600" />}
            </button>
          );
        })}
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-8">
          <LoadingSpinner text="Loading projects..." />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-8 text-center text-white/40 text-sm">
          Geen projecten gevonden
        </div>
      ) : (
        <div className="space-y-2">
          {filteredProjects.map((project) => (
            <div key={project.id} className="bg-white/[0.05] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.08] transition-all flex items-center justify-between group">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm">{project.title}</p>
                {project.description && <p className="text-xs text-white/40 mt-0.5 truncate">{project.description}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    project.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    project.status === 'in-progress' ? 'bg-blue-500/20 text-blue-400' :
                    project.status === 'on-hold' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {project.status.replace('-', ' ')}
                  </span>
                  {(project as any).category && (
                    <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">
                      {(project as any).category}
                    </span>
                  )}
                </div>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ml-3">
                  <button onClick={() => handleEdit(project)} className="p-2 text-white/40 hover:text-blue-400 transition-colors" title="Edit">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => handleDelete(project.id)} className="p-2 text-white/40 hover:text-red-400 transition-colors" title="Delete">
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isAdmin && showModal && (
        <ProjectModal
          project={editingProject}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); setEditingProject(null); }}
        />
      )}
    </div>
  );
};

// Admin version — full CRUD
const ProjectsAdminPage: React.FC = () => (
  <AdminLayout>
    <ProjectsContent isAdmin={true} />
  </AdminLayout>
);

export default ProjectsAdminPage;

// Manager version — read-only, exported for use in manager routes
export const ManagerProjectsPage: React.FC = () => (
  <ManagerLayout>
    <ProjectsContent isAdmin={false} />
  </ManagerLayout>
);
