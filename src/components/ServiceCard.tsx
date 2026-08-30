import { Link } from 'react-router-dom';
import { type LucideIcon } from 'lucide-react';

interface ServiceCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  image?: string;
  link: string;
}

const ServiceCard = ({ title, description, icon: Icon, image, link }: ServiceCardProps) => {
  return (
    <Link
      to={link}
      className="block bg-white rounded-xl p-6 shadow-md card-hover border border-[var(--coffee-accent)]/20"
    >
      <div className="w-14 h-14 bg-gradient-to-br from-[var(--coffee-accent)] to-[var(--coffee-light)] rounded-lg flex items-center justify-center mb-4 overflow-hidden">
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover" />
        ) : (
          <Icon className="h-7 w-7 text-white" />
        )}
      </div>
      <h3 className="text-lg font-bold text-[var(--text-dark)] mb-2">{title}</h3>
      <p className="text-[var(--text-medium)] text-sm">{description}</p>
    </Link>
  );
};

export default ServiceCard;
