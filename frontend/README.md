# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Nisova Learning API

The frontend uses `VITE_API_BASE_URL` as the API base URL. For local development,
the default is `http://localhost:5000/api`. Set the Vite variable to another
trusted API origin when deploying, for example through the hosting platform's
frontend build configuration. This value is a public API URL, not a secret.

Authenticated requests use the browser's HttpOnly authentication cookie through
`credentials: "include"`. Configure the backend's trusted CORS origin to match
the frontend origin.

Run `npm test` for the built-in Node tests, `npm run lint` for ESLint, and
`npm run build` for a production build.
