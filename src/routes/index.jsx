import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PublicRoute } from '@/components/PublicRoute';
import DashboardLayout from '@/layouts/DashboardLayout';
import AdminLayout from '@/layouts/AdminLayout';

const LandingPage          = lazy(() => import('@/pages/LandingPage'));
const LoginPage            = lazy(() => import('@/pages/LoginPage'));
const RegisterPage         = lazy(() => import('@/pages/RegisterPage'));
const ProvisionPage        = lazy(() => import('@/pages/ProvisionPage'));
const ForgotPasswordPage   = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage    = lazy(() => import('@/pages/ResetPasswordPage'));
const DashboardPage        = lazy(() => import('@/pages/DashboardPage'));
const ClassroomsPage       = lazy(() => import('@/pages/ClassroomsPage'));
const SubjectsPage         = lazy(() => import('@/pages/SubjectsPage'));
const CoursesPage          = lazy(() => import('@/pages/CoursesPage'));
const AcademicYearsPage    = lazy(() => import('@/pages/AcademicYearsPage'));
const MembersPage          = lazy(() => import('@/pages/MembersPage'));
const EnrollmentsPage      = lazy(() => import('@/pages/EnrollmentsPage'));
const MyCoursesPage        = lazy(() => import('@/pages/MyCoursesPage'));
const MyChildrenPage       = lazy(() => import('@/pages/MyChildrenPage'));
const TasksPage            = lazy(() => import('@/pages/TasksPage'));
const SchoolPage           = lazy(() => import('@/pages/SchoolPage'));
const ProfilePage          = lazy(() => import('@/pages/ProfilePage'));
const BillingPage          = lazy(() => import('@/pages/BillingPage'));
const BillingSuccessPage   = lazy(() => import('@/pages/BillingSuccessPage'));
const BillingCancelPage    = lazy(() => import('@/pages/BillingCancelPage'));
const AdminDashboardPage   = lazy(() => import('@/pages/AdminDashboardPage'));
const AdminPlansPage       = lazy(() => import('@/pages/AdminPlansPage'));
const AdminSchoolsPage     = lazy(() => import('@/pages/AdminSchoolsPage'));

const PageFallback = () => (
  <div className="flex h-full items-center justify-center py-20 px-6">
    <div className="w-6 h-6 rounded-full border-2 border-p-accent border-t-transparent [animation:spin_0.7s_linear_infinite]" />
  </div>
);

const wrap = (el) => <Suspense fallback={<PageFallback />}>{el}</Suspense>;

export const router = createBrowserRouter([
  { path: '/', element: wrap(<LandingPage />) },

  { path: '/login',            element: <PublicRoute>{wrap(<LoginPage />)}</PublicRoute> },
  { path: '/register',         element: <PublicRoute>{wrap(<RegisterPage />)}</PublicRoute> },
  { path: '/provision',        element: <PublicRoute>{wrap(<ProvisionPage />)}</PublicRoute> },
  { path: '/forgot-password',  element: <PublicRoute>{wrap(<ForgotPasswordPage />)}</PublicRoute> },
  { path: '/reset-password',   element: wrap(<ResetPasswordPage />) },

  { path: '/billing/success', element: wrap(<BillingSuccessPage />) },
  { path: '/billing/cancel',  element: wrap(<BillingCancelPage />) },

  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/dashboard',
        element: <DashboardLayout />,
        children: [
          { index: true,                  element: wrap(<DashboardPage />) },
          // Director only
          { path: 'classrooms',           element: wrap(<ClassroomsPage />) },
          { path: 'subjects',             element: wrap(<SubjectsPage />) },
          { path: 'courses',              element: wrap(<CoursesPage />) },
          { path: 'academic-years',       element: wrap(<AcademicYearsPage />) },
          { path: 'members',              element: wrap(<MembersPage />) },
          { path: 'inscriptions',         element: wrap(<EnrollmentsPage />) },
          // Teacher + Student
          { path: 'mis-cursos',           element: wrap(<MyCoursesPage />) },
          { path: 'tareas/:cursoId',      element: wrap(<TasksPage />) },
          // Parent
          { path: 'mis-hijos',            element: wrap(<MyChildrenPage />) },
          // All roles
          { path: 'school',               element: wrap(<SchoolPage />) },
          { path: 'profile',              element: wrap(<ProfilePage />) },
          { path: 'billing',              element: wrap(<BillingPage />) },
        ],
      },
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          { index: true,          element: wrap(<AdminDashboardPage />) },
          { path: 'plans',        element: wrap(<AdminPlansPage />) },
          { path: 'schools',      element: wrap(<AdminSchoolsPage />) },
        ],
      },
    ],
  },

  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);
