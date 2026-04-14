import { createBrowserRouter, Navigate } from 'react-router';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PublicRoute } from '@/components/PublicRoute';
import DashboardLayout from '@/layouts/DashboardLayout';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ProvisionPage from '@/pages/ProvisionPage';
import DashboardPage from '@/pages/DashboardPage';
import ClassroomsPage from '@/pages/ClassroomsPage';
import SubjectsPage from '@/pages/SubjectsPage';
import CoursesPage from '@/pages/CoursesPage';
import AcademicYearsPage from '@/pages/AcademicYearsPage';
import SchoolPage from '@/pages/SchoolPage';
import ProfilePage from '@/pages/ProfilePage';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },

  {
    path: '/login',
    element: <PublicRoute><LoginPage /></PublicRoute>,
  },
  {
    path: '/register',
    element: <PublicRoute><RegisterPage /></PublicRoute>,
  },
  {
    path: '/provision',
    element: <PublicRoute><ProvisionPage /></PublicRoute>,
  },

  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/dashboard',
        element: <DashboardLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'classrooms', element: <ClassroomsPage /> },
          { path: 'subjects', element: <SubjectsPage /> },
          { path: 'courses', element: <CoursesPage /> },
          { path: 'academic-years', element: <AcademicYearsPage /> },
          { path: 'school', element: <SchoolPage /> },
          { path: 'profile', element: <ProfilePage /> },
        ],
      },
    ],
  },

  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);