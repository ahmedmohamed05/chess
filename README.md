# Chess Application

A modern, interactive chess game built with React, TypeScript, and Vite. This application provides a complete chess playing experience with a clean, responsive UI.

## Features

- Interactive chess board with drag-and-drop piece movement
- Game state management
- Move validation
- Responsive design using Tailwind CSS
- Type-safe implementation with TypeScript

## Project Structure

```
src/
├── components/       # Reusable React components
├── hooks/           # Custom React hooks
├── utils/           # Utility functions and helpers
├── App.tsx          # Main application component
├── app.css          # Global styles
├── constants.ts     # Game constants and configurations
├── main.tsx         # Application entry point
├── types.ts         # TypeScript type definitions
└── vite-env.d.ts    # Vite environment type declarations
```

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd chess
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint for code quality checks

## Technologies Used

- [React](https://reactjs.org/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Vite](https://vitejs.dev/) - Build tool and development server
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [ESLint](https://eslint.org/) - Code linting

## Development

### Code Style

This project uses ESLint for code linting. Run the following command to check for linting errors:

```bash
npm run lint
```

### Type Checking

TypeScript provides static type checking. The project is configured with strict type checking enabled.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
