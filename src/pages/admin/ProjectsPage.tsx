import React from 'react';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import ProjectsPanel from '../../components/projects/ProjectsPanel';
import { useScrollToTop } from '../../hooks/useScrollToTop';

const ProjectsPage: React.FC = () => {
  useScrollToTop();

  return (
    <div className="min-h-screen text-white">
      {/* Fixed Dark Overlay */}
      <div className="fixed inset-0 w-full h-screen -z-10 bg-black/20" />

      <Navigation isDarkOverlay={true} isLightMode={false} />

      {/* Hero Section */}
      <section className="relative pt-40 px-6 md:px-12 pb-4">
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <h1 style={{ fontSize: 'clamp(1.875rem, 8vw, 10.2rem)' }} className="font-black uppercase leading-[0.85] tracking-tighter mb-8 text-center">
            Projects
          </h1>
          <p className="text-white/30 text-sm md:text-base text-center max-w-2xl mx-auto">
            Manage and track your music production projects with real-time collaboration and task management.
          </p>
        </div>
      </section>

      {/* Projects Section */}
      <section className="px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto">
          <ProjectsPanel />
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ProjectsPage;
