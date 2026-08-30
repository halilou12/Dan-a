const Juices = () => {
  const juices = [
    { name: 'Mango Juice', description: 'Sweet and tropical mango juice freshly squeezed from ripe Rwandan mangoes.', src: '/images/mango smoothie.jpeg' },
    { name: 'Tree Tomato Juice', description: 'Unique and tangy tree tomato (tamarillo) juice packed with vitamins.' , src: '/images/Tree Tomato Smoothie.jpeg'},
    { name: 'Passion Juice', description: 'Refreshing passion fruit juice with its signature tropical aroma.', src: '/images/Virgin Mojito.jpeg' },
    { name: 'Banana Juice', description: 'Creamy and naturally sweet banana juice, a local favorite.', src: '/images/Banana Smoothie.jpeg' },
    { name: 'Watermelon Juice', description: 'Cool and hydrating watermelon juice, perfect for hot days.', src: '/images/Watermelon mojito.jpeg' },
    { name: 'Pineapple Juice', description: 'Sweet and tangy pineapple juice freshly squeezed to order.', src: '/images/Pineapple Mojito.jpeg' },
  ];

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-dark)] mb-4">
          Fresh Juices
        </h1>
        <p className="text-[var(--text-medium)] max-w-2xl mx-auto text-lg">
          Refresh yourself with our selection of freshly squeezed tropical juices made from the finest Rwandan fruits.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {juices.map((juice) => (
          <div key={juice.name} className="bg-white rounded-xl p-6 shadow-md border border-[var(--coffee-accent)]/20 card-hover">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center mb-4 text-white text-xl font-bold overflow-hidden">
              <img src={juice.src} alt={juice.name} className="w-full h-full object-cover" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-dark)] mb-2">{juice.name}</h3>
            <p className="text-[var(--text-medium)]">{juice.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Juices;
