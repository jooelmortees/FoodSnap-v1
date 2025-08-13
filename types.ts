
export interface Ingredient {
  id: string; // For unique key in lists
  name: string;
  quantity: string; // e.g., "2", "100g", "1 cup"
  state?: string; // e.g., "fresh", "cooked", "packaged" - optional
}

export interface RecipeIngredient {
  name: string;
  quantity: string;
  unit: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  ingredients: RecipeIngredient[];
  instructions: string[];
  dietaryTags?: string[];
  estimatedNutrition?: {
    calories?: string;
    protein?: string;
    carbs?: string;
    fat?: string;
  };
  possibleSubstitutions?: {
    originalIngredient: string;
    suggestion: string;
  }[];
  imageUrl?: string; // Optional image for the recipe
  imageQuery?: string; // Fallback query for image generation/search
}

export interface UserPreferences {
  timeAvailable: 'quick' | 'normal' | 'advanced';
  dietaryGoal: 'light' | 'hearty' | 'use_leftovers';
  specificDiets: string[]; // e.g., ["vegan", "gluten-free"]
  desiredServings?: number; // Added for desired servings selection
}

export enum AppView {
  HOME = 'home',
  INGREDIENT_EDIT = 'ingredient_edit',
  RECIPE_SUGGESTIONS = 'recipe_suggestions',
  RECIPE_DETAIL = 'recipe_detail',
}
