import React from 'react';
import { Project } from '../../lib/firebase/types';
import { Edit2, ChevronRight } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onSelect: (project: Project) => void;
  availableDaysCount: number;
  canEdit: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onSelect, availableDaysCount, canEdit }) => {
  const statusColors: Record<string, string> = {
    'completed': 'bg-green-500/20 text-green-400',
    'in-progress': 'bg-blue-500/20 text-blue-400',
    'on-hold': 'bg-orange-500/20 text-orange-400',
    'awaiting-feedback': 'bg-purple-500/20 text-purple-400',
    'not-started': 'bg-yellow-500/20 text-yellow-400',
  };

  const statusBg = statusColors[project.status] || 'bg-gray-500/20 text-gray-400';

  return (
    <button
      onClick={() => onSelect(project)}
      className="w-full bg-white/[0.08] border border-white/[0.06] rounded-xl p-4 hover:border-white/[0.12] transition-all flex flex-col text-left cursor-pointer"
    >
      {project.coverUrl ? (
        <div className="w-12 h-12 rounded-lg overflow-hidden mb-3 flex-shrink-0">
          <img
            src={project.coverUrl}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-3">
          <span className="text-white text-sm font-bold">{project.title.charAt(0).toUpperCase()}</span>
        </div>
      )}

      <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2">
        {project.title}
      </h3>

      <p className="text-white/50 text-xs leading-relaxed mb-3 flex-1 line-clamp-2">
        {project.description}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-1.5">
          <span className={`text-xs px-2 py-0.5 rounded ${statusBg}`}>
            {project.status.replace('-', ' ').toUpperCase()}
          </span>
          {availableDaysCount > 0 && (
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
              {availableDaysCount}
            </span>
          )}
        </div>
        <span className="flex items-center gap-1 text-xs text-white/40">
          {canEdit && <Edit2 size={14} />}
          <ChevronRight size={14} />
        </span>
      </div>
    </button>
  );
};

export default ProjectCard;
