import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Ingredient, Recipe, UserPreferences, RecipeIngredient } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set. Please set it before running the application.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const textModel = 'gemini-2.5-flash-preview-04-17';

/**
 * Creates a URL for an image from pollinations.ai based on a rich recipe description.
 * @param description A description of the dish.
 * @returns A URL string to a generated image.
 */
const generateRecipeImageUrl = (
  description: string
): string => {
    // Construct a rich, detailed prompt for pollinations.ai based on the recipe description.
    const fullPrompt = `hyperrealistic professional food photography of a dish best described as: "${description}". The style should be cinematic with dramatic lighting, 8k resolution, hyper-detailed, and look incredibly mouth-watering and appetizing.`;

    return `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}`;
};


const parseJsonFromText = <T,>(text: string): T | null => {
  let processedText = text.trim();

  const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
  const fenceMatch = processedText.match(fenceRegex);
  if (fenceMatch && fenceMatch[1]) {
    processedText = fenceMatch[1].trim();
  }

  // Attempt 1: Direct parsing
  try {
    return JSON.parse(processedText) as T;
  } catch (e1) {
    console.warn("Direct JSON.parse failed (e1). Will attempt extraction. Error:", e1 instanceof Error ? e1.message : String(e1));
  }

  // Attempt 2: Extract first major JSON structure (object or array)
  let startIndex = -1;
  let firstChar: string | null = null;
  
  for (let i = 0; i < processedText.length; i++) {
      if (processedText[i] === '{' || processedText[i] === '[') {
          startIndex = i;
          firstChar = processedText[i];
          break;
      }
  }

  if (startIndex !== -1 && firstChar) {
      const openBraceChar = firstChar;
      const closeBraceChar = firstChar === '{' ? '}' : ']';
      let balance = 0;
      let endIndex = -1;

      for (let i = startIndex; i < processedText.length; i++) {
          if (processedText[i] === openBraceChar) {
              balance++;
          } else if (processedText[i] === closeBraceChar) {
              balance--;
          }
          if (balance === 0) {
              endIndex = i;
              break;
          }
      }

      if (endIndex !== -1) {
          const extractedJson = processedText.substring(startIndex, endIndex + 1);
          try {
              return JSON.parse(extractedJson) as T;
          } catch (e2) {
             console.warn(`Parsing auto-extracted structure ('${openBraceChar}'...'${closeBraceChar}') failed (e2):`, e2 instanceof Error ? e2.message : String(e2));
             
             // Attempt 3: If extracted structure was an array and failed, try to parse individual objects within it
             if (openBraceChar === '[' && closeBraceChar === ']') {
                console.warn("Attempt 3: Trying to parse individual objects from malformed array.");
                const objects: any[] = [];
                let currentPos = 1; // Start after the initial '['
                let objectBalance = 0;
                let objectStartIndex = -1;

                while(currentPos < extractedJson.length -1) { // Stop before final ']'
                    if (extractedJson[currentPos] === '{') {
                        if (objectBalance === 0) {
                            objectStartIndex = currentPos;
                        }
                        objectBalance++;
                    } else if (extractedJson[currentPos] === '}') {
                        objectBalance--;
                        if (objectBalance === 0 && objectStartIndex !== -1) {
                            const objectStr = extractedJson.substring(objectStartIndex, currentPos + 1);
                            try {
                                objects.push(JSON.parse(objectStr));
                                console.log("Successfully parsed an object from malformed array:", objectStr);
                            } catch (e3) {
                                console.warn("Failed to parse an individual object from malformed array:", objectStr, "Error:", e3 instanceof Error ? e3.message : String(e3));
                            }
                            objectStartIndex = -1; 
                        }
                    }
                    currentPos++;
                }
                if (objects.length > 0) {
                    console.log(`Attempt 3 recovered ${objects.length} objects from the malformed array.`);
                    return objects as T; // Assuming T is an array type
                } else {
                    console.warn("Attempt 3: Could not recover any objects from the malformed array.");
                }
             }
          }
      } else {
        console.warn("Could not find a balanced closing brace/bracket for the first opening one.");
      }
  } else {
    console.warn("No opening '{' or '[' found in the processed text for extraction.");
  }
  
  console.error("All JSON parsing attempts failed. Final processed text:", processedText);
  return null;
};

