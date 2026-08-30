import Hero from '@/components/Hero';
import ServiceCard from '@/components/ServiceCard';
import { Coffee, Droplets, IceCreamBowl, Milk, Martini, Leaf } from 'lucide-react';

const Home = () => {
  const services = [
    {
      title: 'Coffee Training',
      description: 'Master the art of coffee with professional barista training including latte art, calibration, and specialty brewing methods.',
      icon: Coffee,
      image: '/images/Latte.jpeg',
      link: '/coffee-training',
    },
    {
      title: 'Fresh Juices',
      description: 'Freshly squeezed juices made from the finest tropical fruits including mango, passion fruit, and tree tomato.',
      icon: Droplets,
      image: '/images/Virgin Mojito.jpeg',
      link: '/beverages/juices',
    },
    {
      title: 'Smoothies',
      description: 'Creamy and refreshing smoothies blended to perfection with fresh fruits and natural ingredients.',
      icon: IceCreamBowl,
      image: '/images/mango smoothie.jpeg',
      link: '/beverages/smoothies',
    },
    {
      title: 'Milkshakes',
      description: 'Indulgent milkshakes in classic and exotic flavors, crafted with premium ice cream and fresh ingredients.',
      icon: Milk,
      image: '/images/Chocolate Milkshake.jpeg',
      link: '/beverages/milkshakes',
    },
    {
      title: 'Mojitos',
      description: 'Refreshing mojitos in various tropical flavors, perfect for cooling down in Kigali\'s warm weather.',
      icon: Martini,
      image: '/images/Mango Mojito.jpeg',
      link: '/beverages/mojitos',
    },
    {
      title: 'Tea',
      description: 'Premium African teas including black, green, ginger, and traditional spice tea blends.',
      icon: Leaf,
      image: '/images/African Tea.jpeg',
      link: '/beverages/tea',
},
  ];

  return (
    <div >
      <Hero />

      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-dark)] mb-4">
            About Us
          </h2>
          <p className="text-[var(--text-medium)] max-w-2xl mx-auto text-lg">
            The Kigali Specialist Barista is Rwanda's premier coffee training academy and beverage destination.
            We offer professional barista training and serve the finest coffees, juices, smoothies,
            and handcrafted beverages in Kigali.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-dark)] mb-4">
              Our Services
            </h2>
            <p className="text-[var(--text-medium)] max-w-2xl mx-auto">
              From professional coffee training to handcrafted beverages, we offer a complete experience for coffee lovers and aspiring baristas.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <ServiceCard key={service.title} {...service} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-[var(--coffee-dark)] to-[var(--coffee-medium)] rounded-2xl p-8 md:p-12 text-white text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Become a Certified Barista?
          </h2>
          <p className="text-gray-200 mb-8 max-w-2xl mx-auto">
            Join our professional training programs and master the art of coffee making.
            From beginner to advanced, we have courses for every level.
          </p>
          <a
            href="/coffee-training"
            className="inline-flex items-center justify-center bg-[var(--coffee-accent)] hover:bg-[var(--coffee-light)] text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Explore Training Programs
          </a>
        </div>
      </section>
    </div>
  );
};

export default Home;
