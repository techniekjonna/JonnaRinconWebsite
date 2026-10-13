import React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { useT } from '../../contexts/LanguageContext';
import { BeatsContent } from './BeatsPage';
import { TracksContent } from './TracksPage';
import { ClientsContent } from './ClientsTab';

type ManagementTab = 'beats' | 'tracks' | 'mixmasters';

const TABS: { id: ManagementTab; label: string }[] = [
  { id: 'beats', label: 'Beats' },
  { id: 'tracks', label: 'Tracks' },
  { id: 'mixmasters', label: 'Mix Masters' },
];

const ManagementPage: React.FC = () => {
  const t = useT();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: ManagementTab =
    tabParam === 'tracks' || tabParam === 'mixmasters' ? tabParam : 'beats';

  const setActiveTab = (tab: ManagementTab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    });
  };

  // Services moved to their own page next to Management
  if (tabParam === 'services') return <Navigate to="/admin/services" replace />;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Management</h1>
          <p className="text-white/40 mt-2">{t('Beats, tracks & mix masters in one place', 'Beats, tracks en mix masters op één plek')}</p>
        </div>

        {/* Top-level tab navigation */}
        <div className="flex gap-1 border-b border-white/[0.1] overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-semibold text-sm transition-all relative group whitespace-nowrap ${
                  isActive ? 'text-white' : 'text-white/40 hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-600 to-pink-600" />
                )}
              </button>
            );
          })}
        </div>

        {activeTab === 'beats' && <BeatsContent />}
        {activeTab === 'tracks' && <TracksContent />}
        {activeTab === 'mixmasters' && <ClientsContent filterType="mix-master" />}
      </div>
    </AdminLayout>
  );
};

export default ManagementPage;
