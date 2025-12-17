/**
 * ShadowTalk Design System
 * Minimal Classical Theme
 */

export const designTokens = {
  // Color Palette - Minimal & Classical
  colors: {
    // Neutrals - Sophisticated grays
    primary: '#1a1a1a',        // Deep charcoal
    secondary: '#2d2d2d',      // Dark gray
    background: '#fafafa',     // Off-white
    surface: '#ffffff',        // Pure white
    
    // Text colors
    textPrimary: '#1a1a1a',    // Primary text
    textSecondary: '#6b6b6b',  // Secondary text
    textTertiary: '#9e9e9e',   // Tertiary text
    
    // Accent - Subtle and elegant
    accent: '#4a5568',         // Slate gray
    accentHover: '#2d3748',    // Darker slate
    
    // Status colors - Muted
    success: '#48bb78',
    error: '#f56565',
    warning: '#ed8936',
    info: '#4299e1',
    
    // Borders
    border: '#e5e5e5',
    borderLight: '#f0f0f0',
    
    // Shadows
    shadowLight: 'rgba(0, 0, 0, 0.04)',
    shadowMedium: 'rgba(0, 0, 0, 0.08)',
    shadowStrong: 'rgba(0, 0, 0, 0.12)',
  },

  // Typography - Classical serif with modern sans-serif
  typography: {
    fontFamilySerif: '"Crimson Text", "Georgia", serif',
    fontFamilySans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontFamilyMono: '"JetBrains Mono", "Courier New", monospace',
    
    // Font sizes
    fontSizeXs: '0.75rem',     // 12px
    fontSizeSm: '0.875rem',    // 14px
    fontSizeBase: '1rem',      // 16px
    fontSizeMd: '1.125rem',    // 18px
    fontSizeLg: '1.25rem',     // 20px
    fontSizeXl: '1.5rem',      // 24px
    fontSize2Xl: '2rem',       // 32px
    fontSize3Xl: '2.5rem',     // 40px
    
    // Font weights
    fontWeightNormal: 400,
    fontWeightMedium: 500,
    fontWeightSemibold: 600,
    fontWeightBold: 700,
    
    // Line heights
    lineHeightTight: 1.25,
    lineHeightNormal: 1.5,
    lineHeightRelaxed: 1.75,
  },

  // Spacing - Consistent scale
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
  },

  // Borders & Radius
  borders: {
    radiusNone: '0',
    radiusSm: '0.25rem',   // 4px
    radiusMd: '0.5rem',    // 8px
    radiusLg: '0.75rem',   // 12px
    radiusXl: '1rem',      // 16px
    radiusFull: '9999px',  // Full rounded
    
    widthThin: '1px',
    widthMedium: '2px',
    widthThick: '3px',
  },

  // Shadows - Subtle elevations
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
    md: '0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    lg: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
    xl: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    '2xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  },

  // Transitions
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Z-index layers
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
};

export default designTokens;