export const identifyIngredientsFromImage = async (imageDataUrl: string): Promise<Ingredient[]> => {
  const base64Data = imageDataUrl.split(',')[1];
  if (!base64Data) {
    throw new Error("Invalid image data URL");
  }

  const imagePart = {
    inlineData: {
      mimeType: imageDataUrl.substring(imageDataUrl.indexOf(':') + 1, imageDataUrl.indexOf(';')),
      data: base64Data,
    },
  };

  const textPart = {
    text: `Analiza esta imagen de una nevera, despensa o ingredientes. Identifica todos los alimentos visibles.
Para cada alimento, proporciona su nombre, una cantidad aproximada (ej: "2 unidades", "medio manojo", "200g", "1 paquete"), y su estado general si es discernible (ej: "fresco", "cocido", "envasado").
Si la cantidad o el estado no son claros, usa "desconocido" o omite el campo estado.
Devuelve esta información como un array JSON de objetos. Cada objeto debe tener las claves "name" (string), "quantity" (string), y opcionalmente "state" (string).
Ejemplo de formato esperado: [{"name": "Manzana", "quantity": "3 unidades", "state": "fresco"}, {"name": "Leche", "quantity": "1 litro", "state": "envasado"}]
CRÍTICO: La respuesta debe ser ÚNICAMENTE el array JSON válido y completo. NO incluyas NINGÚN texto explicativo, comentarios, ni caracteres extraños FUERA O DENTRO del JSON.
ES ESPECIALMENTE IMPORTANTE que dentro de cada objeto JSON y entre los objetos del array, solo exista la sintaxis JSON correcta. NO insertes palabras o texto suelto que no pertenezcan a los valores de las claves JSON.
Verifica que el JSON sea parseable antes de devolverlo. Asegúrate de que todos los nombres de los ingredientes ("name") estén en español. Si no puedes identificar ningún alimento claramente, devuelve un array JSON vacío: [].`,
  };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: textModel,
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
      }
    });

    const parsedIngredients = parseJsonFromText<Ingredient[]>(response.text);
    if (parsedIngredients && Array.isArray(parsedIngredients)) {
      // Filter out any potential null/undefined entries or entries without a name, which might indicate parsing issues for sub-objects
      const validIngredients = parsedIngredients.filter(item => item && typeof item.name === 'string');
      return validIngredients.map((item, index) => ({
        id: `gen-${Date.now()}-${index}`,
        name: item.name, // Already checked item.name is a string
        quantity: item.quantity || "1 unidad",
        state: item.state,
      }));
    }
    console.warn("Could not parse ingredients or got non-array/null response. Raw Gemini text:", response.text);
    return [];
  } catch (error) {
    console.error('Error calling Gemini API for ingredient identification:', error);
    throw error;
  }
};

