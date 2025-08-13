import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'small' | 'medium' | 'large' | 'icon';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  className = '',
  ...props
}) => {
  const baseStyle = "font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 ease-in-out shadow-sm hover:shadow-md";

  let variantStyle = '';
  switch (variant) {
    case 'primary':
      variantStyle = 'bg-primary text-white hover:bg-primary-dark focus:ring-primary';
      break;
    case 'secondary':
      variantStyle = 'bg-secondary text-white hover:bg-secondary-dark focus:ring-secondary';
      break;
    case 'danger':
      variantStyle = 'bg-error text-white hover:bg-red-700 focus:ring-error';
      break;
    case 'ghost':
      variantStyle = 'bg-transparent text-primary hover:bg-primary/10 focus:ring-primary shadow-none hover:shadow-none';
      break;
    case 'outline':
      variantStyle = 'bg-transparent text-primary border border-primary hover:bg-primary/5 focus:ring-primary shadow-none hover:shadow-none';
      if (props.disabled) { // Special handling for disabled outline
        variantStyle = 'bg-transparent text-gray-400 border border-gray-300 shadow-none hover:shadow-none';
      }
      break;
  }

  let sizeStyle = '';
  switch (size) {
    case 'small':
      sizeStyle = 'px-3 py-1.5 text-xs'; // Adjusted padding
      break;
    case 'medium':
      sizeStyle = 'px-5 py-2.5 text-sm'; // Adjusted padding
      break;
    case 'large':
      sizeStyle = 'px-6 py-3 text-base';
      break;
    case 'icon':
      sizeStyle = 'p-2.5'; // Adjusted padding for icon buttons
      break;
  }

  return (
    <button
      className={`${baseStyle} ${variantStyle} ${sizeStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
