const Tea = () => {
  const teas = [
    { name: 'Black Tea', description: 'Classic bold black tea, the foundation of traditional African tea culture.', src: '/images/Black Tea.jpeg' },
    { name: 'Green Tea', description: 'Light and refreshing green tea packed with antioxidants and natural goodness.', src: '/images/Green Tea.jpeg' },
    { name: 'African Tea', description: 'Traditional African tea blend, rich and flavorful with a unique character.', src: '/images/African Tea.jpeg' },
    { name: 'Ginger Tea', description: 'Warming ginger tea with a spicy kick, perfect for wellness and comfort.', src: '/images/ginger tea!.jpeg' },
    { name: 'Spice Tea', description: 'Aromatic blend of traditional spices for a uniquely Rwandan tea experience.', src: '/images/Spiced Tea.jpeg' },
  ];

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-dark)] mb-4">
          Tea
        </h1>
        <p className="text-[var(--text-medium)] max-w-2xl mx-auto text-lg">
          Premium African teas and traditional blends, carefully selected for the perfect cup.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teas.map((tea) => (
          <div key={tea.name} className="relative flex items-end bg-white rounded-xl overflow-hidden shadow-md border border-[var(--coffee-accent)]/20 card-hover min-h-[260px]">
            <img src={tea.src} alt={tea.name} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--coffee-dark)]/90 via-[var(--coffee-dark)]/30 to-transparent" />
            <div className="relative p-6 pt-20 w-full text-white">
              <h3 className="text-xl font-bold mb-2">{tea.name}</h3>
              <p className="text-white/90">{tea.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tea;
