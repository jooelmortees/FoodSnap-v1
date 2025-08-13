import React, { useState, useEffect } from 'react';
import { Ingredient } from '../types';
import { Button } from './Button';
import { PlusCircleIcon, TrashIcon, CheckCircleIcon, ArrowLeftIcon, PackageIcon } from './icons/Icons';
import { LoadingSpinner } from './LoadingSpinner';

interface IngredientEditorProps {
  initialIngredients: Ingredient[];
  onConfirm: (ingredients: Ingredient[]) => void;
  onBack: () => void;
  uploadedImages?: string[] | null; // Changed from uploadedImage
  isLoading?: boolean;
}

export const IngredientEditor: React.FC<IngredientEditorProps> = ({ initialIngredients, onConfirm, onBack, uploadedImages, isLoading }) => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemUnit, setNewItemUnit] = useState('unidad(es)');

  useEffect(() => {
    setIngredients(initialIngredients.map((ing, idx) => ({ ...ing, id: ing.id || `init-${Date.now()}-${idx}` })));
  }, [initialIngredients]);

  const handleAddIngredient = () => {
    if (newItemName.trim() === '') return;
    const fullQuantity = `${newItemQuantity.trim()} ${newItemUnit.trim()}`.trim();
    const newIngredient: Ingredient = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newItemName.trim(),
      quantity: fullQuantity || '1 unidad',
    };
    setIngredients([...ingredients, newIngredient]);
    setNewItemName('');
    setNewItemQuantity('1');
    setNewItemUnit('unidad(es)');
  };

  const handleRemoveIngredient = (id: string) => {
    setIngredients(ingredients.filter(ing => ing.id !== id));
  };

  const handleUpdateIngredient = (id: string, field: 'name' | 'quantity', value: string) => {
    setIngredients(
      ingredients.map(ing => (ing.id === id ? { ...ing, [field]: value } : ing))
    );
  };

  return (
    <div className="p-4 md:p-6 bg-surface shadow-xl rounded-2xl">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <Button onClick={onBack} variant="ghost" size="icon" aria-label="Volver">
          <ArrowLeftIcon className="w-6 h-6" />
        </Button>
        <h2 className="text-xl sm:text-2xl font-semibold text-onSurface text-center flex-grow">
          Revisa tus Ingredientes
        </h2>
        <div className="w-10"> {/* Spacer for balance */}</div>
      </div>

      {uploadedImages && uploadedImages.length > 0 && (
        <div className="mb-6">
          <h3 className="text-md font-medium text-onSurface-light mb-2">Imágenes Analizadas:</h3>
          <div className="flex overflow-x-auto space-x-3 pb-2 items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
            {uploadedImages.map((src, idx) => (
              <img 
                key={idx} 
                src={src} 
                alt={`Ingrediente subido ${idx + 1}`} 
                className="h-24 w-auto object-contain rounded-md shadow-sm border border-gray-300 flex-shrink-0" 
              />
            ))}
          </div>
        </div>
      )}

      {isLoading && initialIngredients.length === 0 && (
         <div className="flex flex-col items-center text-center py-10 my-8">
            <LoadingSpinner size="large" />
            <p className="mt-4 text-onSurface-light text-lg">Analizando tus imágenes...</p>
            <p className="text-sm text-gray-500">Esto tomará solo un momento.</p>
         </div>
      )}

      {(!isLoading || initialIngredients.length > 0) && (
        <>
          {ingredients.length === 0 && !isLoading && (
            <div className="text-center py-10 my-8 bg-gray-50 rounded-lg">
                <PackageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-onSurface mb-2">Lista de Ingredientes Vacía</h3>
                <p className="text-onSurface-light mb-4">
                No se detectaron ingredientes o la lista está vacía. <br/>¡Añade algunos manualmente para empezar!
                </p>
            </div>
          )}
          {ingredients.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-onSurface mb-3">Ingredientes Detectados:</h3>
              <ul className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {ingredients.map((ingredient) => (
                  <li key={ingredient.id} className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 p-3 bg-gray-50 rounded-lg shadow-sm border border-gray-200 hover:border-primary-light transition-colors">
                    <input
                      type="text"
                      value={ingredient.name}
                      onChange={(e) => handleUpdateIngredient(ingredient.id, 'name', e.target.value)}
                      placeholder="Nombre del ingrediente"
                      className="flex-grow p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary transition-shadow bg-surface min-w-0"
                      aria-label={`Nombre del ingrediente ${ingredient.name}`}
                    />
                    <input
                      type="text"
                      value={ingredient.quantity}
                      onChange={(e) => handleUpdateIngredient(ingredient.id, 'quantity', e.target.value)}
                      placeholder="Cantidad (ej: 200g, 1 taza)"
                      className="sm:w-2/5 p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary transition-shadow bg-surface min-w-0"
                      aria-label={`Cantidad para ${ingredient.name}`}
                    />
                    <Button onClick={() => handleRemoveIngredient(ingredient.id)} variant="danger" size="medium" className="sm:w-auto w-full !p-2.5" aria-label={`Eliminar ${ingredient.name}`}>
                      <TrashIcon className="w-5 h-5" />
                      <span className="sm:hidden ml-2">Eliminar</span>
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-10 pt-6 border-t border-gray-200"> {/* Changed mt-8 to mt-10 */}
            <h3 className="text-lg font-semibold text-onSurface mb-4">Añadir Ingrediente Manualmente</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div className="md:col-span-2">
                <label htmlFor="newItemName" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Ingrediente</label>
                <input
                  id="newItemName"
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Ej: Tomates cherry"
                  className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary transition-shadow bg-surface"
                />
              </div>
               <div className="grid grid-cols-2 gap-2">
                 <div>
                    <label htmlFor="newItemQuantity" className="block text-sm font-medium text-gray-700 mb-1">Cant.</label>
                    <input
                    id="newItemQuantity"
                    type="text"
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(e.target.value)}
                    placeholder="Ej: 250"
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary transition-shadow bg-surface"
                    />
                 </div>
                 <div>
                    <label htmlFor="newItemUnit" className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                    <input
                    id="newItemUnit"
                    type="text"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    placeholder="Ej: gramos"
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary transition-shadow bg-surface"
                    />
                 </div>
               </div>
            </div>
            <Button onClick={handleAddIngredient} variant="secondary" className="mt-3 w-full md:w-auto" aria-label="Añadir ingrediente a la lista">
                <PlusCircleIcon className="w-5 h-5 mr-2" />
                Añadir a la lista
            </Button>
          </div>
        </>
      )}

      <div className="mt-10 pt-6 border-t border-gray-200 flex justify-end">
        <Button 
            onClick={() => onConfirm(ingredients)} 
            size="large" 
            disabled={isLoading || ingredients.length === 0}
            className="min-w-[180px] py-3 text-base"
        >
          {isLoading && ingredients.length > 0 ? <LoadingSpinner color="text-white" /> : <><CheckCircleIcon className="w-5 h-5 mr-2" /> Buscar Recetas</>}
        </Button>
      </div>
    </div>
  );
};