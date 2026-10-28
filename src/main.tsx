import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

// scott.kim is three sections that each bring their own global CSS:
//   /         personal homepage (+ /projects, /blog)
//   /cougher  the cougher app
//   /chess    play against the Patricia engine
// Each section is a lazy chunk, and the sections link to each other with
// plain <a href> (full page load), so their stylesheets never mix.
const router = createBrowserRouter([
  {
    path: '/cougher',
    lazy: async () => ({ Component: (await import('./sites/cougher/CougherApp.tsx')).default }),
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import('./sites/cougher/pages/Home.tsx')).default }),
      },
      {
        path: 'profile',
        lazy: async () => ({ Component: (await import('./sites/cougher/pages/Profile.tsx')).default }),
      },
    ],
  },
  {
    path: '/chess',
    lazy: async () => ({ Component: (await import('./sites/chess/ChessPage.tsx')).default }),
  },
  {
    path: '/',
    lazy: async () => ({ Component: (await import('./sites/home/HomeSite.tsx')).default }),
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import('./sites/home/Home.tsx')).default }),
      },
      {
        path: 'projects',
        lazy: async () => ({ Component: (await import('./sites/home/Projects.tsx')).default }),
      },
      {
        path: 'blog',
        lazy: async () => ({ Component: (await import('./sites/home/Blog.tsx')).default }),
      },
      {
        path: '*',
        lazy: async () => ({ Component: (await import('./sites/home/PageNotFound.tsx')).default }),
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
