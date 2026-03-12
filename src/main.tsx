import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/globals.css"; // Sistema de design global
import "./lib/i18n"; // Importa as configurações do i18next

createRoot(document.getElementById("root")!).render(<App />);
