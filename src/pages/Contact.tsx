import { Mail, Phone, MapPin } from 'lucide-react';

const Contact = () => {
  const team = [
    {
      name: 'Team Member One',
      position: 'Head Barista',
      src: '/images/IMG-20260408-WA0013.jpg',
    },
    {
      name: 'Team Member Two',
      position: 'Coffee Trainer',
      src: '/images/IMG-20260408-WA0014.jpg',
    },
    {
      name: 'Team Member Three',
      position: 'Beverage Specialist',
      src: '/images/IMG-20260408-WA0027.jpg',
    },
  ];

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-dark)] mb-4">
          Contact Us
        </h1>
        <p className="text-[var(--text-medium)] max-w-2xl mx-auto text-lg">
          Meet our team and reach out — we'd love to hear from you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-dark)] mb-6">
            Get in Touch
          </h2>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[var(--coffee-accent)] rounded-lg flex items-center justify-center shrink-0">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--text-dark)]">Address</h3>
                <p className="text-[var(--text-medium)]">KN 197 St,Kigali, Rwanda 250</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[var(--coffee-accent)] rounded-lg flex items-center justify-center shrink-0">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--text-dark)]">Phone</h3>
                <p className="text-[var(--text-medium)]">+25078 969 8317</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[var(--coffee-accent)] rounded-lg flex items-center justify-center shrink-0">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--text-dark)]">Email</h3>
                <p className="text-[var(--text-medium)]">kigalispecialistbarista@gmail.com</p>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-gradient-to-br from-[var(--coffee-dark)] to-[var(--coffee-medium)] rounded-xl p-6 text-white">
            <h3 className="font-bold text-lg mb-2">Business Hours</h3>
            <p className="text-gray-200 text-sm">Mornig Shift-afternoon shift</p>
            <p className="text-gray-200 text-sm">Saturday:Open</p>
            <p className="text-gray-200 text-sm">Sunday: Open</p>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-[var(--text-dark)] mb-6">
            Our Team
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {team.map((member) => (
              <div
                key={member.src}
                className="bg-white rounded-xl p-6 shadow-md border border-[var(--coffee-accent)]/20 card-hover"
              >
                <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-[var(--coffee-accent)]/30 mb-4">
                  <img
                    src={member.src}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-center text-lg font-bold text-[var(--text-dark)] mb-1">
                  {member.name}
                </h3>
                <p className="text-center text-[var(--text-medium)] text-sm">
                  {member.position}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
