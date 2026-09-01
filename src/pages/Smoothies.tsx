const Smoothies = () => {
  const smoothies = [
    { name: 'Mango Smoothie', description: 'Creamy mango smoothie blended with fresh mangoes and yogurt.', src: '/images/mango smoothie.jpeg' },
    { name: 'Banana Smoothie', description: 'Rich banana smoothie made with ripe bananas and a hint of honey.', src: '/images/Banana Smoothie.jpeg' },
    { name: 'Tree Tomato Smoothie', description: 'Unique tree tomato smoothie with a tangy twist.', src: '/images/Tree Tomato Smoothie.jpeg' },
  ];

  const mixedSmoothies = [
    { name: 'Tropical Mix', description: 'A blend of mango, pineapple, and passion fruit for the ultimate tropical experience.', src: '/images/Tropical Mix.jpeg' },
    { name: 'Berry Blast', description: 'Mixed berries blended with banana and yogurt for a fruity delight.', src: '/images/Berry Blast.jpeg' },
    { name: 'Green Smoothie', description: 'A healthy blend of spinach, banana, and mango for a nutritious boost.', src: '/images/Green Smoothie.jpeg' },
  ];

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-dark)] mb-4">
          Smoothies
        </h1>
        <p className="text-[var(--text-medium)] max-w-2xl mx-auto text-lg">
          Creamy and refreshing smoothies blended to perfection with fresh fruits and natural ingredients.
        </p>
      </div>

      <section className="mb-12">
        <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-dark)] mb-6">
          Single Fruit Smoothies
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {smoothies.map((smoothie) => (
            <div key={smoothie.name} className="relative flex items-end bg-white rounded-xl overflow-hidden shadow-md border border-[var(--coffee-accent)]/20 card-hover min-h-[260px]">
              <img src={smoothie.src} alt={smoothie.name} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--coffee-dark)]/90 via-[var(--coffee-dark)]/30 to-transparent" />
              <div className="relative p-6 pt-20 w-full text-white">
                <h3 className="text-xl font-bold mb-2">{smoothie.name}</h3>
                <p className="text-white/90">{smoothie.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-dark)] mb-6">
          Mixed Smoothies
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mixedSmoothies.map((smoothie) => (
            <div key={smoothie.name} className="relative flex items-end bg-gradient-to-br from-[var(--coffee-accent)] to-[var(--coffee-light)] rounded-xl overflow-hidden card-hover min-h-[260px] text-white">
              <img src={smoothie.src} alt={smoothie.name} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--coffee-dark)]/90 via-[var(--coffee-dark)]/30 to-transparent" />
              <div className="relative p-6 pt-20 w-full">
                <h3 className="text-xl font-bold mb-2">{smoothie.name}</h3>
                <p className="text-white/90">{smoothie.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Smoothies;
