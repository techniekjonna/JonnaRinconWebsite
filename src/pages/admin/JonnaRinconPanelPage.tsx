import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import ManagerLayout from '../../components/manager/ManagerLayout';
import { AgendaContent } from './AgendaPage';
import { SocialPlannerContent } from './ContentPage';
import ComingUpTab from '../../components/admin/ComingUpTab';
import { ClientsContent } from './ClientsTab';
import { AnalyticsContent } from './AnalyticsPage';
import { useAuth } from '../../contexts/AuthContext';
import { useT } from '../../contexts/LanguageContext';
import {
  LayoutDashboard, Clock, Users,
  Calendar, Instagram, Star, BarChart3,
} from 'lucide-react';

type MainTab = 'overview' | 'agenda' | 'clients' | 'analytics';
type AgendaSub = 'calendar' | 'social' | 'coming-up';

interface SubSectionDef {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
}

const AGENDA_SECTIONS: SubSectionDef[] = [
  { id: 'calendar',  label: 'Agenda',              sublabel: 'Planning & beschikbaarheid', icon: <Calendar size={16} /> },
  { id: 'social',    label: 'Social Media Planner', sublabel: 'Content planning',           icon: <Instagram size={16} /> },
  { id: 'coming-up', label: 'Coming Up',            sublabel: 'Releases & events',          icon: <Star size={16} /> },
];

function SectionLanding({ sections, onNavigate, title, sublabel }: {
  sections: SubSectionDef[];
  onNavigate: (id: string) => void;
  title: string;
  sublabel: string;
}) {
  return (
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
            <div>
              <p className="text-sm font-semibold text-white leading-tight">{s.label}</p>
              <p className="text-[11px] text-white/30 mt-0.5">{s.sublabel}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function SubNav({ sections, activeId, onSelect }: {
  sections: SubSectionDef[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav className="flex items-center gap-1 border-b border-white/[0.08] pb-0 overflow-x-auto mb-4">
      {sections.map((s) => {
        const isActive = activeId === s.id;
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
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
  );
}

function OverviewContent({ onNavigate, showAnalytics }: { onNavigate: (s: MainTab) => void; showAnalytics: boolean }) {
  const t = useT();
  const groups: { id: MainTab; label: string; sublabel: string; icon: React.ReactNode }[] = [
    { id: 'agenda', label: 'TIME', sublabel: 'Agenda, Social, Coming Up', icon: <Clock size={16} /> },
    { id: 'clients', label: t('Users', 'Users'), sublabel: t('Client deliverable archive', 'Klanten leveringen archief'), icon: <Users size={16} /> },
    ...(showAnalytics ? [{ id: 'analytics' as MainTab, label: 'Analytics', sublabel: 'Dashboard analytics', icon: <BarChart3 size={16} /> }] : []),
  ];
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Welkom, Jonna</h2>
        <p className="text-sm text-white/40 mt-1">Kies een onderdeel om mee te starten.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {groups.map((g) => (
          <button
            key={g.id}
            onClick={() => onNavigate(g.id)}
            className="flex flex-col gap-3 text-left p-5 rounded-2xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.09] hover:border-white/[0.15] transition-all duration-200 group"
          >
            <span className="text-red-400 group-hover:text-red-300 transition-colors">{g.icon}</span>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">{g.label}</p>
              <p className="text-[11px] text-white/30 mt-0.5">{g.sublabel}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function JonnaRinconPanelContent() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [activeMain, setActiveMain]     = useState<MainTab>('overview');
  const [activeAgendaSub, setAgendaSub] = useState<AgendaSub | null>(null);

  const handleMainTab = (tab: MainTab) => {
    setActiveMain(tab);
    if (tab === 'agenda') setAgendaSub(null);
  };

  function renderAgenda() {
    if (!activeAgendaSub) {
      return (
        <SectionLanding
          sections={AGENDA_SECTIONS}
          onNavigate={(id) => setAgendaSub(id as AgendaSub)}
          title="TIME"
          sublabel="Tijdgericht — kies een onderdeel"
        />
      );
    }
    return (
      <>
        <SubNav sections={AGENDA_SECTIONS} activeId={activeAgendaSub} onSelect={(id) => setAgendaSub(id as AgendaSub)} />
        {activeAgendaSub === 'calendar'  && <AgendaContent />}
        {activeAgendaSub === 'social'    && <SocialPlannerContent />}
        {activeAgendaSub === 'coming-up' && <ComingUpTab />}
      </>
    );
  }

  const t = useT();
  const mainTabs: { id: MainTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overzicht', icon: <LayoutDashboard size={15} /> },
    { id: 'agenda',   label: 'TIME',      icon: <Clock size={15} /> },
    { id: 'clients',  label: t('Users', 'Users'), icon: <Users size={15} /> },
    ...(isAdmin ? [{ id: 'analytics' as MainTab, label: 'Analytics', icon: <BarChart3 size={15} /> }] : []),
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-white">Jonna Rincon Panel</h1>
        <p className="text-xs text-white/30">Persoonlijk overzicht</p>
      </div>

      <nav className="flex items-center gap-1 border-b border-white/[0.08] mb-6 pb-0 overflow-x-auto">
        {mainTabs.map((tab) => {
          const isActive = activeMain === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleMainTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 -mb-px ${
                isActive
                  ? 'border-red-500 text-white'
                  : 'border-transparent text-white/40 hover:text-white/70 hover:border-white/20'
              }`}
            >
              <span className={isActive ? 'text-red-400' : 'text-white/30'}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </nav>

      <main className="flex-1 min-w-0">
        {activeMain === 'overview' && <OverviewContent onNavigate={handleMainTab} showAnalytics={isAdmin} />}
        {activeMain === 'agenda'   && renderAgenda()}
        {activeMain === 'clients'  && <ClientsContent />}
        {activeMain === 'analytics' && isAdmin && <AnalyticsContent />}
      </main>
    </div>
  );
}

export default function JonnaRinconPanelPage() {
  return (
    <AdminLayout>
      <JonnaRinconPanelContent />
    </AdminLayout>
  );
}

export function ManagerJonnaRinconPanelPage() {
  return (
    <ManagerLayout>
      <JonnaRinconPanelContent />
    </ManagerLayout>
  );
}
