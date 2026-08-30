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
          <div key={mojito.name} className="bg-white rounded-xl p-6 shadow-md border border-[var(--coffee-accent)]/20 card-hover">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-500 rounded-lg flex items-center justify-center mb-4 text-white text-xl font-bold overflow-hidden">
              <img src={mojito.src} alt={mojito.name} className="w-full h-full object-cover" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-dark)] mb-2">{mojito.name}</h3>
            <p className="text-[var(--text-medium)]">{mojito.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Mojitos;
