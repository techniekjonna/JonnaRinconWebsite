import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import ManagerLayout from '../../components/manager/ManagerLayout';
import { AgendaContent } from './AgendaPage';
import { SocialPlannerContent } from './ContentPage';
import ComingUpTab from '../../components/admin/ComingUpTab';
import TaskBoard from '../../components/admin/TaskBoard';
import WorkProjectsSection from '../../components/admin/WorkProjectsSection';
import {
  LayoutDashboard, Clock, Briefcase,
  Calendar, Instagram, Star, FolderKanban, ClipboardList, Columns2,
} from 'lucide-react';

type MainTab = 'overview' | 'agenda' | 'work';
type AgendaSub = 'calendar' | 'social' | 'coming-up';
type WorkSub = 'projects' | 'tasks';

interface SubSectionDef {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
}

const AGENDA_SECTIONS: SubSectionDef[] = [
  { id: 'calendar', label: 'Agenda', sublabel: 'Planning & beschikbaarheid', icon: <Calendar size={16} /> },
  { id: 'social', label: 'Social Media Planner', sublabel: 'Content planning', icon: <Instagram size={16} /> },
  { id: 'coming-up', label: 'Coming Up', sublabel: 'Releases & events', icon: <Star size={16} /> },
];

const MAIN_PAGES = [
  { id: 'board' as MainTab, label: 'BOARD', sublabel: 'Verzoeken & chat',         icon: <Columns2 size={16} /> },
  { id: 'time'  as MainTab, label: 'TIME',  sublabel: 'Agenda, Social, Coming Up', icon: <Clock size={16} /> },
  { id: 'work'  as MainTab, label: 'WORK',  sublabel: 'Projects & taken',          icon: <Briefcase size={16} /> },
];

const SectionLanding: React.FC<{
  sections: SubSectionDef[];
  onNavigate: (id: string) => void;
  title: string;
  sublabel: string;
}> = ({ sections, onNavigate, title, sublabel }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <p className="text-sm text-white/40 mt-1">{sublabel}</p>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {sections.map((s) => (
        <button
          key={s.id}
          onClick={() => onNavigate(s.id)}
          className="flex flex-col gap-3 text-left p-5 rounded-2xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.09] hover:border-white/[0.15] transition-all duration-200 group"
        >
          <span className="text-red-400 group-hover:text-red-300 transition-colors">{s.icon}</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white leading-tight">{s.label}</p>
            <p className="text-[11px] text-white/30 mt-0.5">{s.sublabel}</p>
          </div>
          <ChevronRight size={14} className="text-white/20 group-hover:text-white/40 self-end transition-colors" />
        </button>
      ))}
    </div>
  </div>
);

// ─── BOARD placeholder ────────────────────────────────────────────────────────

const BoardContent: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <Columns2 size={32} className="text-white/20 mb-4" />
    <p className="text-white/40 text-sm">BOARD komt binnenkort</p>
  </div>
);

// ─── TIME section ─────────────────────────────────────────────────────────────

