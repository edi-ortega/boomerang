import { useState, useEffect } from "react";
import { bmr } from "@/api/boomerangClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download, FileText, AlertCircle, CheckCircle, Database } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { useTenantId } from "@/contexts/TenantContext";

export default function DataImportSection() {
  const { toast } = useToast();
  const tenantId = useTenantId();
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [selectedEntity, setSelectedEntity] = useState("");

  const availableEntities = [
    { id: "Project", name: "Projetos", description: "Importar projetos" },
    { id: "Task", name: "Tarefas", description: "Importar tarefas" },
    { id: "Story", name: "Histórias", description: "Importar user stories" },
    { id: "Epic", name: "Épicos", description: "Importar épicos" },
    { id: "Feature", name: "Funcionalidades", description: "Importar features" },
    { id: "Sprint", name: "Sprints", description: "Importar sprints" },
    { id: "Board", name: "Boards", description: "Importar boards Kanban" },
    { id: "Team", name: "Times", description: "Importar times" },
    { id: "Holiday", name: "Feriados", description: "Importar feriados" },
    { id: "ProjectCategory", name: "Categorias de Projeto", description: "Importar categorias" },
    { id: "UserType", name: "Tipos de Usuário", description: "Importar tipos de usuário" },
    { id: "StoryType", name: "Tipos de História", description: "Importar tipos de história" },
    { id: "TaskType", name: "Tipos de Tarefa", description: "Importar tipos de tarefa" }
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedEntity) {
      toast({
        title: "Selecione uma entidade",
        description: "Por favor, selecione qual entidade deseja importar.",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      toast({
        title: "Importando dados",
        description: `Processando arquivo ${file.name}...`,
      });

      // Simulate import process
      await new Promise(resolve => setTimeout(resolve, 2000));

      setImportResult({
        success: true,
        imported: 0,
        failed: 0,
        entity: selectedEntity
      });

      toast({
        title: "Importação concluída!",
        description: `Os dados de ${selectedEntity} foram importados com sucesso.`,
      });
    } catch (error) {
      console.error("Error importing data:", error);
      toast({
        title: "Erro na importação",
        description: "Não foi possível importar os dados.",
        variant: "destructive"
      });
      setImportResult({
        success: false,
        error: "Erro ao processar arquivo"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    toast({
      title: "Download iniciado",
      description: "O template será baixado em breve.",
    });
  };

  return (
    <Card className="glass-effect border-border">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
            <Database className="w-5 h-5 text-primary" />
          </div>
          <CardTitle className="text-foreground">Importação de Dados</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Importe dados de arquivos CSV, XLSX ou XLS para o sistema
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Entidade</label>
            <Select value={selectedEntity} onValueChange={setSelectedEntity}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a entidade para importar" />
              </SelectTrigger>
              <SelectContent>
                {availableEntities.map((entity) => (
                  <SelectItem key={entity.id} value={entity.id}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{entity.name}</span>
                      <span className="text-xs text-muted-foreground">{entity.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={downloadTemplate}
              disabled={!selectedEntity}
            >
              <Download className="mr-2 h-4 w-4" />
              Baixar Template
            </Button>

            <label htmlFor="file-upload">
              <Button
                variant="default"
                disabled={!selectedEntity || isImporting}
                asChild
              >
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  {isImporting ? "Importando..." : "Importar Arquivo"}
                </span>
              </Button>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                disabled={!selectedEntity || isImporting}
              />
            </label>
          </div>
        </div>

        {importResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 border border-border rounded-lg bg-accent/30"
          >
            {importResult.success ? (
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-green-500">Importação Concluída</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {importResult.imported} registros importados com sucesso
                  </p>
                  {importResult.failed > 0 && (
                    <p className="text-sm text-yellow-600 mt-1">
                      {importResult.failed} registros com falha
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-destructive">Erro na Importação</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {importResult.error}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        <div className="rounded-lg bg-accent/30 border border-border p-4 space-y-2">
          <h4 className="font-medium text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Formatos Suportados
          </h4>
          <div className="flex gap-2">
            <Badge variant="secondary">CSV</Badge>
            <Badge variant="secondary">XLSX</Badge>
            <Badge variant="secondary">XLS</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Baixe o template correspondente à entidade selecionada para garantir a compatibilidade dos dados.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
