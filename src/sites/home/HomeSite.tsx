import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import SiteNav from './SiteNav';

// Layout for the personal site: /, /projects, /blog and the 404 page.
export default function HomeSite() {
  useEffect(() => {
    document.title = 'Scott.Kim';
  }, []);

  return (
    <>
      <SiteNav />
      <Outlet />
    </>
  );
}
