import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ChevronUp, Globe, MessageCircle, Heart } from 'lucide-react';

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
              <div className="flex gap-3 mt-4">
                <a href="#" className="text-gray-400 hover:text-[var(--coffee-accent)] transition-colors">
                  <Globe className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-[var(--coffee-accent)] transition-colors">
                  <MessageCircle className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-[var(--coffee-accent)] transition-colors">
                  <Heart className="h-5 w-5" />
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
