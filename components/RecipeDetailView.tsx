import React, { useState, useEffect } from 'react';
import { Recipe } from '../types';
import { Button } from './Button';
import { ArrowLeftIcon, ClockIcon, UsersIcon, LeafIcon, SparklesIcon, ClipboardListIcon, UtensilsIcon, Edit3Icon, AlertTriangleIcon } from './icons/Icons';
import { LoadingSpinner } from './LoadingSpinner';

interface RecipeDetailViewProps {
  recipe: Recipe;
  onBack: () => void;
}

const InfoPill: React.FC<{ icon: React.ReactNode; label: string; value: string | number }> = ({ icon, label, value }) => (
  <div className="flex items-center bg-gray-100 p-2.5 rounded-lg shadow-sm overflow-hidden">
    <span className="text-secondary flex-shrink-0">{icon}</span>
    <span className="ml-2 text-sm text-onSurface-light min-w-0">
      <strong className="text-onSurface">{label}:</strong> {value}
    </span>
  </div>
);

export const RecipeDetailView: React.FC<RecipeDetailViewProps> = ({ recipe, onBack }) => {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
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

  useEffect(() => {
    setIsImageLoading(true);
    setImageLoadError(false);
    setRetryCount(0);
  }, [recipe.imageUrl]);


  return (
    <div className="bg-surface shadow-xl rounded-2xl p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <Button onClick={onBack} variant="ghost" size="icon" aria-label="Volver a sugerencias">
          <ArrowLeftIcon className="w-6 h-6" />
        </Button>
        <h1 className="text-2xl sm:text-3xl md:text-[2.2rem] lg:text-4xl font-bold text-primary-dark text-center leading-tight px-4">
          {recipe.title}
        </h1>
        <div className="w-10"> {/* Spacer */}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
        {/* Left Column: Image */}
        <div className="lg:col-span-2 mb-8 lg:mb-0">
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-lg border border-gray-200 bg-gray-200 flex items-center justify-center">
            {isImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <LoadingSpinner color="text-primary" />
              </div>
            )}
            {!imageLoadError && imageUrl && (
                <img 
                  src={imageUrl} 
                  alt={`Plato terminado: ${recipe.title}`}
                  className={`w-full h-full object-cover transition-opacity duration-500 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
            )}
            {imageLoadError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-error p-4 text-center">
                    <AlertTriangleIcon className="w-12 h-12" />
                    <span className="text-sm mt-2 font-medium">No se pudo cargar la imagen</span>
                </div>
            )}
          </div>
        </div>

        {/* Right Column: Key Info (Servings, Prep, Cook), Description, Ingredients, Dietary Tags, Instructions, etc. */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* Key Info Pills - Grouped Here */}
          <div className="space-y-3">
            <InfoPill icon={<UsersIcon className="w-5 h-5" />} label="Porciones" value={recipe.servings} />
            <InfoPill icon={<ClockIcon className="w-5 h-5" />} label="Preparación" value={recipe.prepTime} />
            <InfoPill icon={<ClockIcon className="w-5 h-5" />} label="Cocción" value={recipe.cookTime} />
          </div>

          {recipe.description && (
            <div className="p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <h2 className="text-lg font-semibold text-onSurface mb-2 flex items-center">
                    <Edit3Icon className="w-5 h-5 mr-2 text-primary" />
                    Descripción
                </h2>
                <p className="text-onSurface-light text-sm leading-relaxed">{recipe.description}</p>
            </div>
          )}
          
          <div>
            <h2 className="text-xl font-semibold text-onSurface mb-3 flex items-center">
              <ClipboardListIcon className="w-6 h-6 mr-2 text-primary" />
              Ingredientes Necesarios
            </h2>
            <ul className="list-none space-y-2 text-onSurface-light bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
              {recipe.ingredients.map((ing, index) => (
                <li key={index} className="flex items-start py-1 border-b border-gray-100 last:border-b-0">
                  <span className="text-primary mr-2">&#10003;</span> {/* Checkmark */}
                  <span><strong>{ing.quantity} {ing.unit}</strong> de {ing.name}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Dietary Tags - Moved Here */}
          {recipe.dietaryTags && recipe.dietaryTags.length > 0 && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="text-md font-semibold text-primary-dark mb-2 flex items-center">
                <LeafIcon className="w-5 h-5 mr-2" />
                Etiquetas Dietéticas
              </h3>
              <div className="flex flex-wrap gap-2">
                {recipe.dietaryTags.map(tag => (
                  <span key={tag} className="px-2.5 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full border border-green-300">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold text-onSurface mb-3 flex items-center">
              <UtensilsIcon className="w-6 h-6 mr-2 text-primary" />
              Pasos de Preparación
            </h2>
            <ol className="list-none space-y-4 text-onSurface-light">
              {recipe.instructions.map((step, index) => (
                <li key={index} className="flex items-start pb-3 border-b border-gray-100 last:border-b-0">
                  <span className="bg-primary text-white text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">{index + 1}</span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {recipe.estimatedNutrition && Object.values(recipe.estimatedNutrition).some(val => val) && (
             <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
              <h3 className="text-md font-semibold text-accent-dark mb-2 flex items-center">
                <SparklesIcon className="w-5 h-5 mr-2 text-accent" />
                Nutrición Estimada (por porción)
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-onSurface-light">
                {recipe.estimatedNutrition.calories && <span><strong>Calorías:</strong> {recipe.estimatedNutrition.calories}</span>}
                {recipe.estimatedNutrition.protein && <span><strong>Proteína:</strong> {recipe.estimatedNutrition.protein}</span>}
                {recipe.estimatedNutrition.carbs && <span><strong>Carbs:</strong> {recipe.estimatedNutrition.carbs}</span>}
                {recipe.estimatedNutrition.fat && <span><strong>Grasa:</strong> {recipe.estimatedNutrition.fat}</span>}
              </div>
            </div>
          )}

          {recipe.possibleSubstitutions && recipe.possibleSubstitutions.length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm">
              <h3 className="text-md font-semibold text-yellow-700 mb-2">Sugerencias y Sustituciones</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                {recipe.possibleSubstitutions.map((sub, index) => (
                  <li key={index}>
                    <strong>{sub.originalIngredient}:</strong> {sub.suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};