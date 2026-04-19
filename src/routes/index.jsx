import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PublicRoute } from '@/components/PublicRoute';
import DashboardLayout from '@/layouts/DashboardLayout';

const LoginPage        = lazy(() => import('@/pages/LoginPage'));
const RegisterPage     = lazy(() => import('@/pages/RegisterPage'));
const ProvisionPage    = lazy(() => import('@/pages/ProvisionPage'));
const DashboardPage    = lazy(() => import('@/pages/DashboardPage'));
const ClassroomsPage   = lazy(() => import('@/pages/ClassroomsPage'));
const SubjectsPage     = lazy(() => import('@/pages/SubjectsPage'));
const CoursesPage      = lazy(() => import('@/pages/CoursesPage'));
const AcademicYearsPage = lazy(() => import('@/pages/AcademicYearsPage'));
const SchoolPage       = lazy(() => import('@/pages/SchoolPage'));
const ProfilePage      = lazy(() => import('@/pages/ProfilePage'));
const MembersPage      = lazy(() => import('@/pages/MembersPage'));

const PageFallback = () => (
  <div className="flex h-full items-center justify-center py-20">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

const wrap = (element) => <Suspense fallback={<PageFallback />}>{element}</Suspense>;

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },

  { path: '/login',     element: <PublicRoute>{wrap(<LoginPage />)}</PublicRoute> },
  { path: '/register',  element: <PublicRoute>{wrap(<RegisterPage />)}</PublicRoute> },
  { path: '/provision', element: <PublicRoute>{wrap(<ProvisionPage />)}</PublicRoute> },

  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/dashboard',
        element: <DashboardLayout />,
        children: [
          { index: true,              element: wrap(<DashboardPage />) },
          { path: 'classrooms',       element: wrap(<ClassroomsPage />) },
          { path: 'subjects',         element: wrap(<SubjectsPage />) },
          { path: 'courses',          element: wrap(<CoursesPage />) },
          { path: 'academic-years',   element: wrap(<AcademicYearsPage />) },
          { path: 'members',          element: wrap(<MembersPage />) },
          { path: 'school',           element: wrap(<SchoolPage />) },
          { path: 'profile',          element: wrap(<ProfilePage />) },
        ],
      },
    ],
  },

  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);
