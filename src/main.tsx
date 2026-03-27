// i18n deve ser inicializado antes de qualquer componente React
import "./i18n/config";

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/globals.css"; // Sistema de design global

createRoot(document.getElementById("root")!).render(<App />);
