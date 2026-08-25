import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/protected-route';
import { AuthProvider } from './context/auth-context';
import { AuthLayout } from './layouts/auth-layout';
import { DashboardLayout } from './layouts/dashboard-layout';
import { DashboardPage } from './pages/dashboard-page';
import { IssuesPage } from './pages/issues-page';
import { FeedbackPage } from './pages/feedback-page';
import { DiscoverPage } from './pages/discover-page';
import { NotificationsPage } from './pages/notifications-page';
import { MapPage } from './pages/map-page';
import { AdminPage } from './pages/admin-page';
import { SearchPage } from './pages/search-page';
import { ForgotPasswordPage } from './pages/forgot-password-page';
import { LandingPage } from './pages/landing-page';
import { LoginPage } from './pages/login-page';
import { RegisterPage } from './pages/register-page';
import { ResetPasswordPage } from './pages/reset-password-page';
import { VerifyEmailPage } from './pages/verify-email-page';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });

export function App() {
  return <QueryClientProvider client={queryClient}><BrowserRouter><AuthProvider><Routes><Route path="/" element={<LandingPage />} /><Route element={<AuthLayout />}><Route path="/login" element={<LoginPage />} /><Route path="/register" element={<RegisterPage />} /><Route path="/verify-email" element={<VerifyEmailPage />} /><Route path="/forgot-password" element={<ForgotPasswordPage />} /><Route path="/reset-password" element={<ResetPasswordPage />} /></Route><Route element={<ProtectedRoute />}><Route path="/dashboard" element={<DashboardLayout><DashboardPage /></DashboardLayout>} /><Route path="/issues" element={<DashboardLayout><IssuesPage /></DashboardLayout>} /><Route path="/feedback" element={<DashboardLayout><FeedbackPage /></DashboardLayout>} /><Route path="/discover" element={<DashboardLayout><DiscoverPage /></DashboardLayout>} /><Route path="/notifications" element={<DashboardLayout><NotificationsPage /></DashboardLayout>} /><Route path="/map" element={<DashboardLayout><MapPage /></DashboardLayout>} /><Route path="/admin" element={<DashboardLayout><AdminPage /></DashboardLayout>} /><Route path="/search" element={<DashboardLayout><SearchPage /></DashboardLayout>} /></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes></AuthProvider></BrowserRouter></QueryClientProvider>;
}
