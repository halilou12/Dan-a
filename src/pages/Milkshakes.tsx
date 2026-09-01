const Milkshakes = () => {
  const milkshakes = [
    { name: 'Vanilla Milkshake', description: 'Classic vanilla milkshake made with premium ice cream and real vanilla bean.', src: '/images/Vanilla Milkshake.jpeg' },
    { name: 'Strawberry Milkshake', description: 'Fresh strawberry milkshake blended with ripe strawberries and creamy ice cream.', src: '/images/Strawberry Milkshake.jpeg' },
    { name: 'Chocolate Milkshake', description: 'Rich chocolate milkshake made with premium chocolate and velvety ice cream.', src: '/images/Chocolate Milkshake.jpeg' },
  ];

  const mixedMilkshakes = [
    { name: 'Strawberry-Vanilla Swirl', description: 'A perfect blend of strawberry and vanilla for a creamy, fruity delight.', src: '/images/Strawberry-Vanilla Swirl.jpeg' },
    { name: 'Chocolate-Banana', description: 'Decadent chocolate mixed with sweet banana for a rich, indulgent treat.', src: '/images/Chocolate-Banana.jpeg' },
    { name: 'Tropical Fruit Mix', description: 'A blend of tropical fruits with creamy ice cream for a refreshing milkshake.', src: '/images/Tropical Fruit Mix.jpeg' },
  ];

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-dark)] mb-4">
          Milkshakes
        </h1>
        <p className="text-[var(--text-medium)] max-w-2xl mx-auto text-lg">
          Indulgent milkshakes in classic and exotic flavors, crafted with premium ice cream and fresh ingredients.
        </p>
      </div>

      <section className="mb-12">
        <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-dark)] mb-6">
          Classic Milkshakes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {milkshakes.map((shake) => (
            <div key={shake.name} className="relative flex items-end bg-white rounded-xl overflow-hidden shadow-md border border-[var(--coffee-accent)]/20 card-hover min-h-[260px]">
              <img src={shake.src} alt={shake.name} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--coffee-dark)]/90 via-[var(--coffee-dark)]/30 to-transparent" />
              <div className="relative p-6 pt-20 w-full text-white">
                <h3 className="text-xl font-bold mb-2">{shake.name}</h3>
                <p className="text-white/90">{shake.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-dark)] mb-6">
          Mixed Milkshakes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mixedMilkshakes.map((shake) => (
            <div key={shake.name} className="relative flex items-end bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl overflow-hidden card-hover min-h-[260px] text-white">
              <img src={shake.src} alt={shake.name} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--coffee-dark)]/90 via-[var(--coffee-dark)]/30 to-transparent" />
              <div className="relative p-6 pt-20 w-full">
                <h3 className="text-xl font-bold mb-2">{shake.name}</h3>
                <p className="text-white/90">{shake.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Milkshakes;
