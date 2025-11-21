import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from "lucide-react";

export default function DataMigration() {
  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Database className="w-8 h-8 text-primary" />
            Migração de Dados
          </h1>
          <p className="text-muted-foreground">Ferramenta de migração de dados</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Migração de Dados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Ferramenta de migração em desenvolvimento
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
