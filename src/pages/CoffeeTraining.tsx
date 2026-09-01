const IMG = [
  '/images/Latte.jpeg',
  '/images/Milk Steaming.jpeg',
  '/images/V60.jpeg',
  '/images/Chemex.jpeg',
];

const CoffeeTraining = () => {
  const introCourses = [
    {
      title: 'Calibration',
      description: 'Learn to calibrate your palate and equipment for the perfect cup. Understand extraction, grind size, and water temperature.',
      image: IMG[0],
      video: '/images/video_f82071264af9.mp4',
    },
    {
      title: 'Latte Art',
      description: 'Master the beautiful art of latte design. From hearts to rosettas, learn pouring techniques that impress.',
      image: '/images/Latte.jpeg',
    },
    {
      title: 'Milk Steaming',
      description: 'Perfect the texture and temperature of steamed milk for lattes, cappuccinos, and other espresso-based drinks.',
      image: '/images/Milk Steaming.jpeg',
    },
  ];

  const curriculum = [
    'Introduction to Coffee',
    'Coffee Processing',
    'Grinder Basics',
    'Water Quality',
    'Espresso',
    'Milk Science & Milk Steaming',
    'Latte Art Basics',
    'Mastery of Brewing Methods',
    'Coffee M.D',
    'Tea M.D',
    'Coffee Management',
    'Customer Service & Workflow',
    'Barista Interview Preferences & Tips',
    'Juice M.D',
  ];

  const specialtyMethods = [
    {
      name: 'V60',
      description: 'Master the Hario V60 pour-over method for a clean, bright cup that highlights the unique flavors of single-origin beans.',
      image: '/images/V60.jpeg',
    },
    {
      name: 'Chemex',
      description: 'Learn the Chemex brewing technique for a smooth, sediment-free cup with exceptional clarity of flavor.',
      image: '/images/Chemex.jpeg',
    },
    {
      name: 'Syphon',
      description: 'Explore the theatrical Syphon (vacuum) brewing method for a rich, full-bodied coffee experience.',
      image: '/images/Syphon.jpeg',
    },
    {
      name: 'French Press',
      description: 'Master the French Press for a bold, full-bodied coffee with rich oils and deep flavor.',
      image: '/images/French Press.jpeg',
    },
  ];

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-dark)] mb-4">
          Coffee Training
        </h1>
        <p className="text-[var(--text-medium)] max-w-2xl mx-auto text-lg">
          Professional barista training to help you master the art and science of coffee making.
        </p>
      </div>

      <section className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-[var(--coffee-accent)] rounded-lg flex items-center justify-center overflow-hidden">
            <img src="/images/introduction to coffee.jpeg" alt="Introduction to Coffee" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-dark)]">
              Introduction to Coffee
            </h2>
            <p className="text-[var(--text-light)]">Foundation skills for aspiring baristas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {introCourses.map((course) => (
            <div key={course.title} className={`relative flex items-end bg-white rounded-xl overflow-hidden shadow-md border border-[var(--coffee-accent)]/20 card-hover min-h-[280px] ${course.video ? 'md:col-span-2' : ''}`}>
              {course.video ? (
                <video
                  className="absolute inset-0 w-full h-full object-cover"
                  controls
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  poster={course.image}
                >
                  <source src={course.video} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img src={course.image} alt={course.title} className="absolute inset-0 w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--coffee-dark)]/90 via-[var(--coffee-dark)]/30 to-transparent" />
              <div className="relative p-6 pt-20 w-full text-white">
                <h3 className="text-xl font-bold mb-3">{course.title}</h3>
                <p className="text-white/90">{course.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-[var(--coffee-accent)] to-[var(--coffee-light)] rounded-lg flex items-center justify-center overflow-hidden">
            <img src="/images/Training Curriculum.jpeg" alt="Training Curriculum" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-dark)]">
              Training Curriculum
            </h2>
            <p className="text-[var(--text-light)]">The complete barista & juice mastery program</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {curriculum.map((module, i) => (
            <div key={module} className="bg-white rounded-xl p-4 shadow-md border border-[var(--coffee-accent)]/20 card-hover flex items-center gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--coffee-accent)] text-white text-sm font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span className="font-medium text-[var(--text-dark)]">{module}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-[var(--coffee-dark)] rounded-lg flex items-center justify-center overflow-hidden">
            <img src="/images/Specialty Coffee.jpeg" alt="Specialty Coffee" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-dark)]">
              Specialty Coffee
            </h2>
            <p className="text-[var(--text-light)]">Advanced brewing methods for the perfect cup</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {specialtyMethods.map((method) => (
            <div key={method.name} className="relative flex items-end bg-gradient-to-br from-[var(--coffee-dark)] to-[var(--coffee-medium)] rounded-xl overflow-hidden card-hover min-h-[260px] text-white">
              <img src={method.image} alt={method.name} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--coffee-dark)]/90 via-[var(--coffee-dark)]/30 to-transparent" />
              <div className="relative p-6 pt-20 w-full">
                <h3 className="text-xl font-bold mb-3">{method.name}</h3>
                <p className="text-gray-200">{method.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default CoffeeTraining;
