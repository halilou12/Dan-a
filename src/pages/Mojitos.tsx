const Mojitos = () => {
  const mojitos = [
    { name: 'Virgin Mojito', description: 'Classic non-alcoholic mojito with fresh mint, lime, and soda water.', src: '/images/Virgin Mojito.jpeg' },
    { name: 'Mango Mojito', description: 'Refreshing mojito infused with tropical mango flavors.', src: '/images/Mango Mojito.jpeg' },
    { name: 'Watermelon Mojito', description: 'Cool watermelon mojito perfect for hot Kigali days.', src: '/images/Watermelon mojito.jpeg' },
    { name: 'Passion Mojito', description: 'Tangy passion fruit mojito with a tropical twist.', src: '/images/Passion Mojito.jpeg' },
    { name: 'Tree Tomato Mojito', description: 'Unique tree tomato mojito with a tangy, refreshing flavor.', src: '/images/Tree Tomato Mojito.jpeg' },
    { name: 'Pineapple Mojito', description: 'Sweet and tangy pineapple mojito with fresh mint.', src: '/images/Pineapple Mojito.jpeg' },
  ];

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-dark)] mb-4">
          Mojitos
        </h1>
        <p className="text-[var(--text-medium)] max-w-2xl mx-auto text-lg">
          Refreshing mojitos in tropical flavors, perfect for cooling down in Kigali's warm weather.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mojitos.map((mojito) => (
          <div key={mojito.name} className="relative flex items-end bg-white rounded-xl overflow-hidden shadow-md border border-[var(--coffee-accent)]/20 card-hover min-h-[260px]">
            <img src={mojito.src} alt={mojito.name} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--coffee-dark)]/90 via-[var(--coffee-dark)]/30 to-transparent" />
            <div className="relative p-6 pt-20 w-full text-white">
              <h3 className="text-xl font-bold mb-2">{mojito.name}</h3>
              <p className="text-white/90">{mojito.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Mojitos;
