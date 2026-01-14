/** @type {import('tailwindcss').Config} */
const plugin = require("tailwindcss/plugin");

module.exports = {
  content: ["./App.tsx", "./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  corePlugins: {
    space: false,
  },
  theme: {
    extend: {
      colors: {
        // Palette chaleureuse et accueillante pour seniors
        primary: {
          DEFAULT: "#2563EB",    // Bleu confiance
          light: "#DBEAFE",
          dark: "#1D4ED8",
          50: "#EFF6FF",
          100: "#DBEAFE",
          500: "#2563EB",
          600: "#1D4ED8",
          700: "#1E40AF",
        },
        // Accents chaleureux
        coral: {
          DEFAULT: "#F97316",    // Orange corail vivant
          light: "#FFF7ED",
          dark: "#EA580C",
        },
        sage: {
          DEFAULT: "#059669",    // Vert sage apaisant
          light: "#ECFDF5",
          dark: "#047857",
        },
        plum: {
          DEFAULT: "#7C3AED",    // Violet prune élégant
          light: "#F5F3FF",
          dark: "#6D28D9",
        },
        rose: {
          DEFAULT: "#EC4899",    // Rose chaleureux
          light: "#FDF2F8",
          dark: "#DB2777",
        },
        // Couleurs d'urgence améliorées
        success: {
          DEFAULT: "#10B981",
          light: "#D1FAE5",
          dark: "#059669",
        },
        warning: {
          DEFAULT: "#F59E0B",
          light: "#FEF3C7",
          dark: "#D97706",
        },
        danger: {
          DEFAULT: "#EF4444",
          light: "#FEE2E2",
          dark: "#DC2626",
        },
        // Neutres chaleureux
        background: "#FFFBF5",     // Crème subtil
        surface: "#FFFFFF",
        "surface-warm": "#FEF7ED", // Surface chaude
        "text-primary": "#1F2937",
        "text-secondary": "#6B7280",
        "text-muted": "#9CA3AF",
        border: "#E5E7EB",
        "border-light": "#F3F4F6",
      },
      fontSize: {
        xs: "12px",
        sm: "14px",
        base: "16px",      // Plus grand pour seniors
        lg: "18px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "30px",
        "4xl": "36px",
        "5xl": "48px",
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        'soft': '0 4px 20px -4px rgba(0, 0, 0, 0.08)',
        'medium': '0 8px 30px -8px rgba(0, 0, 0, 0.12)',
        'strong': '0 12px 40px -12px rgba(0, 0, 0, 0.15)',
        'glow-primary': '0 8px 30px -8px rgba(37, 99, 235, 0.4)',
        'glow-coral': '0 8px 30px -8px rgba(249, 115, 22, 0.4)',
        'glow-sage': '0 8px 30px -8px rgba(5, 150, 105, 0.4)',
      },
    },
  },
  darkMode: "class",
  plugins: [
    plugin(({ matchUtilities, theme }) => {
      const spacing = theme("spacing");
      matchUtilities(
        { space: (value) => ({ gap: value }) },
        { values: spacing, type: ["length", "number", "percentage"] }
      );
      matchUtilities(
        { "space-x": (value) => ({ columnGap: value }) },
        { values: spacing, type: ["length", "number", "percentage"] }
      );
      matchUtilities(
        { "space-y": (value) => ({ rowGap: value }) },
        { values: spacing, type: ["length", "number", "percentage"] }
      );
    }),
  ],
};
