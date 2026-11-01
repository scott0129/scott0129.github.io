import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import './index.css';
import './App.css';

// Layout for everything under /cougher. Its global styles (body, :root, #root)
// only load with this chunk, so they never leak into the other sections.
export default function CougherApp() {
  useEffect(() => {
    document.title = 'Cougher';
    const icon = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (icon) {
      icon.type = 'image/svg+xml';
      icon.href = '/face-exhaling.svg';
    }
  }, []);

  return <Outlet />;
}
