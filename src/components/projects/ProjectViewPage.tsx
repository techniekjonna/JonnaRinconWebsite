import React, { useState, useEffect } from 'react';
import { ChevronDown, Edit2, MessageCircle, CheckCircle2, Smile, Trash2 } from 'lucide-react';
import { Project, ProjectComment, ProjectSubTask } from '../../lib/firebase/types';
import { projectService } from '../../lib/firebase/services';
import { useAuth } from '../../contexts/AuthContext';

interface ProjectViewPageProps {
  project: Project;
  onEdit: () => void;
  canEdit: boolean;
}

const EMOJI_REACTIONS = ['👍', '❤️', '😀', '🔥', '🎉', '✅', '💯'];

const ProjectViewPage: React.FC<ProjectViewPageProps> = ({ project, onEdit, canEdit }) => {
  const { user } = useAuth();
  const [expandedSections, setExpandedSections] = useState({
    description: true,
    subTasks: true,
    attachments: true,
    comments: true,
  });
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [subTasks, setSubTasks] = useState<ProjectSubTask[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);

  useEffect(() => {
    if (project.id) {
      loadData();
    }
  }, [project.id]);

  const loadData = async () => {
    try {
      const [fetchedComments, fetchedSubTasks] = await Promise.all([
        projectService.getCommentsByProject(project.id),
        projectService.getSubTasksByProject(project.id),
      ]);
      setComments(fetchedComments);
      setSubTasks(fetchedSubTasks);
    } catch (error) {
      console.error('Failed to load project data:', error);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !project.id) return;

    try {
      setLoading(true);
      await projectService.createComment(project.id, newComment);
      setNewComment('');
      await loadData();
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await projectService.deleteComment(commentId);
      await loadData();
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleAddReaction = async (commentId: string, emoji: string) => {
    try {
      await projectService.addReaction(commentId, emoji);
      await loadData();
      setShowEmojiPicker(null);
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const handleRemoveReaction = async (commentId: string, emoji: string) => {
    try {
      await projectService.removeReaction(commentId, emoji);
      await loadData();
    } catch (error) {
      console.error('Failed to remove reaction:', error);
    }
  };

  const handleToggleSubTaskComplete = async (task: ProjectSubTask) => {
    try {
      const newStatus = task.status === 'completed' ? 'in-progress' : 'completed';
      await projectService.updateSubTask(task.id, { ...task, status: newStatus } as any);
      await loadData();
    } catch (error) {
      console.error('Failed to update sub-task:', error);
    }
  };

  const statusColors: Record<string, string> = {
    'completed': 'bg-green-500/20 text-green-400',
    'in-progress': 'bg-orange-500/20 text-orange-400',
    'not-started': 'bg-yellow-500/20 text-yellow-400',
  };

  return (
    <div className="space-y-4">
      {/* Cover Image */}
      {project.coverUrl && (
        <div className="w-full h-40 rounded-xl overflow-hidden mb-4">
          <img src={project.coverUrl} alt={project.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Status Badge & Edit Button */}
      <div className="flex items-center justify-between mb-4">
        <span className={`text-sm font-bold px-3 py-1 rounded ${statusColors[project.status]}`}>
          {project.status.replace('-', ' ').toUpperCase()}
        </span>
        {canEdit && (
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-3 py-1 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded transition-colors text-sm font-medium"
          >
            <Edit2 size={16} />
            Edit
          </button>
        )}
      </div>

      {/* Description Section */}
      <div className="border-t border-white/10 pt-4">
        <button
          onClick={() => toggleSection('description')}
          className="w-full flex items-center justify-between py-2 hover:bg-white/[0.02] rounded transition-colors"
        >
          <h3 className="text-sm font-semibold text-white/60 uppercase">Description</h3>
          <ChevronDown
            size={18}
            className={`text-white/40 transition-transform ${expandedSections.description ? 'rotate-180' : ''}`}
          />
        </button>
        {expandedSections.description && (
          <div className="py-3 text-white/70 text-sm leading-relaxed">{project.description}</div>
        )}
      </div>

      {/* Sub-Tasks Section */}
      {subTasks.length > 0 && (
        <div className="border-t border-white/10 pt-4">
          <button
            onClick={() => toggleSection('subTasks')}
            className="w-full flex items-center justify-between py-2 hover:bg-white/[0.02] rounded transition-colors"
          >
            <h3 className="text-sm font-semibold text-white/60 uppercase">Sub-Tasks ({subTasks.length})</h3>
            <ChevronDown
              size={18}
              className={`text-white/40 transition-transform ${expandedSections.subTasks ? 'rotate-180' : ''}`}
            />
          </button>
          {expandedSections.subTasks && (
            <div className="space-y-2 py-3">
              {subTasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-2 rounded bg-white/[0.02] hover:bg-white/[0.05] transition-colors group cursor-pointer"
                  onClick={() => handleToggleSubTaskComplete(task)}
                >
                  <CheckCircle2
                    size={18}
                    className={task.status === 'completed' ? 'text-green-400 mt-0.5 flex-shrink-0' : 'text-white/30 mt-0.5 flex-shrink-0'}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${task.status === 'completed' ? 'line-through text-white/40' : 'text-white'}`}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-white/40 mt-1">{task.description}</p>
                    )}
                  </div>
                  <span className="text-xs bg-white/10 text-white/50 px-2 py-0.5 rounded flex-shrink-0">
                    {task.status.replace('-', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Attachments Section */}
      {project.attachments && project.attachments.length > 0 && (
        <div className="border-t border-white/10 pt-4">
          <button
            onClick={() => toggleSection('attachments')}
            className="w-full flex items-center justify-between py-2 hover:bg-white/[0.02] rounded transition-colors"
          >
            <h3 className="text-sm font-semibold text-white/60 uppercase">Files ({project.attachments.length})</h3>
            <ChevronDown
              size={18}
              className={`text-white/40 transition-transform ${expandedSections.attachments ? 'rotate-180' : ''}`}
            />
          </button>
          {expandedSections.attachments && (
            <div className="space-y-2 py-3">
              {project.attachments.map(attachment => (
                <a
                  key={attachment.id}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-2 rounded bg-white/[0.02] hover:bg-white/[0.05] transition-colors text-sm text-white/70 hover:text-white truncate"
                  title={attachment.name}
                >
                  📎 {attachment.name}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Comments Section */}
      <div className="border-t border-white/10 pt-4">
        <button
          onClick={() => toggleSection('comments')}
          className="w-full flex items-center justify-between py-2 hover:bg-white/[0.02] rounded transition-colors"
        >
          <h3 className="text-sm font-semibold text-white/60 uppercase flex items-center gap-2">
            <MessageCircle size={16} />
            Comments ({comments.length})
          </h3>
          <ChevronDown
            size={18}
            className={`text-white/40 transition-transform ${expandedSections.comments ? 'rotate-180' : ''}`}
          />
        </button>

        {expandedSections.comments && (
          <div className="py-3 space-y-4">
            {/* Add Comment */}
            <div className="flex gap-2">
              <img
                src={user?.photoURL || 'https://via.placeholder.com/32'}
                alt={user?.displayName}
                className="w-8 h-8 rounded-full"
              />
              <div className="flex-1 space-y-2">
                <textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full px-3 py-2 bg-white/[0.05] border border-white/10 rounded text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/20"
                  rows={2}
                />
                <button
                  onClick={handleAddComment}
                  disabled={loading || !newComment.trim()}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white text-xs font-medium rounded transition-colors"
                >
                  Comment
                </button>
              </div>
            </div>

            {/* Comments List */}
            {comments.length > 0 && (
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {comments.map(comment => (
                  <div key={comment.id} className="p-3 rounded bg-white/[0.02] group">
                    <div className="flex items-start gap-2 mb-2">
                      <img
                        src="https://via.placeholder.com/28"
                        alt={comment.userDisplayName}
                        className="w-7 h-7 rounded-full flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-white">{comment.userDisplayName}</p>
                          <span className="text-[10px] text-white/40">{comment.userRole}</span>
                        </div>
                        <p className="text-xs text-white/70 mt-1">{comment.content}</p>
                      </div>
                      {canEdit && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-600/20 text-red-400 rounded transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    {/* Reactions */}
                    <div className="flex flex-wrap gap-1 items-center">
                      {comment.reactions.map((reaction, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleRemoveReaction(comment.id, reaction.emoji)}
                          className="px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded text-xs transition-colors"
                        >
                          {reaction.emoji}
                        </button>
                      ))}

                      {/* Emoji Picker Button */}
                      <div className="relative">
                        <button
                          onClick={() => setShowEmojiPicker(showEmojiPicker === comment.id ? null : comment.id)}
                          className="p-1 hover:bg-white/10 rounded transition-colors text-white/40 hover:text-white"
                        >
                          <Smile size={14} />
                        </button>

                        {/* Emoji Picker Dropdown */}
                        {showEmojiPicker === comment.id && (
                          <div className="absolute bottom-full mb-2 bg-black border border-white/20 rounded-lg p-2 z-10 flex gap-1 flex-wrap w-44">
                            {EMOJI_REACTIONS.map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => handleAddReaction(comment.id, emoji)}
                                className="p-1 hover:bg-white/20 rounded transition-colors text-lg"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {comments.length === 0 && (
              <p className="text-xs text-white/40 text-center py-4">No comments yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectViewPage;
