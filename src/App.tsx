import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import Layout from './components/Layout';
import { useAuth } from './lib/auth';
import Home from './pages/Home';
import Services from './pages/Services';
import CoffeeTraining from './pages/CoffeeTraining';
import Beverages from './pages/Beverages';
import Juices from './pages/Juices';
import Smoothies from './pages/Smoothies';
import Milkshakes from './pages/Milkshakes';
import Mojitos from './pages/Mojitos';
import Tea from './pages/Tea';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';
import VerifyCertificate from './pages/verify/VerifyCertificate';
import AdminLogin from './pages/admin/AdminLogin';
import ResetPassword from './pages/admin/ResetPassword';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminGallery from './pages/admin/AdminGallery';
import RegisterStudent from './pages/admin/RegisterStudent';
import StudentDetail from './pages/admin/StudentDetail';

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
          <Route path="services" element={<Services />} />
          <Route path="coffee-training" element={<CoffeeTraining />} />
          <Route path="beverages" element={<Beverages />} />
          <Route path="beverages/juices" element={<Juices />} />
          <Route path="beverages/smoothies" element={<Smoothies />} />
          <Route path="beverages/milkshakes" element={<Milkshakes />} />
          <Route path="beverages/mojitos" element={<Mojitos />} />
          <Route path="beverages/tea" element={<Tea />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="contact" element={<Contact />} />
          <Route path="verify" element={<VerifyCertificate />} />
          <Route path="verify/:token" element={<VerifyCertificate />} />
          <Route path="admin/login" element={<AdminLogin />} />
          <Route path="admin/reset" element={<ResetPassword />} />
          <Route path="admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
          <Route path="admin/gallery" element={<RequireAdmin><AdminGallery /></RequireAdmin>} />
          <Route path="admin/register" element={<RequireAdmin><RegisterStudent /></RequireAdmin>} />
          <Route path="admin/students/:studentId" element={<RequireAdmin><StudentDetail /></RequireAdmin>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
