import React, { useState, useEffect } from 'react';
import { Recipe } from '../types';
import { ClockIcon, UsersIcon, LeafIcon, EyeIcon, AlertTriangleIcon } from './icons/Icons';
import { LoadingSpinner } from './LoadingSpinner';

interface RecipeCardProps {
  recipe: Recipe;
  onSelect: () => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onSelect }) => {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // The image URL is now directly from the recipe. We add a retry parameter to break cache.
  // Pollinations.ai ignores unknown query params, so this is safe.
  const imageUrl = recipe.imageUrl ? (retryCount > 0 ? `${recipe.imageUrl}?retry=${retryCount}` : recipe.imageUrl) : '';

  const handleImageLoad = () => {
    setIsImageLoading(false);
    setImageLoadError(false);
  };

  const handleImageError = () => {
    // Retry after a short, increasing delay. No limit on retries.
    setTimeout(() => {
      setRetryCount(prev => prev + 1);
    }, 1000 * (retryCount + 1));
  };
  
  // Reset state if the recipe prop changes, ensuring the loader shows for new images.
  useEffect(() => {
      setIsImageLoading(true);
      setImageLoadError(false);
      setRetryCount(0);
  }, [recipe.imageUrl]);

  return (
    <div 
      onClick={onSelect} 
      className="bg-surface rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out flex flex-col h-full group transform hover:-translate-y-1 border border-gray-200"
      role="article"
      aria-labelledby={`recipe-title-${recipe.id}`}
    >
      <div className="relative h-48 w-full overflow-hidden bg-gray-200 rounded-t-xl">
        {isImageLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <LoadingSpinner color="text-primary" />
          </div>
        )}
        
        {!imageLoadError && imageUrl && (
             <img 
              src={imageUrl} 
              alt={`Plato terminado: ${recipe.title}`}
              className={`w-full h-full object-cover transition-opacity duration-500 group-hover:scale-105 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
        )}
        
        {imageLoadError && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-error p-2 text-center">
                <AlertTriangleIcon className="w-10 h-10" />
                <span className="text-xs mt-2 font-medium">Error al cargar la imagen</span>
            </div>
        )}

        {!isImageLoading && !imageLoadError && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-70 group-hover:opacity-50 transition-opacity"></div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h3 id={`recipe-title-${recipe.id}`} className="text-lg font-semibold text-primary-dark mb-2 leading-tight group-hover:text-primary transition-colors">
          {recipe.title}
        </h3>
        <p className="text-sm text-onSurface-light mb-4 flex-grow line-clamp-3" title={recipe.description}>
          {recipe.description}
        </p>
        
        <div className="mt-auto space-y-2">
          <div className="flex items-center text-xs text-gray-600">
            <ClockIcon className="w-4 h-4 mr-1.5 text-secondary" />
            <span>Prep: {recipe.prepTime} | Cocción: {recipe.cookTime}</span>
          </div>
          <div className="flex items-center text-xs text-gray-600">
            <UsersIcon className="w-4 h-4 mr-1.5 text-secondary" />
            <span>Porciones: {recipe.servings}</span>
          </div>

          {recipe.dietaryTags && recipe.dietaryTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {recipe.dietaryTags.slice(0, 3).map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full flex items-center border border-green-200">
                  <LeafIcon className="w-3 h-3 mr-1 text-primary" /> {tag}
                </span>
              ))}
              {recipe.dietaryTags.length > 3 && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full border border-gray-200">
                  +{recipe.dietaryTags.length - 3} más
                </span>
              )}
            </div>
          )}
        </div>
        <button 
            className="mt-4 w-full bg-primary text-white font-medium py-2.5 px-4 rounded-lg hover:bg-primary-dark transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-opacity-75 flex items-center justify-center text-sm"
            aria-label={`Ver detalles de la receta ${recipe.title}`}
        >
            <EyeIcon className="w-4 h-4 mr-2"/>
            Ver Receta
        </button>
      </div>
    </div>
  );
};