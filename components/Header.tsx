import React from 'react';
import { AppLogoIcon } from './icons/Icons'; // Changed from ChefHatIcon

interface HeaderProps {
  // This component no longer accepts props for navigation.
}

export const Header: React.FC<HeaderProps> = () => {
  return (
    <header className="bg-primary shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between pt-10 pb-5">
            <div 
            className="flex items-center"
            aria-label="FoodSnap logo"
            >
            <AppLogoIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white mr-2.5" />
            <h1 className="text-xl sm:text-2xl font-semibold text-white">FoodSnap</h1>
            </div>
            {/* Future navigation items can go here. Example:
            <nav className="flex space-x-4">
                <a href="#" className="text-primary-light hover:text-white px-3 py-2 rounded-md text-sm font-medium">Descubrir</a>
                <a href="#" className="text-primary-light hover:text-white px-3 py-2 rounded-md text-sm font-medium">Mis Recetas</a>
            </nav>
            */}
        </div>
      </div>
    </header>
  );
};