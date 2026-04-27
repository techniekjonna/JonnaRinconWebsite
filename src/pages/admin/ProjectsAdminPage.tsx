import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { projectService } from '../../lib/firebase/services';
import { useProjects } from '../../hooks/useProjects';
import { Project } from '../../lib/firebase/types';
import { Plus, Filter, Edit2, Trash2, ChevronDown } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import ProjectModal from '../../components/projects/ProjectModal';

type ProjectCategory = 'all' | 'artist' | 'producer' | 'other';

const ProjectsAdminPage: React.FC = () => {
  const { projects, loading } = useProjects();
  const [activeTab, setActiveTab] = useState<ProjectCategory>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const filteredProjects = projects.filter(p => {
    // Filter by category
    const projectCategory = (p as any).category || 'other';
    if (activeTab !== 'all' && projectCategory !== activeTab) return false;

    // Filter by status
    if (selectedStatus && p.status !== selectedStatus) return false;

    return true;
  });

  const handleCreate = () => {
    setEditingProject(null);
    setShowModal(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await projectService.deleteProject(id);
      alert('Project deleted successfully');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const hasActiveFilters = selectedStatus !== null;
  const clearAllFilters = () => setSelectedStatus(null);

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div>
          <h1 className="text-xl font-bold text-white">Projecten</h1>
          <p className="text-white/40 mt-1 text-sm">Beheer je muziekproductieprojecten</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 border-b border-white/[0.1]">
          {(['all', 'artist', 'producer', 'other'] as ProjectCategory[]).map((tab) => {
            const label = tab === 'all' ? 'PROJECTS (ALL)' : tab.toUpperCase();
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-semibold text-sm transition-all relative group ${
                  isActive
                    ? 'text-white'
                    : 'text-white/40 hover:text-white hover:brightness-110'
                }`}
              >
                <span>{label}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-600 to-pink-600" />
                )}
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div></div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreate}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>New Project</span>
            </button>

            {/* Filter Button */}
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-3 rounded-lg border transition-all ${
                  hasActiveFilters
                    ? 'bg-red-600 border-red-600 text-white'
                    : 'bg-white/[0.06] border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.12]'
                }`}
                title={showFilters ? 'Hide filters' : 'Show filters'}
              >
                <Filter size={20} />
              </button>

              {showFilters && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-black/90 backdrop-blur-xl border border-white/[0.08] rounded-xl p-4 shadow-2xl z-50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white">Status</h3>
                    {hasActiveFilters && (
                      <button
                        onClick={clearAllFilters}
                        className="text-xs text-red-400 hover:text-red-300 transition"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {['not-started', 'in-progress', 'completed', 'on-hold'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setSelectedStatus(selectedStatus === status ? null : status)}
                        className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                          selectedStatus === status
                            ? 'bg-red-600/20 text-red-400'
                            : 'text-white/70 hover:bg-white/[0.08]'
                        }`}
                      >
                        {status.replace('-', ' ').toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Projects List */}
        {loading ? (
          <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-8">
            <LoadingSpinner text="Loading projects..." />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-8 text-center text-white/40">
            No projects found
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProjects.map((project) => (
              <div key={project.id} className="bg-white/[0.05] border border-white/[0.06] rounded-lg p-4 hover:bg-white/[0.08] transition-all flex items-center justify-between group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div>
                      <p className="font-medium text-white text-sm">{project.title}</p>
                      <p className="text-xs text-white/40">{project.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      project.status === 'completed'
                        ? 'bg-green-500/20 text-green-400'
                        : project.status === 'in-progress'
                        ? 'bg-blue-500/20 text-blue-400'
                        : project.status === 'on-hold'
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {project.status.replace('-', ' ').toUpperCase()}
                    </span>
                    {(project as any).category && (
                      <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                        {(project as any).category.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                  <button
                    onClick={() => handleEdit(project)}
                    className="p-2 text-white/40 hover:text-blue-400 transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="p-2 text-white/40 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <ProjectModal
          project={editingProject}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            setEditingProject(null);
          }}
        />
      )}
    </AdminLayout>
  );
};

export default ProjectsAdminPage;
