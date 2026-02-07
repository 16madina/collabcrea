import { motion } from "framer-motion";
import { Star, MessageSquare } from "lucide-react";

interface Review {
  id: string;
  creatorName: string;
  creatorAvatar: string | null;
  rating: number;
  comment: string;
  date: string;
  projectTitle: string;
}

interface BrandReviewsTabProps {
  reviews: Review[];
  averageRating: number | null;
  isLoading?: boolean;
}

const BrandReviewsTab = ({ reviews, averageRating, isLoading = false }: BrandReviewsTabProps) => {
  const hasReviews = reviews.length > 0;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-gold fill-gold" : "text-muted-foreground"
        }`}
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-muted/30 rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 space-y-4"
    >
      {/* Rating Summary */}
      {hasReviews && averageRating && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-gold/20 to-gold/5 rounded-2xl p-6 text-center"
        >
          <div className="text-5xl font-bold text-gold mb-2">
            {averageRating.toFixed(1)}
          </div>
          <div className="flex items-center justify-center gap-1 mb-2">
            {renderStars(Math.round(averageRating))}
          </div>
          <p className="text-sm text-muted-foreground">
            Basé sur {reviews.length} avis de créateurs
          </p>
        </motion.div>
      )}

      {/* Reviews List */}
      {hasReviews ? (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            Avis des créateurs
          </h4>
          {reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-muted/30 rounded-xl p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {review.creatorAvatar ? (
                    <img 
                      src={review.creatorAvatar} 
                      alt={review.creatorName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gold font-bold">
                      {review.creatorName.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-foreground">{review.creatorName}</h4>
                    <div className="flex items-center gap-0.5">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{review.projectTitle}</p>
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                  <p className="text-xs text-muted-foreground/60 mt-2">{review.date}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12 px-4"
        >
          <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-10 h-10 text-gold" />
          </div>
          <h4 className="font-display font-semibold text-lg mb-2">Aucun avis pour le moment</h4>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Complétez des collaborations avec des créateurs pour recevoir des avis
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default BrandReviewsTab;
