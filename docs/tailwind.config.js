/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './**/*.html',
    './_layouts/**/*.html',
    './_posts/**/*.md',
    './*.html',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}
