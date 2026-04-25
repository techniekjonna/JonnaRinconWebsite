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
    'in-progress': 'bg-orange-500/20 text-orange-400',
    'not-started': 'bg-yellow-500/20 text-yellow-400',
  };

  const statusBg = statusColors[project.status] || 'bg-gray-500/20 text-gray-400';

  return (
    <button
      onClick={() => onSelect(project)}
      className="group relative bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-3xl p-6 md:p-8 hover:border-white/[0.12] transition-all duration-500 hover:scale-[1.02] hover:bg-white/[0.08] flex flex-col text-left cursor-pointer"
    >
      {project.coverUrl ? (
        <div className="w-14 h-14 rounded-2xl overflow-hidden mb-6 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
          <img
            src={project.coverUrl}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
          <span className="text-white text-lg font-bold">{project.title.charAt(0).toUpperCase()}</span>
        </div>
      )}

      <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight line-clamp-2">
        {project.title}
      </h3>

      <p className="text-white/50 text-sm leading-relaxed mb-4 flex-1 line-clamp-2">
        {project.description}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-1 rounded ${statusBg}`}>
            {project.status.replace('-', ' ').toUpperCase()}
          </span>
          {availableDaysCount > 0 && (
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded font-medium">
              {availableDaysCount} (free)
            </span>
          )}
        </div>
        <span className="flex items-center gap-2 text-xs text-white/40 group-hover:text-white/60 transition-colors">
          {canEdit && <Edit2 size={14} />}
          <ChevronRight size={16} />
        </span>
      </div>
    </button>
  );
};

export default ProjectCard;
