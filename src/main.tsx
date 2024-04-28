import React from 'react'
import ReactDOM from 'react-dom/client'
import Home from './pages/Home.tsx'
import './index.css'
import './assets/App.css'
// import './assets/paper.min.css'
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import Profile from './pages/Profile.tsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home/>,
  },
  {
    path: '/profile',
    element: <Profile/>
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
