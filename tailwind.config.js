/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Rajdhani', 'system-ui', 'sans-serif'],
        mono: ['"Share Tech Mono"', 'monospace'],
      },
      colors: {
        val: {
          bg:       '#0F1923',
          surface:  '#1F2731',
          surface2: '#2B3541',
          border:   '#3D4956',
          red:      '#FF4655',
          'red-dim':'#7B1E26',
          gold:     '#F6B73C',
          text:     '#ECE8E1',
          muted:    '#768079',
          green:    '#3FB549',
          'green-dim': '#1A3D1D',
        },
      },
      letterSpacing: {
        widest2: '0.25em',
      },
    },
  },
  plugins: [],
}
