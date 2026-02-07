import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, AlertCircle } from "lucide-react";
import logo from "@/assets/logo.png";

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md space-y-6">
        {/* Logo */}
        <img src={logo} alt="SalãoCashBack" className="w-20 h-20 mx-auto opacity-50" />
        
        {/* Error Icon */}
        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto">
          <AlertCircle className="w-12 h-12 text-muted-foreground" />
        </div>
        
        {/* Error Text */}
        <div className="space-y-2">
          <h1 className="font-display text-4xl font-bold">404</h1>
          <h2 className="font-display text-xl font-semibold text-muted-foreground">
            Página não encontrada
          </h2>
        </div>
        
        {/* Description */}
        <p className="text-muted-foreground">
          Não foi possível carregar esta página.
          <br />
          Você pode voltar ao início ou fazer login novamente.
        </p>
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" asChild>
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Página Inicial
            </Link>
          </Button>
          <Button variant="gold" asChild>
            <Link to="/public/login">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Fazer Login
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
