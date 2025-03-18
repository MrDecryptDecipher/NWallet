export interface Theme {
  primary: string;
  secondary: string;
  background: string;
  text: string;
}

export const lightTheme: Theme = {
  primary: '#8E44AD',    // Purpureus (purple)
  secondary: '#E74C3C',  // Carmine Pink
  background: '#F5F5F7', // Light background
  text: '#1A1B27',       // Dark text
};

export const darkTheme: Theme = {
  primary: '#8E44AD',    // Purpureus (purple)
  secondary: '#E74C3C',  // Carmine Pink
  background: '#1A1B27', // Dark background
  text: '#F5F5F7',       // Light text
};
