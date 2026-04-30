import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Project, ProjectComment, ProjectSubTask } from '../../lib/firebase/types';
import { projectService } from '../../lib/firebase/services';
import ProjectViewPage from './ProjectViewPage';
import ProjectEditPage from './ProjectEditPage';

interface ProjectModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface FormDataWithLocalSubTasks extends Partial<Project> {
  localSubTasks?: any[];
}

const ProjectModal: React.FC<ProjectModalProps> = ({ project, isOpen, onClose, onSave }) => {
  const { user } = useAuth();
  const canEdit = user?.role === 'admin';

  const [currentPage, setCurrentPage] = useState<'view' | 'edit'>('view');
  const [formData, setFormData] = useState<FormDataWithLocalSubTasks>(
    project || {
      title: '',
      description: '',
      status: 'not-started',
      coverUrl: '',
      internalDataLink: '',
      attachments: [],
      subTasks: [],
      agendaTaskIds: [],
      availableDateRanges: [],
      localSubTasks: [],
    }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setCurrentPage('view');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (currentPage === 'edit') {
          setCurrentPage('view');
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, currentPage, onClose]);

  const handleSave = async () => {
    try {
      setError('');
      setLoading(true);

      if (!formData.title?.trim()) {
        throw new Error('Project title is required');
      }

      if (!formData.description?.trim()) {
        throw new Error('Project description is required');
      }

      let savedProject: Project;

      if (project?.id) {
        // Update existing project
        await projectService.updateProject(project.id, formData as Project);
        savedProject = { ...project, ...formData } as Project;
      } else {
        // Create new project
        savedProject = await projectService.createProject(formData as any);
      }

      // Save any locally created sub-tasks
      const localSubTasks = (formData as any).localSubTasks || [];
      for (const subTask of localSubTasks) {
        if (!subTask.id) {
          // Only save if it's new (no id)
          await projectService.createSubTask(savedProject.id, {
            title: subTask.title,
            status: subTask.status || 'not-started',
            order: subTask.order,
          });
        }
      }

      onSave();
    } catch (err: any) {
      setError(err.message || 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 transition-all duration-300 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-black border border-white/10 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm border-b border-white/10 px-6 md:px-8 py-5 flex items-center justify-between rounded-t-3xl">
          {currentPage === 'edit' && (
            <button
              onClick={() => setCurrentPage('view')}
              className="p-2 hover:bg-white/10 rounded-full transition-colors mr-2"
            >
              <ChevronLeft size={24} className="text-white/60" />
            </button>
          )}
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-bold text-white truncate">
              {formData.title || 'New Project'}
            </h2>
            <p className="text-white/40 text-xs mt-1">
              {currentPage === 'view' ? 'Project Details' : 'Edit Project'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} className="text-white/60 hover:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 md:px-8 py-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {currentPage === 'view' ? (
            <ProjectViewPage
              project={formData as Project}
              onEdit={() => setCurrentPage('edit')}
              canEdit={canEdit}
            />
          ) : (
            <ProjectEditPage
              project={formData as Project}
              onFormChange={setFormData}
              loading={loading}
              onSave={handleSave}
              onCancel={() => setCurrentPage('view')}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;
