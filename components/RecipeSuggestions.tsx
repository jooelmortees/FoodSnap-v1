import React, { useState, useEffect } from 'react';
import { Recipe, UserPreferences } from '../types';
import { RecipeCard } from './RecipeCard';
import { Button } from './Button';
import { ArrowLeftIcon, FilterIcon, NoRecipesIcon, UsersIcon, PlusIcon, MinusIcon } from './icons/Icons';
import { LoadingSpinner } from './LoadingSpinner';

interface RecipeSuggestionsProps {
  recipes: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
  onBack: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
  userPreferences: UserPreferences;
  onPreferencesChange: (newPreferences: Partial<UserPreferences>) => void;
}

export const RecipeSuggestions: React.FC<RecipeSuggestionsProps> = ({
  recipes,
  onSelectRecipe,
  onBack,
  onRefresh,
  isLoading,
  userPreferences,
  onPreferencesChange
}) => {
  
  const handlePreferenceChange = <K extends keyof UserPreferences>(
    key: K, 
    value: UserPreferences[K]
  ) => {
    onPreferencesChange({ [key]: value });
  };

  const standardDietOptions = [
    "Vegana",
    "Vegetariana",
    "Sin Gluten",
    "Sin Lácteos",
    "Baja en Carbohidratos",
    "Alta en Carbohidratos",
    "Alta en Proteínas",
    "Aumento Muscular"
  ];

  const allDietOptionsForButtons = [...standardDietOptions, "Otra"];

  const findCustomDiet = (diets: string[]) => diets.find(d => !standardDietOptions.includes(d)) || '';

  const [customDietText, setCustomDietText] = useState(() => findCustomDiet(userPreferences.specificDiets));
  const [showCustomInput, setShowCustomInput] = useState(() => !!findCustomDiet(userPreferences.specificDiets));

  useEffect(() => {
    const customDietValue = findCustomDiet(userPreferences.specificDiets);
    setCustomDietText(customDietValue);
    setShowCustomInput(!!customDietValue);
  }, [userPreferences.specificDiets]);

  const handleStandardDietToggle = (diet: string) => {
    const newDiets = userPreferences.specificDiets.includes(diet)
      ? userPreferences.specificDiets.filter(d => d !== diet)
      : [...userPreferences.specificDiets, diet];
    onPreferencesChange({ specificDiets: newDiets });
  };
  
  const handleOtherDietToggle = () => {
    const willShow = !showCustomInput;
    setShowCustomInput(willShow);

    if (!willShow) {
      const standardDietsOnly = userPreferences.specificDiets.filter(d => d !== customDietText);
      onPreferencesChange({ specificDiets: standardDietsOnly });
      setCustomDietText('');
    }
  };

  const handleCustomDietChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newText = event.target.value;
    const oldText = customDietText;
    setCustomDietText(newText);

    const standardDietsOnly = userPreferences.specificDiets.filter(d => d !== oldText);
    const newDiets = newText.trim()
      ? [...standardDietsOnly, newText.trim()]
      : standardDietsOnly;
    onPreferencesChange({ specificDiets: newDiets });
  };
  

  const handleDecreaseServings = () => {
    const currentServings = userPreferences.desiredServings || 1;
    if (currentServings > 1) {
      onPreferencesChange({ desiredServings: currentServings - 1 });
    }
  };

  const handleIncreaseServings = () => {
    const currentServings = userPreferences.desiredServings || 0;
    onPreferencesChange({ desiredServings: currentServings + 1 });
  };

  if (isLoading && recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-280px)] text-center p-4">
        <LoadingSpinner size="large" color="text-primary" />
        <p className="mt-4 text-lg font-medium text-onSurface" role="status" aria-live="polite">
          Buscando recetas deliciosas para ti...
        </p>
        <p className="text-sm text-onSurface-light">
          Un momento, por favor.
        </p>
      </div>
    );
  }
  
  return (
    <div className="p-0 md:p-2">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <Button onClick={onBack} variant="ghost" size="icon" aria-label="Volver a editar ingredientes">
          <ArrowLeftIcon className="w-6 h-6" />
        </Button>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-onSurface text-center flex-grow">
          Recetas Sugeridas
        </h2>
        <div className="w-10" /> {/* Spacer to keep title centered */}
      </div>

      <div className="mb-8 p-4 md:p-6 bg-gray-50 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-onSurface mb-4 flex items-center">
          <FilterIcon className="w-5 h-5 mr-2 text-primary" />
          Filtra tus Preferencias
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
          <div>
            <label htmlFor="timeAvailable" className="block text-sm font-medium text-gray-700 mb-1">Tiempo disponible:</label>
            <select
              id="timeAvailable"
              value={userPreferences.timeAvailable}
              onChange={(e) => handlePreferenceChange('timeAvailable', e.target.value as UserPreferences['timeAvailable'])}
              className="mt-1 block w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-shadow bg-white"
            >
              <option value="quick">Rápido (menos de 30 min)</option>
              <option value="normal">Normal (30-60 min)</option>
              <option value="advanced">Avanzado (sin prisa)</option>
            </select>
          </div>
          <div>
            <label htmlFor="dietaryGoal" className="block text-sm font-medium text-gray-700 mb-1">Objetivo dietético:</label>
            <select
              id="dietaryGoal"
              value={userPreferences.dietaryGoal}
              onChange={(e) => handlePreferenceChange('dietaryGoal', e.target.value as UserPreferences['dietaryGoal'])}
              className="mt-1 block w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-shadow bg-white"
            >
              <option value="light">Comida ligera</option>
              <option value="hearty">Comida contundente</option>
              <option value="use_leftovers">Aprovechar sobras</option>
            </select>
          </div>

          <div>
            <label htmlFor="desiredServings" className="block text-sm font-medium text-gray-700 mb-1">Número de Porciones:</label>
            <div className="flex items-center mt-1">
              <Button onClick={handleDecreaseServings} size="icon" variant="outline" aria-label="Disminuir porciones">
                <MinusIcon className="w-4 h-4" />
              </Button>
              <span className="text-center font-medium text-onSurface px-3 py-2.5 border-y border-gray-300 bg-white w-16" id="desiredServings">
                {userPreferences.desiredServings || 'N/A'}
              </span>
              <Button onClick={handleIncreaseServings} size="icon" variant="outline" aria-label="Aumentar porciones">
                <PlusIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="md:col-span-2 lg:col-span-3"> {/* Spanning full width on larger screens */}
            <label className="block text-sm font-medium text-gray-700 mb-1">Dietas específicas:</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {allDietOptionsForButtons.map(diet => {
                if (diet === "Otra") {
                  return (
                    <Button
                      key={diet}
                      variant={showCustomInput ? 'primary' : 'outline'}
                      size="small"
                      onClick={handleOtherDietToggle}
                      className="capitalize !text-xs !px-2.5 !py-1"
                    >
                      Otra
                    </Button>
                  );
                }
                return (
                  <Button
                    key={diet}
                    variant={userPreferences.specificDiets.includes(diet) ? 'primary' : 'outline'}
                    size="small"
                    onClick={() => handleStandardDietToggle(diet)}
                    className="capitalize !text-xs !px-2.5 !py-1"
                  >
                    {diet}
                  </Button>
                );
              })}
            </div>
            {showCustomInput && (
              <div className="mt-4">
                <label htmlFor="customDiet" className="block text-sm font-medium text-gray-700 mb-1">
                  Especifica tu otra dieta:
                </label>
                <input
                  id="customDiet"
                  type="text"
                  value={customDietText}
                  onChange={handleCustomDietChange}
                  placeholder="Ej: Sin frutos secos"
                  className="mt-1 block w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-shadow bg-white"
                />
              </div>
            )}
          </div>
        </div>
         <Button onClick={onRefresh} className="mt-6 w-full sm:w-auto" disabled={isLoading}>
            {isLoading ? <LoadingSpinner color="text-white" /> : "Aplicar Filtros y Refrescar"}
        </Button>
      </div>

      {recipes.length === 0 && !isLoading && (
        <div className="text-center py-12 my-8 bg-gray-50/50 rounded-xl p-6">
          <NoRecipesIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="mt-2 text-xl font-semibold text-onSurface">No se encontraron recetas</h3>
          <p className="mt-1 text-onSurface-light">
            Intenta ajustar tus ingredientes o las preferencias de filtro. <br/>A veces, menos filtros dan más opciones.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} onSelect={() => onSelectRecipe(recipe)} />
        ))}
      </div>
    </div>
  );
};