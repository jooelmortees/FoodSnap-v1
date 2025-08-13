import React, { useState, useCallback, useEffect } from 'react';
import { Ingredient, Recipe, UserPreferences, AppView } from './types';
import { ImageUploader } from './components/ImageUploader';
import { IngredientEditor } from './components/IngredientEditor';
import { RecipeSuggestions } from './components/RecipeSuggestions';
import { RecipeDetailView } from './components/RecipeDetailView';
import { LoadingSpinner } from './components/LoadingSpinner';
import { identifyIngredientsFromImage, suggestRecipes } from './services/geminiService';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AlertTriangleIcon } from './components/icons/Icons'; // Using AlertTriangle for errors

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [uploadedImages, setUploadedImages] = useState<string[] | null>(null);
  const [detectedIngredients, setDetectedIngredients] = useState<Ingredient[]>([]);
  const [suggestedRecipesList, setSuggestedRecipesList] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    timeAvailable: 'normal',
    dietaryGoal: 'use_leftovers',
    specificDiets: [],
    desiredServings: 2, // Default desired servings
  });

  const resetError = () => setError(null);

  const handleImageUpload = useCallback(async (imageDataUrls: string[]) => {
    resetError();
    setUploadedImages(imageDataUrls);
    setIsLoading(true);
    setCurrentView(AppView.INGREDIENT_EDIT);
    try {
      const allIdentifiedIngredientsArrays = await Promise.all(
        imageDataUrls.map(url => identifyIngredientsFromImage(url))
      );
      const aggregatedIngredients = allIdentifiedIngredientsArrays.flat();
      
      // Deduplicate ingredients
      const uniqueIngredientsMap = new Map<string, Ingredient>();
      aggregatedIngredients.forEach(ingredient => {
        if (ingredient && ingredient.name) { // Ensure ingredient and name exist
          const normalizedName = ingredient.name.toLowerCase().trim();
          if (!uniqueIngredientsMap.has(normalizedName)) {
            uniqueIngredientsMap.set(normalizedName, ingredient);
          }
        }
      });
      const finalDetectedIngredients = Array.from(uniqueIngredientsMap.values());

      setDetectedIngredients(finalDetectedIngredients.map((ing, index) => ({ ...ing, id: `ing-${Date.now()}-${index}` })));
      if (finalDetectedIngredients.length === 0 && imageDataUrls.length > 0) {
        setError("No pudimos identificar ingredientes en las imágenes. Inténtalo de nuevo con imágenes más claras o edita la lista manualmente.");
      }
    } catch (err) {
      console.error("Error identifying ingredients from multiple images:", err);
      setError("No pudimos identificar los ingredientes de una o más imágenes. Inténtalo de nuevo o edita la lista manualmente.");
      setDetectedIngredients([]); // Clear ingredients on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleIngredientsConfirm = useCallback(async (finalIngredients: Ingredient[]) => {
    if (finalIngredients.length === 0) {
      setError("Por favor, añade al menos un ingrediente para buscar recetas.");
      return;
    }
    resetError();
    setDetectedIngredients(finalIngredients);
    setIsLoading(true);
    setCurrentView(AppView.RECIPE_SUGGESTIONS);
    try {
      const recipes = await suggestRecipes(finalIngredients, userPreferences);
      setSuggestedRecipesList(recipes.map((rec, index) => ({ ...rec, id: `rec-${Date.now()}-${index}` })));
      if (recipes.length === 0) {
        setError("No encontramos recetas con esos ingredientes y preferencias. Prueba a ajustar los ingredientes o preferencias.");
      }
    } catch (err) {
      console.error("Error suggesting recipes:", err);
      setError("Hubo un problema al generar recetas. Por favor, inténtalo de nuevo.");
      setSuggestedRecipesList([]);
    } finally {
      setIsLoading(false);
    }
  }, [userPreferences]);

  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setCurrentView(AppView.RECIPE_DETAIL);
  };

  const handleBack = () => {
    resetError();
    if (currentView === AppView.RECIPE_DETAIL) {
      setCurrentView(AppView.RECIPE_SUGGESTIONS);
      setSelectedRecipe(null);
    } else if (currentView === AppView.RECIPE_SUGGESTIONS) {
      setCurrentView(AppView.INGREDIENT_EDIT);
      setSuggestedRecipesList([]);
    } else if (currentView === AppView.INGREDIENT_EDIT) {
      setCurrentView(AppView.HOME);
      setUploadedImages(null);
      setDetectedIngredients([]);
    }
  };
  
  const handlePreferencesChange = (newPreferences: Partial<UserPreferences>) => {
    setUserPreferences(prev => ({ ...prev, ...newPreferences }));
  };

   useEffect(() => {
    if (currentView === AppView.HOME) {
      setUploadedImages(null);
      setDetectedIngredients([]);
      setSuggestedRecipesList([]);
      setSelectedRecipe(null);
    }
  }, [currentView]);


  const renderView = () => {
    switch (currentView) {
      case AppView.HOME:
        return (
          <ImageUploader 
            onImageUpload={handleImageUpload} 
            isLoadingExternal={isLoading && (!uploadedImages || uploadedImages.length === 0)} 
          />
        );
      case AppView.INGREDIENT_EDIT:
        return (
          <IngredientEditor
            initialIngredients={detectedIngredients}
            onConfirm={handleIngredientsConfirm}
            onBack={handleBack}
            uploadedImages={uploadedImages} // Pass multiple images
            isLoading={isLoading && detectedIngredients.length === 0}
          />
        );
      case AppView.RECIPE_SUGGESTIONS:
        return (
          <RecipeSuggestions
            recipes={suggestedRecipesList}
            onSelectRecipe={handleSelectRecipe}
            onBack={handleBack}
            onRefresh={() => handleIngredientsConfirm(detectedIngredients)}
            isLoading={isLoading}
            userPreferences={userPreferences}
            onPreferencesChange={handlePreferencesChange}
          />
        );
      case AppView.RECIPE_DETAIL:
        if (selectedRecipe) {
          return <RecipeDetailView recipe={selectedRecipe} onBack={handleBack} />;
        }
        setCurrentView(AppView.RECIPE_SUGGESTIONS); 
        return null; 
      default:
        setCurrentView(AppView.HOME); 
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {error && (
          <div className="bg-error/10 border-l-4 border-error text-error p-4 mb-6 rounded-md shadow-md" role="alert">
            <div className="flex">
              <div className="py-1">
                <AlertTriangleIcon className="h-6 w-6 text-error mr-3" />
              </div>
              <div>
                <p className="font-semibold">¡Ups! Algo salió mal.</p>
                <p className="text-sm text-error">{error}</p>
              </div>
            </div>
          </div>
        )}
        {renderView()}
      </main>
      <Footer />
    </div>
  );
};

export default App;