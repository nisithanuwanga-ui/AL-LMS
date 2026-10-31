import AppRoutes from "./Routes/AppRoutes";
import { LanguageProvider } from "./contexts/LanguageProvider";
import { ThemeProvider } from "./contexts/ThemeProvider";

function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AppRoutes />
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;