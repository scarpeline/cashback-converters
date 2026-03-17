// i18n deve ser inicializado antes de qualquer componente React
import "./i18n/config";

// Verificar configuração do Supabase
import { initSupabaseCheck } from "./lib/supabase-init-check";
initSupabaseCheck();

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
