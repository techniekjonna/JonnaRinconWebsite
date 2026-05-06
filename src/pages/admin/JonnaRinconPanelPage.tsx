import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import ManagerLayout from '../../components/manager/ManagerLayout';
import { AgendaContent } from './AgendaPage';
import { ProjectsContent } from './ProjectsAdminPage';
import { SocialPlannerContent } from './ContentPage';
import ComingUpTab from '../../components/admin/ComingUpTab';
import TaskBoard from '../../components/admin/TaskBoard';
import { Calendar, FolderKanban, Instagram, Star, ClipboardList, LayoutDashboard } from 'lucide-react';

type PanelSection = 'overview' | 'agenda' | 'projects' | 'tasks' | 'social' | 'coming-up';

interface SectionDef {
  id: PanelSection;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
}

const SECTIONS: SectionDef[] = [
  { id: 'overview', label: 'Overzicht', sublabel: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  { id: 'projects', label: 'Projects', sublabel: 'Manage & track projects', icon: <FolderKanban size={16} /> },
  { id: 'tasks', label: 'Tasks', sublabel: 'Task board', icon: <ClipboardList size={16} /> },
  { id: 'agenda', label: 'Agenda', sublabel: 'Planning & availability', icon: <Calendar size={16} /> },
  { id: 'social', label: 'Social Media', sublabel: 'Content planning', icon: <Instagram size={16} /> },
  { id: 'coming-up', label: 'Coming Up', sublabel: 'Releases & events', icon: <Star size={16} /> },
];

const OverviewContent: React.FC<{ onNavigate: (s: PanelSection) => void }> = ({ onNavigate }) => {
  const cards = SECTIONS.filter((s) => s.id !== 'overview');

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Welkom, Jonna</h2>
        <p className="text-sm text-white/40 mt-1">Kies een onderdeel om mee te starten.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((s) => (
          <button
            key={s.id}
            onClick={() => onNavigate(s.id)}
            className="flex flex-col gap-3 text-left p-5 rounded-2xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.09] hover:border-white/[0.15] transition-all duration-200 group"
          >
            <span className="text-red-400 group-hover:text-red-300 transition-colors">{s.icon}</span>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">{s.label}</p>
              <p className="text-[11px] text-white/30 mt-0.5">{s.sublabel}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export const JonnaRinconPanelContent: React.FC<{ isAdmin?: boolean }> = ({ isAdmin = true }) => {
  const [activeSection, setActiveSection] = useState<PanelSection>('overview');

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewContent onNavigate={setActiveSection} />;
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

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-white">Jonna Rincon Panel</h1>
        <p className="text-xs text-white/30">Persoonlijk overzicht</p>
      </div>

      {/* Horizontal top navigation */}
      <nav className="flex items-center gap-1 border-b border-white/[0.08] mb-6 pb-0 overflow-x-auto">
        {SECTIONS.map((s) => {
          const isActive = activeSection === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 -mb-px ${
                isActive
                  ? 'border-red-500 text-white'
                  : 'border-transparent text-white/40 hover:text-white/70 hover:border-white/20'
              }`}
            >
              <span className={isActive ? 'text-red-400' : 'text-white/30'}>{s.icon}</span>
              {s.label}
            </button>
          );
        })}
      </nav>

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
