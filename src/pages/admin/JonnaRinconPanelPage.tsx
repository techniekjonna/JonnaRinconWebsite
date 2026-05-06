import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import ManagerLayout from '../../components/manager/ManagerLayout';
import { AgendaContent } from './AgendaPage';
import { ProjectsContent } from './ProjectsAdminPage';
import { SocialPlannerContent } from './ContentPage';
import ComingUpTab from '../../components/admin/ComingUpTab';
import TaskBoard from '../../components/admin/TaskBoard';
import { Calendar, FolderKanban, Instagram, Star, ClipboardList } from 'lucide-react';

type PanelSection = 'agenda' | 'projects' | 'tasks' | 'social' | 'coming-up';

interface SectionDef {
  id: PanelSection;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  group: 'work' | 'time';
}

const SECTIONS: SectionDef[] = [
  { id: 'projects', label: 'Projects', sublabel: 'Manage & track projects', icon: <FolderKanban size={18} />, group: 'work' },
  { id: 'tasks', label: 'Tasks', sublabel: 'Task board', icon: <ClipboardList size={18} />, group: 'work' },
  { id: 'agenda', label: 'Agenda', sublabel: 'Planning & availability', icon: <Calendar size={18} />, group: 'time' },
  { id: 'social', label: 'Social Media Planner', sublabel: 'Content planning', icon: <Instagram size={18} />, group: 'time' },
  { id: 'coming-up', label: 'Coming Up', sublabel: 'Releases & events', icon: <Star size={18} />, group: 'time' },
];

export const JonnaRinconPanelContent: React.FC<{ isAdmin?: boolean }> = ({ isAdmin = true }) => {
  const [activeSection, setActiveSection] = useState<PanelSection>('projects');

  const workSections = SECTIONS.filter((s) => s.group === 'work');
  const timeSections = SECTIONS.filter((s) => s.group === 'time');

  const renderContent = () => {
    switch (activeSection) {
      case 'projects':
        return <ProjectsContent isAdmin={isAdmin} />;
      case 'tasks':
        return <TaskBoard />;
      case 'agenda':
        return <AgendaContent />;
      case 'social':
        return <SocialPlannerContent />;
      case 'coming-up':
        return <ComingUpTab />;
    }
  };

  const NavButton: React.FC<{ section: SectionDef }> = ({ section }) => {
    const isActive = activeSection === section.id;
    return (
      <button
        onClick={() => setActiveSection(section.id)}
        className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-2xl transition-all duration-200 ${
          isActive
            ? 'bg-white/[0.10] border border-white/[0.12] text-white'
            : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04] border border-transparent'
        }`}
      >
        <span className={isActive ? 'text-red-400' : 'text-white/30'}>{section.icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight">{section.label}</p>
          <p className="text-[11px] text-white/30 mt-0.5 leading-tight">{section.sublabel}</p>
        </div>
        {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />}
      </button>
    );
  };

  return (
    <div className="flex gap-6 min-h-[calc(100vh-8rem)]">
      {/* Sidebar navigation */}
      <aside className="w-56 flex-shrink-0 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white mb-1">Jonna Rincon Panel</h1>
          <p className="text-xs text-white/30">Persoonlijk overzicht</p>
        </div>

        {/* Work-focused */}
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest px-1 mb-2">
            Werkgericht
          </p>
          {workSections.map((s) => (
            <NavButton key={s.id} section={s} />
          ))}
        </div>

        {/* Time/date-focused */}
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest px-1 mb-2">
            Tijd & Datum
          </p>
          {timeSections.map((s) => (
            <NavButton key={s.id} section={s} />
          ))}
        </div>
      </aside>

      {/* Vertical divider */}
      <div className="w-px bg-white/[0.06] flex-shrink-0" />

      {/* Main content */}
      <main className="flex-1 min-w-0">{renderContent()}</main>
    </div>
  );
};

const JonnaRinconPanelPage: React.FC = () => (
  <AdminLayout>
    <JonnaRinconPanelContent isAdmin={true} />
  </AdminLayout>
);

export default JonnaRinconPanelPage;

export const ManagerJonnaRinconPanelPage: React.FC = () => (
  <ManagerLayout>
    <JonnaRinconPanelContent isAdmin={false} />
  </ManagerLayout>
);
