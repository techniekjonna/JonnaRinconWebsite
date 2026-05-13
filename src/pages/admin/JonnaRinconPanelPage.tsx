import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import ManagerLayout from '../../components/manager/ManagerLayout';
import { AgendaContent } from './AgendaPage';
import { SocialPlannerContent } from './ContentPage';
import ComingUpTab from '../../components/admin/ComingUpTab';
import TaskBoard from '../../components/admin/TaskBoard';
import WorkProjectsSection from '../../components/admin/WorkProjectsSection';
import {
  LayoutDashboard, Clock, Briefcase, Columns2,
  Calendar, Instagram, Star, FolderKanban, ClipboardList,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type MainTab = 'overview' | 'board' | 'time' | 'work';
type TimeSubTab = 'agenda' | 'social' | 'coming-up';
type WorkSubTab = 'projects' | 'tasks';

// ─── SubOverview ──────────────────────────────────────────────────────────────

function SubOverview<T extends string>({
  pages,
  onNavigate,
}: {
  pages: { id: T; label: string; sublabel: string; icon: React.ReactNode }[];
  onNavigate: (id: T) => void;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {pages.map((p) => (
        <button
          key={p.id}
          onClick={() => onNavigate(p.id)}
          className="flex flex-col gap-3 text-left p-5 rounded-2xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.09] hover:border-white/[0.15] transition-all duration-200 group"
        >
          <span className="text-red-400 group-hover:text-red-300 transition-colors">{p.icon}</span>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">{p.label}</p>
            <p className="text-[11px] text-white/30 mt-0.5">{p.sublabel}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── Overzicht ────────────────────────────────────────────────────────────────

function OverviewContent({ onNavigate }: { onNavigate: (s: MainTab) => void }) {
  const pages = [
    { id: 'board' as MainTab, label: 'BOARD', sublabel: 'Verzoeken & chat',         icon: <Columns2 size={16} /> },
    { id: 'time'  as MainTab, label: 'TIME',  sublabel: 'Agenda, Social, Coming Up', icon: <Clock size={16} /> },
    { id: 'work'  as MainTab, label: 'WORK',  sublabel: 'Projects & taken',          icon: <Briefcase size={16} /> },
  ];
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Welkom, Jonna</h2>
        <p className="text-sm text-white/40 mt-1">Kies een onderdeel om mee te starten.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {pages.map((p) => (
          <button
            key={p.id}
            onClick={() => onNavigate(p.id)}
            className="flex flex-col gap-3 text-left p-5 rounded-2xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.09] hover:border-white/[0.15] transition-all duration-200 group"
          >
            <span className="text-red-400 group-hover:text-red-300 transition-colors">{p.icon}</span>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">{p.label}</p>
              <p className="text-[11px] text-white/30 mt-0.5">{p.sublabel}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── BOARD placeholder ────────────────────────────────────────────────────────

function BoardContent() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Columns2 size={32} className="text-white/20 mb-4" />
      <p className="text-white/40 text-sm">BOARD komt binnenkort</p>
    </div>
  );
}

// ─── TIME section ─────────────────────────────────────────────────────────────

function TimeSection() {
  const [activeSub, setActiveSub] = useState<TimeSubTab | null>(null);

  const subPages = [
    { id: 'agenda'     as TimeSubTab, label: 'Agenda',               sublabel: 'Planning & beschikbaarheid', icon: <Calendar size={16} /> },
    { id: 'social'     as TimeSubTab, label: 'Social Media Planner',  sublabel: 'Content planning',           icon: <Instagram size={16} /> },
    { id: 'coming-up'  as TimeSubTab, label: 'Coming Up',             sublabel: 'Releases & events',          icon: <Star size={16} /> },
  ];

  if (!activeSub) {
    return <SubOverview pages={subPages} onNavigate={setActiveSub} />;
  }

  return (
    <div className="space-y-4">
      <nav className="flex items-center gap-1 border-b border-white/[0.08] pb-0 overflow-x-auto">
        {subPages.map((p) => {
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
      <div>
        {activeSub === 'agenda'    && <AgendaContent />}
        {activeSub === 'social'    && <SocialPlannerContent />}
        {activeSub === 'coming-up' && <ComingUpTab />}
      </div>
    </div>
  );
}

// ─── WORK section ─────────────────────────────────────────────────────────────

function WorkSection({ isAdmin }: { isAdmin: boolean }) {
  const [activeSub, setActiveSub] = useState<WorkSubTab | null>(null);

  const subPages = [
    { id: 'projects' as WorkSubTab, label: 'Projects', sublabel: 'Muziekproductieprojecten', icon: <FolderKanban size={16} /> },
    { id: 'tasks'    as WorkSubTab, label: 'Tasks',    sublabel: 'Takenbord',                icon: <ClipboardList size={16} /> },
  ];

  if (!activeSub) {
    return <SubOverview pages={subPages} onNavigate={setActiveSub} />;
  }

  return (
    <div className="space-y-4">
      <nav className="flex items-center gap-1 border-b border-white/[0.08] pb-0 overflow-x-auto">
        {subPages.map((p) => {
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
      <div>
        {activeSub === 'projects' && <WorkProjectsSection isAdmin={isAdmin} />}
        {activeSub === 'tasks'    && <TaskBoard />}
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function JonnaRinconPanelContent({ isAdmin = true }: { isAdmin?: boolean }) {
  const [activeMain, setActiveMain] = useState<MainTab>('overview');

  const mainTabs = [
    { id: 'overview' as MainTab, label: 'Overzicht', icon: <LayoutDashboard size={16} /> },
    { id: 'board'    as MainTab, label: 'BOARD',     icon: <Columns2 size={16} /> },
    { id: 'time'     as MainTab, label: 'TIME',      icon: <Clock size={16} /> },
    { id: 'work'     as MainTab, label: 'WORK',      icon: <Briefcase size={16} /> },
  ];

  function renderContent() {
    switch (activeMain) {
      case 'overview': return <OverviewContent onNavigate={setActiveMain} />;
      case 'board':    return <BoardContent />;
      case 'time':     return <TimeSection />;
      case 'work':     return <WorkSection isAdmin={isAdmin} />;
    }
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-white">Jonna Rincon Panel</h1>
        <p className="text-xs text-white/30">Persoonlijk overzicht</p>
      </div>

      <nav className="flex items-center gap-1 border-b border-white/[0.08] mb-6 pb-0 overflow-x-auto">
        {mainTabs.map((t) => {
          const isActive = activeMain === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveMain(t.id)}
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

      <main className="flex-1 min-w-0">{renderContent()}</main>
    </div>
  );
}

export default function JonnaRinconPanelPage() {
  return (
    <AdminLayout>
      <JonnaRinconPanelContent isAdmin={true} />
    </AdminLayout>
  );
}

export function ManagerJonnaRinconPanelPage() {
  return (
    <ManagerLayout>
      <JonnaRinconPanelContent isAdmin={false} />
    </ManagerLayout>
  );
}
