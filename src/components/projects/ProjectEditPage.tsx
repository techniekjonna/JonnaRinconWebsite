import React, { useState } from 'react';
import { Project, ProjectSubTask } from '../../lib/firebase/types';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { projectService } from '../../lib/firebase/services';

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
  const [subTasks, setSubTasks] = useState<ProjectSubTask[]>(project.subTasks || []);
  const [editingSubTask, setEditingSubTask] = useState<string | null>(null);

  const handleFieldChange = (field: string, value: any) => {
    onFormChange({
      ...project,
      [field]: value,
    });
  };

  const handleAddSubTask = async () => {
    if (!newSubTask.trim() || !project.id) return;

    try {
      const subTask = await projectService.createSubTask(project.id, {
        title: newSubTask,
        status: 'not-started',
        order: subTasks.length,
      });
      setSubTasks([...subTasks, subTask]);
      setNewSubTask('');
    } catch (error) {
      console.error('Failed to create sub-task:', error);
    }
  };

  const handleDeleteSubTask = async (id: string) => {
    try {
      await projectService.deleteSubTask(id);
      setSubTasks(subTasks.filter(t => t.id !== id));
    } catch (error) {
      console.error('Failed to delete sub-task:', error);
    }
  };

  const handleUpdateSubTask = async (id: string, title: string) => {
    try {
      await projectService.updateSubTask(id, { title } as any);
      setSubTasks(subTasks.map(t => (t.id === id ? { ...t, title } : t)));
      setEditingSubTask(null);
    } catch (error) {
      console.error('Failed to update sub-task:', error);
    }
  };

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
          <option value="completed">Completed</option>
        </select>
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
            // Auto-append /download if missing
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

        {/* Add New Sub-Task */}
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

        {/* Sub-Tasks List */}
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

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-white/10">
        <button
          onClick={onCancel}
          className="flex-1 py-2 px-4 bg-white/[0.05] border border-white/10 text-white rounded-lg hover:bg-white/[0.08] transition-colors font-semibold"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
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