export const suggestRecipes = async (ingredients: Ingredient[], preferences: UserPreferences): Promise<Recipe[]> => {
  const ingredientListString = ingredients.map(ing => `${ing.name} (${ing.quantity})`).join(', ');

  let servingsInstruction = '';
  if (preferences.desiredServings && preferences.desiredServings > 0) {
    servingsInstruction = `
    MUY IMPORTANTE: El usuario ha especificado que desea recetas para ${preferences.desiredServings} porciones.
    Por lo tanto, para CADA receta que sugieras:
    1. El campo "servings" DEBE ser exactamente ${preferences.desiredServings}.
    2. Las cantidades ("quantity") de TODOS los ingredientes listados en el campo "ingredients" DEBEN ser ajustadas y escaladas por ti para ${preferences.desiredServings} porciones. Realiza tú este cálculo.
    `;
  }

  let dietaryInstruction = '';
  if (preferences.specificDiets && preferences.specificDiets.length > 0) {
    const dietsString = preferences.specificDiets.join(', ');
    dietaryInstruction = `
    RESTRICCIONES DIETÉTICAS ESPECÍFICAS OBLIGATORIAS:
    El usuario ha indicado las siguientes dietas específicas: [${dietsString}].
    Es ABSOLUTAMENTE CRUCIAL que TODAS las recetas sugeridas cumplan con TODAS estas restricciones.
    Por ejemplo:
      - Si se incluye "Vegana", la receta NO DEBE CONTENER carne, pescado, lácteos, huevos, miel ni ningún otro producto de origen animal. Los "dietaryTags" deben incluir "Vegana".
      - Si se incluye "Sin Gluten", la receta NO DEBE CONTENER trigo, cebada, centeno, espelta, kamut, triticale, ni ingredientes derivados que contengan gluten. Los "dietaryTags" deben incluir "Sin Gluten".
      - Si se incluye "Sin Lácteos", la receta NO DEBE CONTENER leche, queso, yogur, mantequilla, crema ni otros productos lácteos. Los "dietaryTags" deben incluir "Sin Lácteos".
    Adapta las recetas o selecciona únicamente aquellas que se ajusten estrictamente a estas dietas.
    Asegúrate de que el campo "dietaryTags" en tu respuesta JSON refleje con precisión estas restricciones cumplidas.
    `;
  }

  const prompt = `
  IMPORTANTE: Toda la respuesta y todo el texto dentro del JSON (títulos, descripciones, instrucciones, etiquetas, etc.) DEBE estar en español.

  Dados los siguientes ingredientes disponibles: ${ingredientListString}.

  Por favor, sugiere como mínimo 6 recetas diversas que se puedan preparar con una combinación de estos ingredientes.
  Para cada receta, proporciona la siguiente información en formato JSON. La respuesta DEBE ser un array JSON de objetos de receta, y nada más.

  NOTA ESPECIAL SOBRE RECETAS DE TORTILLA: Solo puedes sugerir una receta que sea una "tortilla" (ej: "Tortilla de Patatas") si "huevos" está explícitamente en la lista de ingredientes disponibles. Si no hay huevos, NO sugieras tortillas. Si sugieres una tortilla, en su campo "description" es IMPERATIVO que NO menciones la palabra "huevos"; en su lugar, enfócate en cómo se usan los OTROS ingredientes de la lista del usuario (ejemplo: "Una jugosa tortilla que aprovecha tus patatas y cebolla..."). Para las demás recetas, la descripción debe seguir la regla general.

  Cada objeto de receta debe tener la siguiente estructura EXACTA y COMPLETA. Presta MÁXIMA ATENCIÓN a los nombres de los campos y a la sintaxis JSON, incluyendo las COMAS entre campos y elementos de arrays.
  {
    "title": "Nombre del Plato (string)",
    "description": "Una breve descripción del plato y por qué es una buena opción. CRÍTICO: La descripción DEBE especificar claramente los ingredientes principales de la lista del usuario que se utilizan en esta receta (ej: 'Este plato aprovecha tus tomates frescos, la cebolla y los pimientos...').",
    "prepTime": "Tiempo de preparación estimado (ej: '15 minutos', string)",
    "cookTime": "Tiempo de cocción estimado (ej: '30 minutos', string)",
    "servings": "Número de porciones (number)",
    "ingredients": [
      { "name": "Nombre del ingrediente", "quantity": "Cantidad", "unit": "Unidad (ej: 'g', 'ml', 'taza', 'cucharadita', 'unidad')" }
    ],
    "instructions": [
      "Paso 1 de la instrucción...",
      "Paso 2 de la instrucción..."
    ],
    "dietaryTags": ["Array de strings con etiquetas dietéticas relevantes (ej: 'vegano', 'sin gluten', 'bajo en carbohidratos') si aplica, o array vacío [] si ninguna"],
    "estimatedNutrition": {
      "calories": "ej: '500 kcal'",
      "protein": "ej: '30g'",
      "carbs": "ej: '50g'",
      "fat": "ej: '20g'"
    },
    "possibleSubstitutions": [
        {"originalIngredient": "Ingrediente original en la receta", "suggestion": "Sugerencia de sustitución o nota"}
    ],
    "imageQuery": "Proporciona aquí una frase MUY DESCRIPTIVA y ESPECÍFICA del plato nombrado en 'title'. Esta frase se usará para buscar una imagen si la generación de IA falla. Ejemplo: si title es 'Pastel de Chocolate con Fresas', imageQuery podría ser 'delicioso pastel de chocolate esponjoso con fresas frescas y crema'. NO uses términos genéricos como 'pastel' o 'comida'."
  }

  ${servingsInstruction}

  Considera las siguientes preferencias del usuario al generar las recetas:
  - Tiempo disponible: ${preferences.timeAvailable} (opciones: 'quick', 'normal', 'advanced').
  - Objetivo dietético: ${preferences.dietaryGoal} (opciones: 'light', 'hearty', 'use_leftovers').
  - Dietas específicas (informativo, la instrucción crítica está abajo si aplica): ${preferences.specificDiets.join(', ') || 'ninguna en particular'}.

  ${dietaryInstruction}

  Prioriza recetas que utilicen una buena porción de los ingredientes proporcionados.
  REVISIÓN FINAL CRÍTICA: Antes de dar tu respuesta, verifica que:
  1. La respuesta es un array JSON y NADA MÁS.
  2. La sintaxis JSON es perfecta (comas, corchetes, llaves).
  3. Cada receta tiene TODOS los campos requeridos en la estructura.
  4. El campo de los pasos se llama "instructions".
  `;

  try {
    const textResponse: GenerateContentResponse = await ai.models.generateContent({
      model: textModel,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });
    
    let parsedRecipes = parseJsonFromText<Omit<Recipe, 'id' | 'imageUrl'>[]>(textResponse.text);
    
    if (parsedRecipes && !Array.isArray(parsedRecipes) && typeof parsedRecipes === 'object') {
        console.warn("Response was a single recipe object, wrapping in array. Raw Gemini text:", textResponse.text);
        parsedRecipes = [parsedRecipes as Omit<Recipe, 'id' | 'imageUrl'>];
    }
    
    if (parsedRecipes && Array.isArray(parsedRecipes)) {
      return parsedRecipes.map((rec, index) => {
        const title = rec.title || "Receta sin título";
        const description = rec.description || "Sin descripción.";
        const ingredients = Array.isArray(rec.ingredients) ? rec.ingredients : [];
        const imageQuery = rec.imageQuery;

        return {
            id: `recipe-${Date.now()}-${index}`,
            title,
            description,
            prepTime: rec.prepTime || "N/A",
            cookTime: rec.cookTime || "N/A",
            servings: rec.servings || (preferences.desiredServings || 2),
            ingredients,
            instructions: Array.isArray(rec.instructions) ? rec.instructions : [],
            dietaryTags: Array.isArray(rec.dietaryTags) ? rec.dietaryTags : [],
            estimatedNutrition: rec.estimatedNutrition || {},
            possibleSubstitutions: Array.isArray(rec.possibleSubstitutions) ? rec.possibleSubstitutions : [],
            imageQuery,
            imageUrl: generateRecipeImageUrl(description),
        };
      });
    }
    
    console.warn("Could not parse recipes or got non-array/null response after parsing. Raw Gemini text:", textResponse.text);
    return [];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("status: 503") || errorMessage.includes("UNAVAILABLE")) {
      console.warn(`Recipe suggestion failed due to temporary service unavailability (503 UNAVAILABLE). Please try again later. Error: ${errorMessage}`);
    } else {
      console.error('Error calling Gemini API for recipe suggestion:', error);
    }
    throw error;
  }
};