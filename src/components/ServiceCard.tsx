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
      className="group relative flex items-end bg-white rounded-xl overflow-hidden shadow-md card-hover border border-[var(--coffee-accent)]/20 min-h-[220px]"
    >
      {image ? (
        <>
          <img src={image} alt={title} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--coffee-dark)]/90 via-[var(--coffee-dark)]/30 to-transparent" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--coffee-accent)] to-[var(--coffee-light)] flex items-center justify-center">
          <Icon className="h-12 w-12 text-white" />
        </div>
      )}
      <div className="relative p-6 pt-20 w-full">
        <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
        <p className="text-white/85 text-sm leading-relaxed">{description}</p>
      </div>
    </Link>
  );
};

export default ServiceCard;
