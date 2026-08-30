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
          <div key={tea.name} className="bg-white rounded-xl p-6 shadow-md border border-[var(--coffee-accent)]/20 card-hover">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-600 rounded-lg flex items-center justify-center mb-4 text-white text-xl font-bold overflow-hidden">
              <img src={tea.src} alt={tea.name} className="w-full h-full object-cover" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-dark)] mb-2">{tea.name}</h3>
            <p className="text-[var(--text-medium)]">{tea.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tea;
