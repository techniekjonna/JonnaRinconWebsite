import React, { useState, useEffect } from 'react';
import { Plus, Filter } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Project, ProjectFilterType } from '../../lib/firebase/types';
import { projectService } from '../../lib/firebase/services';
import LoadingSpinner from '../LoadingSpinner';
import ProjectCard from './ProjectCard';
import ProjectModal from './ProjectModal';

const ProjectsPanel: React.FC = () => {
  const { user } = useAuth();
  const canEdit = user?.role === 'admin';

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ProjectFilterType>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const allProjects = await projectService.getAllProjects();
      setProjects(allProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (projectList: Project[]): Project[] => {
    switch (filter) {
      case 'all':
        return projectList;
      case 'completed':
        return projectList.filter(p => p.status === 'completed');
      case 'in-progress':
        return projectList.filter(p => p.status === 'in-progress');
      case 'not-started':
        return projectList.filter(p => p.status === 'not-started');
      case 'not-completed':
        return projectList.filter(p => p.status !== 'completed');
      case 'now-working':
        return projectList.filter(p => p.status === 'in-progress');
      default:
        return projectList;
    }
  };

  const filteredProjects = applyFilters(projects);

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedProject(null);
  };

  const handleCreateProject = () => {
    setSelectedProject(null);
    setModalOpen(true);
  };

  const handleProjectSaved = () => {
    loadProjects();
    handleModalClose();
  };

  const filterOptions: { label: string; value: ProjectFilterType }[] = [
    { label: 'All Projects', value: 'all' },
    { label: 'Completed', value: 'completed' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Not Started', value: 'not-started' },
    { label: 'Not Completed', value: 'not-completed' },
    { label: 'Now Working On', value: 'now-working' },
  ];

  return (
    <div className="space-y-3">
      {/* Header with Filter & Create Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Projects</h2>
        <div className="flex items-center gap-3">
          {/* Filter Button */}
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="p-1.5 hover:bg-white/[0.08] rounded-lg border border-white/[0.06] transition-colors"
              title="Filter projects"
            >
              <Filter size={18} className="text-white/60" />
            </button>

            {showFilterMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-black border border-white/[0.06] rounded-lg p-2 z-50">
                {filterOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setFilter(option.value);
                      setShowFilterMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-xs transition-colors ${
                      filter === option.value
                        ? 'bg-red-600/20 text-red-400'
                        : 'text-white/70 hover:bg-white/[0.08]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Create Button (Admin Only) */}
          {canEdit && (
            <button
              onClick={handleCreateProject}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all text-sm"
            >
              <Plus size={16} />
              New Project
            </button>
          )}
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner text="Loading projects..." />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-white/50 mb-4">
            {filter === 'all' ? 'No projects yet' : `No ${filter.replace('-', ' ')} projects`}
          </p>
          {canEdit && (
            <button
              onClick={handleCreateProject}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all"
            >
              Create First Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredProjects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelect={handleSelectProject}
              availableDaysCount={project.availableDateRanges?.length || 0}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}

      {/* Project Modal */}
      {modalOpen && (
        <ProjectModal
          project={selectedProject}
          isOpen={modalOpen}
          onClose={handleModalClose}
          onSave={handleProjectSaved}
        />
      )}
    </div>
  );
};

export default ProjectsPanel;
