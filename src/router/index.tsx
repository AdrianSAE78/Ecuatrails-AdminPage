import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import RequireAdmin from '../auth/RequireAdmin';
import Login from '../pages/Login/Login';
import Dashboard from '../pages/Dashboard/Dashboard';
import CategoriesPage from '../pages/Categories/CategoriesPage';
import InterestPointsPage from '../pages/InterestPoints/InterestPointsPage';
import LodgingsPage from '../pages/Lodgings/LodgingsPage';
import RoutesPage from '../pages/Routes/RoutesPage';
import TransportPage from '../pages/Transport/TransportPage';

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    path: '/',
    element: <App />,
    children: [
      {
        element: <RequireAdmin />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: 'categories', element: <CategoriesPage /> },
          { path: 'interest-points', element: <InterestPointsPage /> },
          { path: 'lodgings', element: <LodgingsPage /> },
          { path: 'routes', element: <RoutesPage /> },
          { path: 'transport', element: <TransportPage /> },
        ],
      },
    ],
  },
]);