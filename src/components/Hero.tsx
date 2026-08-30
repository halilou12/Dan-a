import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative bg-gradient-to-br from-[var(--coffee-dark)] via-[var(--coffee-medium)] to-[var(--coffee-light)] text-white overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/images/home-image.jpg)' }}
      />
      <div className="absolute inset-0 bg-[var(--coffee-dark)]/70" />
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(212, 165, 116, 0.3) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(139, 69, 19, 0.3) 0%, transparent 50%)'
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 animate-fade-in">
            THE KIGALI
            <span className="block text-[var(--coffee-accent)]">SPECIALIST BARISTA</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-8 animate-slide-up">
            Professional Coffee Training & Premium Beverages in Kigali, Rwanda
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <Link
              to="/coffee-training"
              className="inline-flex items-center justify-center gap-2 bg-[var(--coffee-accent)] hover:bg-[var(--coffee-light)] text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Start Training
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/services"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/30 hover:border-white/60 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              View Services
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[var(--cream)] to-transparent" />
    </section>
  );
};

export default Hero;
