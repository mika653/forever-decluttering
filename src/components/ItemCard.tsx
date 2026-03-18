import { Link } from 'react-router-dom';
import { Item } from '../types';
import { motion } from 'motion/react';
import { Pencil } from 'lucide-react';

interface ItemCardProps {
  item: Item;
  storeSlug: string;
  showStatus?: boolean;
  onMarkSold?: () => void;
  onMarkAvailable?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function ItemCard({ item, storeSlug, showStatus, onMarkSold, onMarkAvailable, onEdit, onDelete }: ItemCardProps) {
  const hasActions = onMarkSold || onMarkAvailable || onEdit || onDelete;

  return (
    <motion.div
      whileHover={{ scale: 1.02, rotate: -1 }}
      className="bg-white border-[3px] border-black brutal-shadow group flex flex-col h-full"
    >
      <Link to={`/${storeSlug}/${item.id}`} className="flex flex-col h-full">
        <div className="aspect-square relative overflow-hidden border-b-[3px] border-black bg-gray-100">
          {item.images[0] ? (
            <img
              src={item.images[0]}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl font-display">
              ?
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-neon-pink border-[3px] border-black px-3 py-1 font-display text-lg brutal-shadow-small -rotate-2 group-hover:rotate-0 transition-transform">
            ₱{item.price}
          </div>
          {item.condition && (
            <div className="absolute top-2 right-2 bg-black text-white text-[10px] font-mono font-bold uppercase px-2 py-0.5">
              {item.condition}
            </div>
          )}
          {showStatus && item.status === 'sold' && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-neon-green font-display text-3xl rotate-[-12deg]">SOLD</span>
            </div>
          )}
        </div>
        <div className="p-3 flex-1 flex flex-col">
          <h3 className="text-base font-display leading-tight uppercase">{item.title}</h3>
          <p className="mono text-[11px] text-gray-500 line-clamp-2 mt-1">{item.description}</p>
        </div>
      </Link>

      {hasActions && (
        <div className="px-3 pb-3 flex gap-2 flex-wrap">
          {item.status === 'available' && onMarkSold && (
            <button
              onClick={onMarkSold}
              className="flex-1 py-1.5 text-xs font-bold uppercase bg-neon-green border-[3px] border-black brutal-shadow-small hover:translate-y-[-1px] transition-transform"
            >
              Mark Sold
            </button>
          )}
          {item.status === 'sold' && onMarkAvailable && (
            <button
              onClick={onMarkAvailable}
              className="flex-1 py-1.5 text-xs font-bold uppercase bg-blue-200 border-[3px] border-black brutal-shadow-small hover:translate-y-[-1px] transition-transform"
            >
              Relist
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="py-1.5 px-3 text-xs font-bold uppercase bg-white border-[3px] border-black brutal-shadow-small hover:translate-y-[-1px] transition-transform"
            >
              <Pencil className="w-3 h-3" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="py-1.5 px-3 text-xs font-bold uppercase bg-red-500 text-white border-[3px] border-black brutal-shadow-small hover:translate-y-[-1px] transition-transform"
            >
              Del
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
