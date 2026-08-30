import ServiceCard from '@/components/ServiceCard';
import { Coffee, Droplets, IceCreamBowl, Milk, Martini, Leaf } from 'lucide-react';

const Services = () => {
  const services = [
    {
      title: 'Coffee Training',
      description: 'Professional barista training covering everything from basic coffee preparation to advanced latte art and specialty brewing methods.',
      icon: Coffee,
      image: '/images/Latte.jpeg',
      link: '/coffee-training',
    },
    {
      title: 'Fresh Juices',
      description: 'Refresh yourself with our selection of freshly squeezed tropical juices made from the finest Rwandan fruits.',
      icon: Droplets,
      image: '/images/Virgin Mojito.jpeg',
      link: '/beverages/juices',
    },
    {
      title: 'Smoothies',
      description: 'Thick, creamy, and refreshing smoothies blended with fresh fruits and natural ingredients for a healthy treat.',
      icon: IceCreamBowl,
      image: '/images/mango smoothie.jpeg',
      link: '/beverages/smoothies',
    },
    {
      title: 'Milkshakes',
      description: 'Indulgent milkshakes in classic and exotic flavors, made with premium ice cream and real fruit.',
      icon: Milk,
      image: '/images/Chocolate Milkshake.jpeg',
      link: '/beverages/milkshakes',
    },
    {
      title: 'Mojitos',
      description: 'Refreshing mojitos in tropical flavors like mango, watermelon, passion fruit, and more.',
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
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-dark)] mb-4">
          Our Services
        </h1>
        <p className="text-[var(--text-medium)] max-w-2xl mx-auto text-lg">
          Discover our comprehensive range of professional coffee training and handcrafted beverages.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service) => (
          <ServiceCard key={service.title} {...service} />
        ))}
      </div>
    </div>
  );
};

export default Services;
