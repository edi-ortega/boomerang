import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getSupabaseClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Play, Users, Target, Filter } from "lucide-react";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";
import CreatePokerSessionModal from "@/components/poker/CreatePokerSessionModal";
import { format } from "date-fns";

interface PokerSession {
  id: string;
  name: string;
  status: 'waiting' | 'voting' | 'revealed' | 'completed';
  created_at: string;
  moderator_email: string;
  project_id: string;
  project_name?: string;
  sprint_id?: string;
  sprint_name?: string;
  active_participants: any;
  current_story_index: number;
}

export default function PlanningPoker() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentTenantId } = useTenant();
  const [sessions, setSessions] = useState<PokerSession[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const sprintId = searchParams.get("sprint");
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectIdForModal, setProjectIdForModal] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    
    // Set up realtime subscription for session updates
    const setupSubscription = async () => {
      const client = await getSupabaseClient();
      const channel = client
        .channel('poker-sessions-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'prj_planning_poker_session'
          },
          () => {
            loadData();
          }
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    };
    
    setupSubscription();
  }, [currentTenantId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Get current user from bmr_session
      const storedSession = localStorage.getItem("bmr_session");
      if (!storedSession) {
        toast.error("Usuário não autenticado");
        return;
      }
      const parsedSession = JSON.parse(storedSession);
      setCurrentUser(parsedSession.user);

      // Load sessions - filtrando diretamente no banco
      const client = await getSupabaseClient();
      const { data: sessionsData, error } = await client
        .from("prj_planning_poker_session")
        .select("*")
        .eq("client_id", currentTenantId)
        .neq("status", "completed")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setSessions((sessionsData || []) as PokerSession[]);

    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erro ao carregar sessões");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionCreated = async (data: any) => {
    try {
      const storedSession = localStorage.getItem("bmr_session");
      if (!storedSession) throw new Error("User not authenticated");
      
      const parsedSession = JSON.parse(storedSession);
      const user = parsedSession.user;

      // Buscar informações da sprint para obter o project_id e stories
      let projectId: string | null = null;
      let stories: any[] = [];
      
      if (sprintId) {
        const client1: any = await getSupabaseClient();
        const sprintResult = await client1
          .from("prj_sprint")
          .select("project_id")
          .eq("id", sprintId)
          .maybeSingle();
        
        if (sprintResult.error) {
          console.error("Error fetching sprint:", sprintResult.error);
          toast.error("Erro ao buscar informações da sprint");
          return;
        }
        
        if (sprintResult.data) {
          projectId = sprintResult.data.project_id as string;
        }

        // Buscar stories da sprint
        const storiesResult = await client1
          .from("prj_story")
          .select("id, title, description, story_points")
          .eq("sprint_id", sprintId)
          .eq("client_id", currentTenantId);
        
        if (storiesResult.error) {
          console.error("Error fetching stories:", storiesResult.error);
        } else if (storiesResult.data) {
          stories = storiesResult.data;
        }
      }

      // Buscar nomes dos participantes
      const client2: any = await getSupabaseClient();
      
      // Garantir que o moderador esteja nos participantes
      const allParticipantEmails = Array.from(new Set([...data.participants, data.moderatorEmail]));
      
      const { data: participantsData } = await client2
        .from("bmr_user")
        .select("email, name")
        .in("email", allParticipantEmails);

      const participantsWithNames = (participantsData || []).map((p: any) => ({
        email: p.email,
        name: p.name || p.email
      }));

      // Buscar nome do moderador
      const moderatorInfo = participantsWithNames.find(p => p.email === data.moderatorEmail);
      const moderatorName = moderatorInfo?.name || data.moderatorEmail;

      const sessionResult = await client2
        .from("prj_planning_poker_session")
        .insert([{
          name: data.name || "Nova Sessão",
          client_id: currentTenantId,
          moderator_email: data.moderatorEmail,
          moderator_name: moderatorName,
          participants: participantsWithNames,
          active_participants: [],
          project_id: projectId,
          sprint_id: sprintId,
          status: 'waiting',
          current_story_index: 0,
          complexity_type: 'fibonacci',
          stories: stories
        }])
        .select()
        .maybeSingle();

      if (sessionResult.error) throw sessionResult.error;
      if (!sessionResult.data) throw new Error("Failed to create session");

      toast.success("Sessão criada com sucesso!");
      setShowCreateModal(false);
      navigate(`/planning-poker/${sessionResult.data.id}`);
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("Erro ao criar sessão");
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      waiting: "bg-muted text-muted-foreground",
      voting: "bg-blue-500/20 text-blue-600",
      revealed: "bg-yellow-500/20 text-yellow-600",
      completed: "bg-green-500/20 text-green-600"
    };
    return colors[status] || colors.waiting;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      waiting: "Aguardando",
      voting: "Em Votação",
      revealed: "Revelado",
      completed: "Concluído"
    };
    return labels[status] || status;
  };

  const getParticipantCount = (activeParticipants: any) => {
    if (Array.isArray(activeParticipants)) {
      return activeParticipants.length;
    }
    return 0;
  };

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch = session.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.project_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || session.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Target className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando sessões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Target className="w-8 h-8 text-primary" />
            Planning Poker
          </h1>
          <p className="text-muted-foreground mt-1">
            Estime histórias em equipe com Planning Poker
          </p>
        </div>
        <Button 
          onClick={async () => {
            if (sprintId) {
              const client = await getSupabaseClient();
              const { data } = await client
                .from("prj_sprint")
                .select("project_id")
                .eq("id", sprintId)
                .maybeSingle();
              setProjectIdForModal(data?.project_id || null);
            }
            setShowCreateModal(true);
          }} 
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Sessão
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              placeholder="Buscar por nome ou projeto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-background"
            />

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="waiting">Aguardando</SelectItem>
                <SelectItem value="voting">Em Votação</SelectItem>
                <SelectItem value="revealed">Revelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Grid */}
      {filteredSessions.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((session) => (
            <Card
              key={session.id}
              className="border-border bg-card hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => navigate(`/planning-poker/${session.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="text-foreground text-lg">{session.name}</CardTitle>
                  <Badge className={getStatusColor(session.status)}>
                    {getStatusLabel(session.status)}
                  </Badge>
                </div>
                {session.project_name && (
                  <p className="text-sm text-muted-foreground">{session.project_name}</p>
                )}
                {session.sprint_name && (
                  <p className="text-xs text-muted-foreground">Sprint: {session.sprint_name}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{getParticipantCount(session.active_participants)} participantes</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/planning-poker/${session.id}`);
            }}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Entrar
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  Criado em {format(new Date(session.created_at), "dd/MM/yyyy HH:mm")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma sessão ativa
            </h3>
            <p className="text-muted-foreground mb-4">
              Crie uma nova sessão de Planning Poker para começar a estimar histórias
            </p>
            <Button 
              onClick={async () => {
                if (sprintId) {
                  const client = await getSupabaseClient();
                  const { data } = await client
                    .from("prj_sprint")
                    .select("project_id")
                    .eq("id", sprintId)
                    .maybeSingle();
                  setProjectIdForModal(data?.project_id || null);
                }
                setShowCreateModal(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Sessão
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Session Modal */}
      {showCreateModal && (
      <CreatePokerSessionModal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setProjectIdForModal(null);
        }}
        onSubmit={handleSessionCreated}
        projectId={projectIdForModal}
      />
      )}
    </div>
  );
}
