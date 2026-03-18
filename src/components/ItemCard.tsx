import React from 'react';
import { Link } from 'react-router-dom';
import { Item } from '../types';
import { motion } from 'motion/react';
import { Pencil, Trash2 } from 'lucide-react';

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

  // Prevent click from bubbling to parent Link or motion container
  const handle = (e: React.MouseEvent, fn?: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    fn?.();
  };

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
        <div className="px-2 pb-2 flex gap-1.5">
          {item.status === 'available' && onMarkSold && (
            <button
              type="button"
              onClick={(e) => handle(e, onMarkSold)}
              className="flex-1 min-h-[44px] py-2 text-xs font-bold uppercase bg-neon-green border-[3px] border-black brutal-shadow-small active:translate-y-[1px] active:shadow-none transition-all"
            >
              Sold
            </button>
          )}
          {item.status === 'sold' && onMarkAvailable && (
            <button
              type="button"
              onClick={(e) => handle(e, onMarkAvailable)}
              className="flex-1 min-h-[44px] py-2 text-xs font-bold uppercase bg-blue-200 border-[3px] border-black brutal-shadow-small active:translate-y-[1px] active:shadow-none transition-all"
            >
              Relist
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={(e) => handle(e, onEdit)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs font-bold uppercase bg-white border-[3px] border-black brutal-shadow-small active:translate-y-[1px] active:shadow-none transition-all"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => handle(e, onDelete)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs font-bold uppercase bg-red-500 text-white border-[3px] border-black brutal-shadow-small active:translate-y-[1px] active:shadow-none transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
