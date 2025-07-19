import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#3182CE',
    accent: '#38B2AC',
    background: '#F5F7FA',
    surface: '#FFFFFF',
    text: '#2D3748',
    placeholder: '#718096',
    disabled: '#A0AEC0',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    success: '#48BB78',
    warning: '#ED8936',
    error: '#E53E3E',
  },
  fonts: {
    ...DefaultTheme.fonts,
    regular: {
      fontFamily: 'System',
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500' as const,
    },
    bold: {
      fontFamily: 'System',
      fontWeight: 'bold' as const,
    },
  },
};