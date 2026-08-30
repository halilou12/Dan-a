import ServiceCard from '@/components/ServiceCard';
import { Droplets, IceCreamBowl, Milk, Martini, Leaf } from 'lucide-react';

const Beverages = () => {
  const beverageCategories = [
    {
      title: 'Fresh Juices',
      description: 'Freshly squeezed tropical juices made from the finest Rwandan fruits.',
      icon: Droplets,
      image: '/images/Virgin Mojito.jpeg',
      link: '/beverages/juices',
    },
    {
      title: 'Smoothies',
      description: 'Creamy and refreshing smoothies blended to perfection with fresh fruits.',
      icon: IceCreamBowl,
      image: '/images/mango smoothie.jpeg',
      link: '/beverages/smoothies',
    },
    {
      title: 'Milkshakes',
      description: 'Indulgent milkshakes in classic and exotic flavors.',
      icon: Milk,
      image: '/images/Chocolate Milkshake.jpeg',
      link: '/beverages/milkshakes',
    },
    {
      title: 'Mojitos',
      description: 'Refreshing mojitos in tropical flavors.',
      icon: Martini,
      image: '/images/Mango Mojito.jpeg',
      link: '/beverages/mojitos',
    },
    {
      title: 'Tea',
      description: 'Premium African teas and traditional blends.',
      icon: Leaf,
      image: '/images/African Tea.jpeg',
      link: '/beverages/tea',
    },
  ];

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-dark)] mb-4">
          Beverages
        </h1>
        <p className="text-[var(--text-medium)] max-w-2xl mx-auto text-lg">
          Explore our wide selection of handcrafted beverages made with fresh, quality ingredients.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {beverageCategories.map((category) => (
          <ServiceCard key={category.title} {...category} />
        ))}
      </div>
    </div>
  );
};

export default Beverages;