const TimeSection: React.FC = () => {
  const [activeSub, setActiveSub] = useState<TimeSubTab | null>(null);

  if (!activeSub) {
    return (
      <div className="space-y-6">
        <SubOverview pages={TIME_SUB_PAGES} onNavigate={setActiveSub} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sub-tab nav */}
      <nav className="flex items-center gap-1 border-b border-white/[0.08] pb-0 overflow-x-auto">
        {TIME_SUB_PAGES.map((p) => {
          const isActive = activeSub === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setActiveSub(p.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 -mb-px ${
                isActive
                  ? 'border-red-500 text-white'
                  : 'border-transparent text-white/40 hover:text-white/70 hover:border-white/20'
              }`}
            >
              <span className={isActive ? 'text-red-400' : 'text-white/30'}>{p.icon}</span>
              {p.label}
            </button>
          );
        })}
      </nav>

      {/* Content */}
      <div>
        {activeSub === 'agenda'     && <AgendaContent />}
        {activeSub === 'social'     && <SocialPlannerContent />}
        {activeSub === 'coming-up'  && <ComingUpTab />}
      </div>
      {groups.map((group) => (
        <div key={group.id} className="space-y-3">
          <button
            onClick={() => onNavigate(group.id)}
            className="flex items-center gap-2 group"
          >
            <span className="text-red-400">{group.icon}</span>
            <span className="text-base font-bold text-white group-hover:text-red-300 transition-colors">{group.label}</span>
            <span className="text-xs text-white/30">— {group.sublabel}</span>
            <ChevronRight size={14} className="text-white/20 group-hover:text-white/40 transition-colors" />
          </button>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {group.sections.map((s) => (
              <button
                key={s.id}
                onClick={() => onNavigate(group.id)}
                className="flex items-center gap-3 text-left p-4 rounded-2xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.12] transition-all duration-200 group"
              >
                <span className="text-white/40 group-hover:text-red-400 transition-colors flex-shrink-0">{s.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white/80 leading-tight truncate">{s.label}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Main Panel ───────────────────────────────────────────────────────────────

const MAIN_TABS = [
  { id: 'overview' as MainTab, label: 'Overzicht', icon: <LayoutDashboard size={16} /> },
  { id: 'board'    as MainTab, label: 'BOARD',     icon: <Columns2 size={16} /> },
  { id: 'time'     as MainTab, label: 'TIME',      icon: <Clock size={16} /> },
  { id: 'work'     as MainTab, label: 'WORK',      icon: <Briefcase size={16} /> },
];

export const JonnaRinconPanelContent: React.FC<{ isAdmin?: boolean }> = ({ isAdmin = true }) => {
  const [activeMain, setActiveMain] = useState<MainTab>('overview');
  const [activeAgendaSub, setActiveAgendaSub] = useState<AgendaSub | null>(null);
  const [activeWorkSub, setActiveWorkSub] = useState<WorkSub | null>(null);

  const handleMainTabClick = (tab: MainTab) => {
    setActiveMain(tab);
    if (tab === 'agenda') setActiveAgendaSub(null);
    if (tab === 'work') setActiveWorkSub(null);
  };

  const handleNavigateToMain = (main: MainTab) => {
    setActiveMain(main);
    if (main === 'agenda') setActiveAgendaSub(null);
    if (main === 'work') setActiveWorkSub(null);
  };

  const renderAgendaContent = () => {
    if (!activeAgendaSub) {
      return (
        <SectionLanding
          sections={AGENDA_SECTIONS}
          onNavigate={(id) => setActiveAgendaSub(id as AgendaSub)}
          title="Agenda"
          sublabel="Tijdgericht — kies een onderdeel"
        />
      );
    }
    return (
      <div className="space-y-4">
        {/* Sub-nav */}
        <nav className="flex items-center gap-1 border-b border-white/[0.08] pb-0 overflow-x-auto">
          {AGENDA_SECTIONS.map((s) => {
            const isActive = activeAgendaSub === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveAgendaSub(s.id as AgendaSub)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all duration-200 -mb-px ${
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
        <div>
          {activeAgendaSub === 'calendar' && <AgendaContent />}
          {activeAgendaSub === 'social' && <SocialPlannerContent />}
          {activeAgendaSub === 'coming-up' && <ComingUpTab />}
        </div>
      </div>
    );
  };

  const renderWorkContent = () => {
    if (!activeWorkSub) {
      return (
        <SectionLanding
          sections={WORK_SECTIONS}
          onNavigate={(id) => setActiveWorkSub(id as WorkSub)}
          title="Work"
          sublabel="Werkgericht — kies een onderdeel"
        />
      );
    }
    return (
      <div className="space-y-4">
        {/* Sub-nav */}
        <nav className="flex items-center gap-1 border-b border-white/[0.08] pb-0 overflow-x-auto">
          {WORK_SECTIONS.map((s) => {
            const isActive = activeWorkSub === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveWorkSub(s.id as WorkSub)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all duration-200 -mb-px ${
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
        <div>
          {activeWorkSub === 'projects' && <ProjectsContent isAdmin={isAdmin} />}
          {activeWorkSub === 'tasks' && <TaskBoard />}
        </div>
      </div>
    );
  };

  const mainTabs: { id: MainTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overzicht', icon: <LayoutDashboard size={15} /> },
    { id: 'agenda', label: 'Agenda', icon: <Clock size={15} /> },
    { id: 'work', label: 'Work', icon: <Briefcase size={15} /> },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-white">Jonna Rincon Panel</h1>
        <p className="text-xs text-white/30">Persoonlijk overzicht</p>
      </div>

      {/* Main tab navigation */}
      <nav className="flex items-center gap-1 border-b border-white/[0.08] mb-6 pb-0 overflow-x-auto">
        {mainTabs.map((t) => {
          const isActive = activeMain === t.id;
          return (
            <button
              key={t.id}
              onClick={() => handleMainTabClick(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 -mb-px ${
                isActive
                  ? 'border-red-500 text-white'
                  : 'border-transparent text-white/40 hover:text-white/70 hover:border-white/20'
              }`}
            >
              <span className={isActive ? 'text-red-400' : 'text-white/30'}>{t.icon}</span>
              {t.label}
            </button>
          );
        })}
      </nav>

      {/* Content */}
      <main className="flex-1 min-w-0">
        {activeMain === 'overview' && <OverviewContent onNavigate={handleNavigateToMain} />}
        {activeMain === 'agenda' && renderAgendaContent()}
        {activeMain === 'work' && renderWorkContent()}
      </main>
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
