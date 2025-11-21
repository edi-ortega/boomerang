import { useState, useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, GripVertical, Save, X, Columns, Edit } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useConfirm } from "@/hooks/use-confirm";
import { getCurrentTenantId } from "@/lib/tenant-helper";
import { ViewToggle } from "@/components/ViewToggle";
import { useViewModeStore } from "@/stores/viewModeStore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Column {
  id: string;
  name: string;
  color: string;
  order: number;
  is_initial: boolean;
  is_final: boolean;
  wip_limit: number | null;
  status?: string;
}

interface Board {
  id?: string;
  name: string;
  description: string;
  columns: Column[];
  is_default: boolean;
  is_active: boolean;
  project_id?: string;
  client_id?: string;
}

export default function BoardManagement() {
  const { confirm, ConfirmDialog } = useConfirm();
  const { viewMode } = useViewModeStore();
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    setIsLoading(true);
    try {
      const tenantId = await getCurrentTenantId();
      const supabase = await getSupabaseClient();
      
      // Ensure session is set for RLS
      const storedSession = localStorage.getItem("bmr_session");
      if (storedSession) {
        const parsedSession = JSON.parse(storedSession);
        const userId = parsedSession.user?.user_id;
        if (userId) {
          await supabase.rpc('set_session_user_id', { p_user_id: userId });
        }
      }
      
      const { data, error } = await (supabase as any)
        .from('prj_board')
        .select('*')
        .eq('client_id', tenantId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setBoards(data || []);
    } catch (error) {
      console.error("Error loading boards:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBoard = () => {
    setEditingBoard({
      name: "",
      description: "",
      columns: [
        { id: "col-1", name: "Backlog", color: "#6b7280", order: 0, is_initial: true, is_final: false, wip_limit: null },
        { id: "col-2", name: "A Fazer", color: "#3b82f6", order: 1, is_initial: false, is_final: false, wip_limit: null },
        { id: "col-3", name: "Em Progresso", color: "#f59e0b", order: 2, is_initial: false, is_final: false, wip_limit: 3 },
        { id: "col-4", name: "Concluído", color: "#10b981", order: 3, is_initial: false, is_final: true, wip_limit: null }
      ],
      is_default: false,
      is_active: true
    });
    setShowForm(true);
  };

  const handleEditBoard = (board: Board) => {
    setEditingBoard({ ...board });
    setShowForm(true);
  };

  const handleDeleteBoard = async (boardId: string) => {
    const confirmed = await confirm({
      title: "Confirmar exclusão",
      description: "Tem certeza que deseja excluir este board? Esta ação não pode ser desfeita.",
      confirmText: "Excluir",
      cancelText: "Cancelar"
    });

    if (!confirmed) return;

    try {
      const supabase = await getSupabaseClient();
      
      // Ensure session is set for RLS
      const storedSession = localStorage.getItem("bmr_session");
      if (storedSession) {
        const parsedSession = JSON.parse(storedSession);
        const userId = parsedSession.user?.user_id;
        if (userId) {
          await supabase.rpc('set_session_user_id', { p_user_id: userId });
        }
      }
      
      const { error } = await (supabase as any)
        .from('prj_board')
        .delete()
        .eq('id', boardId);
      
      if (error) throw error;
      toast.success("Board excluído com sucesso!");
      loadBoards();
    } catch (error) {
      console.error("Error deleting board:", error);
      toast.error("Erro ao excluir board");
    }
  };

  const handleSaveBoard = async () => {
    if (!editingBoard || !editingBoard.name || editingBoard.columns.length === 0) {
      toast.error("Preencha o nome e adicione pelo menos uma coluna");
      return;
    }

    try {
      const tenantId = await getCurrentTenantId();
      const supabase = await getSupabaseClient();
      
      // Ensure session is set for RLS
      const storedSession = localStorage.getItem("bmr_session");
      if (storedSession) {
        const parsedSession = JSON.parse(storedSession);
        const userId = parsedSession.user?.user_id;
        if (userId) {
          await supabase.rpc('set_session_user_id', { p_user_id: userId });
        }
      }
      
      const boardData = {
        name: editingBoard.name,
        description: editingBoard.description || null,
        client_id: tenantId,
        is_default: editingBoard.is_default,
        is_active: editingBoard.is_active,
        columns: editingBoard.columns.map((col, idx) => ({
          ...col,
          order: idx,
          id: col.id || `col-${Date.now()}-${idx}`
        }))
      };
      
      if (editingBoard.id) {
        const { error } = await (supabase as any)
          .from('prj_board')
          .update(boardData)
          .eq('id', editingBoard.id);
        
        if (error) throw error;
        toast.success("Board atualizado com sucesso!");
      } else {
        const { error } = await (supabase as any)
          .from('prj_board')
          .insert(boardData);
        
        if (error) throw error;
        toast.success("Board criado com sucesso!");
      }

      setShowForm(false);
      setEditingBoard(null);
      loadBoards();
    } catch (error) {
      console.error("Error saving board:", error);
      toast.error("Erro ao salvar board");
    }
  };

  const handleAddColumn = () => {
    if (!editingBoard) return;
    
    const newColumn: Column = {
      id: `col-${Date.now()}`,
      name: "Nova Coluna",
      color: "#6b7280",
      order: editingBoard.columns.length,
      is_initial: false,
      is_final: false,
      wip_limit: null
    };
    setEditingBoard({
      ...editingBoard,
      columns: [...editingBoard.columns, newColumn]
    });
  };

  const handleRemoveColumn = (columnId: string) => {
    if (!editingBoard) return;
    
    setEditingBoard({
      ...editingBoard,
      columns: editingBoard.columns.filter(c => c.id !== columnId)
    });
  };

  const handleColumnChange = (columnId: string, field: keyof Column, value: any) => {
    if (!editingBoard) return;
    
    setEditingBoard({
      ...editingBoard,
      columns: editingBoard.columns.map(c =>
        c.id === columnId ? { ...c, [field]: value } : c
      )
    });
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination || !editingBoard) return;

    const items = Array.from(editingBoard.columns);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setEditingBoard({
      ...editingBoard,
      columns: items.map((col, idx) => ({ ...col, order: idx }))
    });
  };

  return (
    <>
    <div className="min-h-screen p-4 md:p-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestão de Boards</h1>
            <p className="text-muted-foreground">Configure os boards com colunas customizadas</p>
          </div>
          <div className="flex items-center gap-3">
            <ViewToggle />
            <Button onClick={handleCreateBoard}>
              <Plus className="w-5 h-5 mr-2" />
              Novo Board
            </Button>
          </div>
        </div>

        {showForm && editingBoard && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">
                  {editingBoard.id ? "Editar Board" : "Novo Board"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Nome do Board *
                    </label>
                    <Input
                      value={editingBoard.name}
                      onChange={(e) => setEditingBoard({ ...editingBoard, name: e.target.value })}
                      placeholder="Ex: Board Principal"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Descrição
                    </label>
                    <Textarea
                      value={editingBoard.description}
                      onChange={(e) => setEditingBoard({ ...editingBoard, description: e.target.value })}
                      placeholder="Descrição opcional"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-medium text-foreground">
                      Colunas do Board *
                    </label>
                    <Button onClick={handleAddColumn} size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Coluna
                    </Button>
                  </div>

                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="columns">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-3"
                        >
                          {editingBoard.columns.map((column, index) => (
                            <Draggable key={column.id} draggableId={column.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className="p-4 border border-border rounded-lg bg-accent/50"
                                >
                                  <div className="flex items-start gap-3">
                                    <div {...provided.dragHandleProps} className="mt-2 cursor-grab">
                                      <GripVertical className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                    
                                    <div className="flex-1 space-y-3">
                                      <div className="grid md:grid-cols-3 gap-3">
                                        <Input
                                          value={column.name}
                                          onChange={(e) => handleColumnChange(column.id, 'name', e.target.value)}
                                          placeholder="Nome da coluna"
                                        />
                                        <Input
                                          type="color"
                                          value={column.color}
                                          onChange={(e) => handleColumnChange(column.id, 'color', e.target.value)}
                                        />
                                        <Input
                                          type="number"
                                          value={column.wip_limit || ''}
                                          onChange={(e) => handleColumnChange(column.id, 'wip_limit', e.target.value ? parseInt(e.target.value) : null)}
                                          placeholder="Limite WIP"
                                        />
                                      </div>
                                    </div>

                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => handleRemoveColumn(column.id)}
                                      disabled={editingBoard.columns.length <= 1}
                                      className="border-red-500/50 hover:bg-red-500/10 text-red-400"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingBoard(null);
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveBoard}>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Board
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {isLoading ? (
          <p className="text-center text-muted-foreground">Carregando...</p>
        ) : boards.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Columns className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhum board cadastrado
              </h3>
              <p className="text-sm text-muted-foreground mb-4 text-center">
                Crie seu primeiro board para organizar o fluxo de trabalho do seu projeto
              </p>
              <Button onClick={handleCreateBoard}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Board
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid md:grid-cols-2 gap-6">
            {boards.map((board) => (
              <motion.div
                key={board.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-border bg-card hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-foreground">{board.name}</CardTitle>
                        {board.description && (
                          <p className="text-sm text-muted-foreground mt-1">{board.description}</p>
                        )}
                      </div>
                      {board.is_default && (
                        <Badge variant="outline">Padrão</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-4">
                      <Columns className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {board.columns.length} colunas
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {board.columns.slice(0, 4).map((col) => (
                        <Badge 
                          key={col.id} 
                          variant="outline"
                          style={{ backgroundColor: `${col.color}20`, borderColor: col.color }}
                        >
                          {col.name}
                        </Badge>
                      ))}
                      {board.columns.length > 4 && (
                        <Badge variant="outline">+{board.columns.length - 4}</Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditBoard(board)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => board.id && handleDeleteBoard(board.id)}
                        disabled={board.is_default}
                        className="border-red-500/50 hover:bg-red-500/10 text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Colunas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {boards.map((board) => (
                  <TableRow key={board.id}>
                    <TableCell className="font-medium">{board.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {board.description || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Columns className="w-4 h-4 text-muted-foreground" />
                        <span>{board.columns.length}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {board.is_default ? (
                        <Badge variant="outline">Padrão</Badge>
                      ) : (
                        <Badge variant="secondary">Ativo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditBoard(board)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => board.id && handleDeleteBoard(board.id)}
                          disabled={board.is_default}
                          className="border-red-500/50 hover:bg-red-500/10 text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
    <ConfirmDialog />
  </>
  );
}
