import { useStore } from '../lib/store';

const Gallery = () => {
  const { gallery } = useStore();

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-dark)] mb-4">
          Gallery
        </h1>
        <p className="text-[var(--text-medium)] max-w-2xl mx-auto text-lg">
          A glimpse into our world of coffee, training, and handcrafted beverages.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {gallery.map((photo) => (
          <div key={photo.id} className="group relative bg-gradient-to-br from-[var(--coffee-accent)]/20 to-[var(--coffee-light)]/20 rounded-xl overflow-hidden aspect-square card-hover">
            {photo.src ? (
              <img
                src={photo.src}
                alt={photo.alt}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : null}
            <div className="absolute inset-0 bg-[var(--coffee-dark)]/0 group-hover:bg-[var(--coffee-dark)]/60 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="text-white font-semibold text-lg text-center px-4">{photo.alt}</span>
            </div>
          </div>
        ))}
      </div>

      {gallery.length === 0 && (
        <div className="text-center text-[var(--text-medium)] mt-8">
          No photos in the gallery yet.
        </div>
      )}

      <div className="mt-12 text-center">
        <p className="text-[var(--text-light)] text-sm">
          Photos from our coffee training and beverage sessions.
        </p>
      </div>
    </div>
  );
};

export default Gallery;
