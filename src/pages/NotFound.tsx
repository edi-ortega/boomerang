import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <AlertCircle className="w-24 h-24 mx-auto text-muted-foreground" />
        <h1 className="text-4xl font-bold text-foreground">404</h1>
        <p className="text-xl text-muted-foreground">Página não encontrada</p>
        <Button onClick={() => navigate("/dashboard")}>
          Voltar ao Dashboard
        </Button>
      </div>
    </div>
  );
}
