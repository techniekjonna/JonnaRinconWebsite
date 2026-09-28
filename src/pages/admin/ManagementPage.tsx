import React from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { BeatsContent } from './BeatsPage';
import { ServicesContent } from './ServicesPage';
import { TracksContent } from './TracksPage';

type ManagementTab = 'beats' | 'services' | 'tracks';

const TABS: { id: ManagementTab; label: string }[] = [
  { id: 'beats', label: 'Beats' },
  { id: 'services', label: 'Services' },
  { id: 'tracks', label: 'Tracks' },
];

const ManagementPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: ManagementTab = tabParam === 'services' || tabParam === 'tracks' ? tabParam : 'beats';

  const setActiveTab = (tab: ManagementTab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Management</h1>
          <p className="text-white/40 mt-2">Beats, services & tracks in one place</p>
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
        {activeTab === 'services' && <ServicesContent />}
        {activeTab === 'tracks' && <TracksContent />}
      </div>
    </AdminLayout>
  );
};

export default ManagementPage;
