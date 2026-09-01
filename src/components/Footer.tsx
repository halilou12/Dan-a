import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ChevronUp } from 'lucide-react';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer>
      <div onClick={scrollToTop} className="bg-[var(--coffee-light)] hover:bg-[var(--coffee-medium)] text-white text-center py-3 text-sm font-medium cursor-pointer transition-colors">
        <ChevronUp className="h-4 w-4 inline mr-1" />
        Back to top
      </div>

      <div className="bg-[var(--coffee-dark)] text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h4 className="font-bold text-base mb-4">About Us</h4>
              <ul className="space-y-2.5">
                <li><Link to="/" className="text-sm text-gray-300 hover:text-white hover:underline transition-colors">Our Story</Link></li>
                <li><Link to="/services" className="text-sm text-gray-300 hover:text-white hover:underline transition-colors">Services</Link></li>
                <li><Link to="/gallery" className="text-sm text-gray-300 hover:text-white hover:underline transition-colors">Gallery</Link></li>
                <li><Link to="/verify" className="text-sm text-gray-300 hover:text-white hover:underline transition-colors">Verify Certificate</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-base mb-4">Training</h4>
              <ul className="space-y-2.5">
                <li><Link to="/coffee-training" className="text-sm text-gray-300 hover:text-white hover:underline transition-colors">Coffee Training</Link></li>
                <li><Link to="/beverages" className="text-sm text-gray-300 hover:text-white hover:underline transition-colors">Beverages</Link></li>
                <li><Link to="/beverages/juices" className="text-sm text-gray-300 hover:text-white hover:underline transition-colors">Fresh Juices</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-base mb-4">Quick Links</h4>
              <ul className="space-y-2.5">
                <li><Link to="/beverages/smoothies" className="text-sm text-gray-300 hover:text-white hover:underline transition-colors">Smoothies</Link></li>
                <li><Link to="/beverages/milkshakes" className="text-sm text-gray-300 hover:text-white hover:underline transition-colors">Milkshakes</Link></li>
                <li><Link to="/beverages/mojitos" className="text-sm text-gray-300 hover:text-white hover:underline transition-colors">Mojitos</Link></li>
                <li><Link to="/beverages/tea" className="text-sm text-gray-300 hover:text-white hover:underline transition-colors">Tea</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-base mb-4">Contact Us</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-[var(--coffee-accent)] shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-300">KN 197 St,Kigali, Rwanda 250</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[var(--coffee-accent)] shrink-0" />
                  <span className="text-sm text-gray-300">+250 789698317</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[var(--coffee-accent)] shrink-0" />
                  <span className="text-sm text-gray-300">kigalispecialistbarista@gmail.com</span>
                </li>
              </ul>
              <div className="flex gap-4 mt-4">
                <a
                  href="https://www.tiktok.com/@kigali_specialist1?_r=1&_t=ZS-99MvMTDzBm0"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="TikTok"
                  aria-label="TikTok"
                  className="text-gray-400 hover:text-[var(--coffee-accent)] transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com/kigali_specialist_barista?igsi=MWw2YWNnbmE0dG9uag=="
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Instagram"
                  aria-label="Instagram"
                  className="text-gray-400 hover:text-[var(--coffee-accent)] transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
                <a
                  href="https://www.facebook.com/profile.php?id=100085963508088"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Facebook"
                  aria-label="Facebook"
                  className="text-gray-400 hover:text-[var(--coffee-accent)] transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--coffee-light)]">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link to="/" className="flex items-center gap-2">
                <img
                  src="/images/KBS.jpeg"
                  alt="The Kigali Specialist Barista logo"
                  className="h-8 w-8 rounded-[40px] object-cover"
                />
                <span className="text-white font-bold text-sm">THE KIGALI SPECIALIST BARISTA</span>
              </Link>
              <div className="flex items-center gap-6 text-xs text-gray-400">
                <span>&copy; {new Date().getFullYear()} The Kigali Specialist Barista. All rights reserved.</span>
                <span className="hidden sm:inline">Built with passion for Rwandan coffee</span>
              </div>
              <Link
                to="/admin/login"
                className="text-xs text-gray-500 hover:text-[var(--coffee-accent)] transition-colors"
              >
                Staff Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
