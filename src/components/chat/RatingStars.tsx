import { useState } from 'react';
import { Star } from 'lucide-react';

interface Props {
  rating: number | null;
  onRate?: (rating: number) => void;
  interactive?: boolean;
  size?: number;
}

const RatingStars = ({ rating, onRate, interactive = true, size = 16 }: Props) => {
  const [hover, setHover] = useState(0);
  const displayRating = hover || rating || 0;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          onClick={() => onRate?.(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
        >
          <Star
            className={`transition-colors ${
              star <= displayRating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-[#71767b]'
            }`}
            style={{ width: size, height: size }}
          />
        </button>
      ))}
    </div>
  );
};

export default RatingStars;
