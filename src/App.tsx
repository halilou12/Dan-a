import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { useAuth } from './lib/auth';
import Home from './pages/Home';

// Most routes are code-split so first-time visitors don't download admin,
// certificate/QR, and beverage code they never see.
const Services = lazy(() => import('./pages/Services'));
const CoffeeTraining = lazy(() => import('./pages/CoffeeTraining'));
const Beverages = lazy(() => import('./pages/Beverages'));
const Juices = lazy(() => import('./pages/Juices'));
const Smoothies = lazy(() => import('./pages/Smoothies'));
const Milkshakes = lazy(() => import('./pages/Milkshakes'));
const Mojitos = lazy(() => import('./pages/Mojitos'));
const Tea = lazy(() => import('./pages/Tea'));
const Gallery = lazy(() => import('./pages/Gallery'));
const Contact = lazy(() => import('./pages/Contact'));
const VerifyCertificate = lazy(() => import('./pages/verify/VerifyCertificate'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const SetupAdmin = lazy(() => import('./pages/admin/SetupAdmin'));
const ResetPassword = lazy(() => import('./pages/admin/ResetPassword'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminGallery = lazy(() => import('./pages/admin/AdminGallery'));
const RegisterStudent = lazy(() => import('./pages/admin/RegisterStudent'));
const StudentDetail = lazy(() => import('./pages/admin/StudentDetail'));
const DailyMarks = lazy(() => import('./pages/admin/DailyMarks'));

import type { ReactElement } from 'react';

const lazyPage = (Comp: React.LazyExoticComponent<() => ReactElement>) => {
  return () => (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--coffee-accent)]" />
        </div>
      }
    >
      <Comp />
    </Suspense>
  );
};

const RequireAdmin = ({ children }: { children: ReactNode }) => {
  const authed = useAuth();
  if (!authed) return <Navigate to="/admin/login" replace />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="services" element={lazyPage(Services)()} />
          <Route path="coffee-training" element={lazyPage(CoffeeTraining)()} />
          <Route path="beverages" element={lazyPage(Beverages)()} />
          <Route path="beverages/juices" element={lazyPage(Juices)()} />
          <Route path="beverages/smoothies" element={lazyPage(Smoothies)()} />
          <Route path="beverages/milkshakes" element={lazyPage(Milkshakes)()} />
          <Route path="beverages/mojitos" element={lazyPage(Mojitos)()} />
          <Route path="beverages/tea" element={lazyPage(Tea)()} />
          <Route path="gallery" element={lazyPage(Gallery)()} />
          <Route path="contact" element={lazyPage(Contact)()} />
          <Route path="verify" element={lazyPage(VerifyCertificate)()} />
          <Route path="verify/:token" element={lazyPage(VerifyCertificate)()} />
          <Route path="admin/login" element={lazyPage(AdminLogin)()} />
          <Route path="admin/setup" element={lazyPage(SetupAdmin)()} />
          <Route path="admin/reset" element={lazyPage(ResetPassword)()} />
          <Route path="admin" element={<RequireAdmin>{lazyPage(AdminDashboard)()}</RequireAdmin>} />
          <Route path="admin/gallery" element={<RequireAdmin>{lazyPage(AdminGallery)()}</RequireAdmin>} />
          <Route path="admin/register" element={<RequireAdmin>{lazyPage(RegisterStudent)()}</RequireAdmin>} />
          <Route path="admin/daily-marks" element={<RequireAdmin>{lazyPage(DailyMarks)()}</RequireAdmin>} />
          <Route path="admin/students/:studentId" element={<RequireAdmin>{lazyPage(StudentDetail)()}</RequireAdmin>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;