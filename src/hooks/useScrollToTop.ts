import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook to scroll to top when route changes
 */
export const useScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top of page
    window.scrollTo(0, 0);
    // Also try to scroll html element (in case window doesn't work)
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Use setTimeout as fallback for browsers that need delayed scroll
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
  }, [pathname]);
};
