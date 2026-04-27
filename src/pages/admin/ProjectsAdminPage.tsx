import React from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import ProjectsPanel from '../../components/projects/ProjectsPanel';

const ProjectsAdminPage: React.FC = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Projecten</h1>
          <p className="text-white/40 mt-1 text-sm">Beheer en volg je muziekproductieprojecten</p>
        </div>
        <ProjectsPanel />
      </div>
    </AdminLayout>
  );
};

export default ProjectsAdminPage;
