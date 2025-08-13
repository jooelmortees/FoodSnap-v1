import React from 'react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-gray-900 text-gray-400 py-8 text-center">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-sm mb-1">
          &copy; {currentYear} FoodSnap. Todos los derechos reservados.
        </p>
        <p className="text-xs">
          Cocina inteligentemente, desperdicia menos.
        </p>
      </div>
    </footer>
  );
};
