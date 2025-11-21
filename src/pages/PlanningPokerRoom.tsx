import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getSupabaseClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Eye, 
  RotateCcw, 
  CheckCircle, 
  Users, 
  Target, 
  Crown, 
  SkipForward, 
  LogOut,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/TenantContext";
import PokerCard from "@/components/poker/PokerCard";
import PokerSummaryModal from "@/components/poker/PokerSummaryModal";

interface Vote {
  id: string;
  voter_email: string;
  voter_name: string;
  vote_value: string;
}

interface Story {
  id: string;
  title: string;
  description?: string;
  story_points?: string;
}

interface Participant {
  email: string;
  name: string;
  avatar_url?: string;
}

interface PokerSession {
  id: string;
  name: string;
  status: 'waiting' | 'voting' | 'revealed' | 'completed';
  moderator_email: string;
  moderator_name: string;
  current_story_index: number;
  active_participants: string[];
  participants?: Participant[];
  complexity_type: string;
  stories: Story[];
}

export default function PlanningPokerRoom() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id") || window.location.pathname.split("/").pop();
  const { currentTenantId } = useTenant();
  
  const [session, setSession] = useState<PokerSession | null>(null);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [complexityOptions, setComplexityOptions] = useState<string[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Load complexity options when session loads or status changes to voting
  useEffect(() => {
    if (session?.complexity_type) {
      console.log("Loading complexity options - session.complexity_type changed:", session.complexity_type, "status:", session.status);
      loadComplexityOptions(session.complexity_type);
    }
  }, [session?.complexity_type]);

  // Also reload when status changes to voting to ensure cards are available
  useEffect(() => {
    if (session?.status === 'voting' && session?.complexity_type && complexityOptions.length === 0) {
      console.log("Status changed to voting - reloading complexity options");
      loadComplexityOptions(session.complexity_type);
    }
  }, [session?.status]);

  const loadComplexityOptions = async (complexityType: string) => {
    setLoadingOptions(true);
    try {
      let options: string[] = [];
      
      switch (complexityType) {
        case 'fibonacci':
          options = ["1", "2", "3", "5", "8", "13", "21", "?"];
          break;
        case 'tshirt':
          options = ["XS", "S", "M", "L", "XL", "XXL", "?"];
          break;
        case 'linear':
          options = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "?"];
          break;
        default:
          // Custom complexity - load from database filtering by client_id
          const storedSession = localStorage.getItem("bmr_session");
          if (storedSession) {
            const parsedSession = JSON.parse(storedSession);
            const clientId = parsedSession.user?.client_id;
            
            console.log("Loading custom complexity for client:", clientId, "type:", complexityType);
            
            if (clientId) {
              const { data: customSettings, error } = await supabase
                .from("prj_custom_complexity_setting")
                .select("setting_value")
                .eq("complexity_type_id", complexityType)
                .eq("client_id", clientId)
                .maybeSingle();
              
              console.log("Custom complexity settings:", customSettings, "error:", error);
              
              if (customSettings?.setting_value) {
                // Split the comma-separated values
                options = customSettings.setting_value.split(',').map(v => v.trim());
                options.push("?");
              } else {
                // Fallback to fibonacci if custom not found
                options = ["1", "2", "3", "5", "8", "13", "21", "?"];
              }
            } else {
              // Fallback if no client_id
              options = ["1", "2", "3", "5", "8", "13", "21", "?"];
            }
          } else {
            // Fallback if no session
            options = ["1", "2", "3", "5", "8", "13", "21", "?"];
          }
      }
      
      console.log("Loaded complexity options:", options);
      setComplexityOptions(options);
    } catch (error) {
      console.error("Error loading complexity options:", error);
      // Fallback to fibonacci
      setComplexityOptions(["1", "2", "3", "5", "8", "13", "21", "?"]);
    } finally {
      setLoadingOptions(false);
    }
  };

  // Load initial data and setup real-time updates
  useEffect(() => {
    if (!id) return;

    loadData(true); // Show loading only on first load
    
    // Setup real-time subscription for session updates
    const channel = supabase
      .channel('poker-session-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prj_planning_poker_session',
          filter: `id=eq.${id}`
        },
        (payload) => {
          // Reload data when session changes (without loading state)
          loadData(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  // Load votes when current story changes
  useEffect(() => {
    if (currentStory?.id) {
      loadVotes();
      
      // Setup real-time subscription for vote updates
      const channel = supabase
        .channel('poker-vote-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'prj_planning_poker_vote',
            filter: `story_id=eq.${currentStory.id}`
          },
          (payload) => {
            // Reload votes when they change
            loadVotes();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentStory?.id]);

  const loadData = async (showLoading = false) => {
    if (showLoading) {
      setIsLoading(true);
    }
    try {
      // Get current user from bmr_session
      const storedSession = localStorage.getItem("bmr_session");
      if (!storedSession) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive"
        });
        navigate("/auth");
        return;
      }
      const parsedSession = JSON.parse(storedSession);
      const user = parsedSession.user;
      setCurrentUser(user);

      // Load session
      const { data: sessionData, error: sessionError } = await supabase
        .from("prj_planning_poker_session")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (sessionError) throw sessionError;
      
      if (!sessionData) {
        toast({
          title: "Erro",
          description: "Sessão não encontrada",
          variant: "destructive"
        });
        navigate("/planning-poker");
        return;
      }

      // Se a sessão foi completada, não atualizar mais nada
      if (sessionData.status === 'completed') {
        const activeParticipants = Array.isArray(sessionData.active_participants) 
          ? (sessionData.active_participants as unknown as string[]) 
          : [];
        const participants = Array.isArray(sessionData.participants) 
          ? (sessionData.participants as unknown as Participant[]) 
          : [];
        const stories = Array.isArray(sessionData.stories) 
          ? (sessionData.stories as unknown as Story[]) 
          : [];
        
        setSession({
          ...sessionData,
          active_participants: activeParticipants,
          participants: participants,
          stories: stories
        } as PokerSession);
        setShowSummary(true);
        if (showLoading) {
          setIsLoading(false);
        }
        return;
      }


      const activeParticipants = Array.isArray(sessionData.active_participants) 
        ? sessionData.active_participants 
        : [];
      
      // Buscar histórias diretamente da sprint ao invés de usar o snapshot armazenado
      let stories: Story[] = [];
      if (sessionData.sprint_id) {
        const { data: storiesData, error: storiesError } = await supabase
          .from("prj_story")
          .select("id, title, description, story_points")
          .eq("sprint_id", sessionData.sprint_id)
          .eq("client_id", sessionData.client_id);
        
        if (storiesError) {
          console.error("Error fetching stories:", storiesError);
        } else if (storiesData) {
          stories = storiesData.map(s => ({
            id: s.id,
            title: s.title,
            description: s.description,
            story_points: s.story_points
          }));
          
          // Atualizar o campo stories na sessão se mudou
          const storiesJson = stories as any;
          if (JSON.stringify(sessionData.stories) !== JSON.stringify(storiesJson)) {
            await supabase
              .from("prj_planning_poker_session")
              .update({ stories: storiesJson })
              .eq("id", id);
          }
        }
      }

      // Parse participants and fetch their avatars
      let participants: Participant[] = [];
      if (Array.isArray(sessionData.participants)) {
        const emails = (sessionData.participants as any[]).map(p => p.email);
        
        // Buscar avatares dos usuários
        const { data: usersData } = await supabase
          .from("bmr_user")
          .select("email, name, avatar_url")
          .in("email", emails);
        
        participants = (sessionData.participants as any[]).map(p => {
          const userData = usersData?.find(u => u.email === p.email);
          return {
            email: p.email,
            name: p.name,
            avatar_url: userData?.avatar_url
          };
        });
      }

      // Verificar se o usuário está autorizado a participar
      const isParticipant = participants.some(p => p.email === user.email);
      if (!isParticipant) {
        toast({
          title: "Acesso Negado",
          description: "Você não está autorizado a participar desta sessão",
          variant: "destructive"
        });
        navigate("/planning-poker");
        return;
      }
      
      // Update active_participants if user is not in the list and session is not completed
      let updatedActiveParticipants = activeParticipants;
      if (!activeParticipants.includes(user.email) && sessionData.status !== 'completed') {
        updatedActiveParticipants = [...activeParticipants, user.email];
        await supabase
          .from("prj_planning_poker_session")
          .update({
            active_participants: updatedActiveParticipants
          })
          .eq("id", id);
      }

      setSession({
        ...sessionData,
        active_participants: updatedActiveParticipants,
        participants,
        stories
      } as PokerSession);

      // Load complexity options immediately
      if (sessionData.complexity_type) {
        await loadComplexityOptions(sessionData.complexity_type);
      }

      // Get current story
      if (stories.length > 0) {
        const story = stories[sessionData.current_story_index || 0];
        if (story) {
          setCurrentStory(story);
        }
      }

      // Load votes
      await loadVotes();

    } catch (error) {
      console.error("Error loading data:", error);
      if (showLoading) {
        toast({
          title: "Erro",
          description: "Erro ao carregar sessão",
          variant: "destructive"
        });
      }
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  const loadVotes = async () => {
    if (!currentStory) return;

    try {
      const { data: votesData, error } = await supabase
        .from("prj_planning_poker_vote")
        .select("*")
        .eq("session_id", id)
        .eq("story_id", currentStory.id);

      if (error) throw error;

      setVotes(votesData || []);

      // Check if current user voted
      const userVote = votesData?.find(v => v.voter_email === currentUser?.email);
      setMyVote(userVote?.vote_value || null);

    } catch (error) {
      console.error("Error loading votes:", error);
    }
  };

  const handleVote = async (value: string) => {
    if (!currentUser || !currentStory) return;

    try {
      // Check if user already voted
      const existingVote = votes.find(v => v.voter_email === currentUser.email);

      if (existingVote) {
        // Update vote
        await supabase
          .from("prj_planning_poker_vote")
          .update({ vote_value: value })
          .eq("id", existingVote.id);
      } else {
        // Create new vote
        await supabase
          .from("prj_planning_poker_vote")
          .insert({
            session_id: id,
            story_id: currentStory.id,
            voter_email: currentUser.email,
            voter_name: currentUser.user_metadata?.full_name || currentUser.email,
            vote_value: value,
            client_id: currentTenantId
          });
      }

      setMyVote(value);
      toast({
        title: "Sucesso",
        description: "Voto registrado!"
      });

      // Reload votes list
      await loadVotes();

    } catch (error) {
      console.error("Error voting:", error);
      toast({
        title: "Erro",
        description: "Erro ao registrar voto",
        variant: "destructive"
      });
    }
  };

  const handleStartVoting = async () => {
    if (!session || session.stories.length === 0) {
      toast({
        title: "Erro",
        description: "Não há histórias para votar",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log("Starting voting - current status:", session.status);
      
      await supabase
        .from("prj_planning_poker_session")
        .update({ status: 'voting' })
        .eq("id", id);

      // Update local state immediately
      setSession({ ...session, status: 'voting' });
      
      console.log("Voting started - new status: voting");

      toast({
        title: "Sucesso",
        description: "Votação iniciada!"
      });
    } catch (error) {
      console.error("Error starting voting:", error);
      toast({
        title: "Erro",
        description: "Erro ao iniciar votação",
        variant: "destructive"
      });
    }
  };

  const handleCancelSession = async () => {
    if (!session || !currentUser) return;
    
    const isMod = currentUser.email === session.moderator_email;
    if (!isMod) {
      toast({
        title: "Erro",
        description: "Apenas o moderador pode cancelar a sessão",
        variant: "destructive"
      });
      return;
    }

    try {
      // Deletar todos os votos da sessão
      await supabase
        .from("prj_planning_poker_vote")
        .delete()
        .eq("session_id", id)
        .eq("client_id", currentTenantId);

      // Deletar a sessão
      await supabase
        .from("prj_planning_poker_session")
        .delete()
        .eq("id", id)
        .eq("client_id", currentTenantId);

      toast({
        title: "Sucesso",
        description: "Sessão cancelada com sucesso"
      });
      
      navigate("/planning-poker");
    } catch (error) {
      console.error("Error canceling session:", error);
      toast({
        title: "Erro",
        description: "Erro ao cancelar sessão",
        variant: "destructive"
      });
    }
  };

  const handleRevealVotes = async () => {
    try {
      console.log("Revealing votes - current status:", session?.status);
      
      await supabase
        .from("prj_planning_poker_session")
        .update({ status: 'revealed' })
        .eq("id", id);

      // Update local state immediately and reload votes
      if (session) {
        setSession({ ...session, status: 'revealed' });
      }
      
      // Reload votes to ensure they're fresh
      await loadVotes();
      
      console.log("Votes revealed - new status: revealed");

      toast({
        title: "Sucesso",
        description: "Votos revelados!"
      });
    } catch (error) {
      console.error("Error revealing votes:", error);
      toast({
        title: "Erro",
        description: "Erro ao revelar votos",
        variant: "destructive"
      });
    }
  };

  const handleResetVoting = async () => {
    try {
      // Delete all votes for current story
      await supabase
        .from("prj_planning_poker_vote")
        .delete()
        .eq("session_id", id)
        .eq("story_id", currentStory?.id);

      // Reset session status
      await supabase
        .from("prj_planning_poker_session")
        .update({ status: 'voting' })
        .eq("id", id);

      // Update local state immediately
      if (session) {
        setSession({ ...session, status: 'voting' });
      }

      setMyVote(null);
      toast({
        title: "Sucesso",
        description: "Votação reiniciada!"
      });
    } catch (error) {
      console.error("Error resetting votes:", error);
      toast({
        title: "Erro",
        description: "Erro ao reiniciar votação",
        variant: "destructive"
      });
    }
  };

  const handleSaveEstimate = async () => {
    if (!currentStory) return;

    // Calculate consensus (most voted value)
    const voteCounts = votes.reduce((acc, vote) => {
      acc[vote.vote_value] = (acc[vote.vote_value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const consensus = Object.keys(voteCounts).reduce((a, b) => 
      voteCounts[a] > voteCounts[b] ? a : b
    );

    try {
      // Update story with estimate
      await supabase
        .from("prj_story")
        .update({ story_points: consensus })
        .eq("id", currentStory.id);

      toast({
        title: "Sucesso",
        description: `Estimativa salva: ${consensus}`
      });
      
      // Check if this is the last story
      const isLastStory = session.current_story_index === session.stories.length - 1;
      
      if (isLastStory) {
        // Complete the session directly
        console.log('Last story - completing session, id:', id, 'client_id:', currentTenantId);
        
        // Use direct update with client_id in the WHERE clause to ensure RLS passes
        const { data, error } = await supabase
          .from("prj_planning_poker_session")
          .update({ status: 'completed' })
          .eq("id", id)
          .eq("client_id", currentTenantId)
          .select();

        console.log('Update result:', { data, error });

        if (error) {
          console.error('Error updating session:', error);
          throw error;
        }

        console.log('Session completed successfully, data:', data);
        setSession(prev => prev ? { ...prev, status: 'completed' } : prev);
        setShowSummary(true);
        
        toast({
          title: "Sucesso",
          description: "Sessão concluída!"
        });
      } else {
        // Move to next story
        await handleNextStory();
      }
    } catch (error) {
      console.error("Error saving estimate:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar estimativa",
        variant: "destructive"
      });
    }
  };

  const handleNextStory = async () => {
    if (!session) return;

    const nextIndex = session.current_story_index + 1;

    if (nextIndex >= session.stories.length) {
      // Complete session
      try {
        console.log('Completing session - updating status to completed');
        const { error } = await supabase
          .from("prj_planning_poker_session")
          .update({ status: 'completed' })
          .eq("id", id);

        if (error) {
          console.error('Error updating session status:', error);
          throw error;
        }

        console.log('Session status updated successfully, setting local state');
        
        // Update local state directly without reload
        setSession(prev => prev ? { ...prev, status: 'completed' } : prev);
        setShowSummary(true);
        
        toast({
          title: "Sucesso",
          description: "Sessão concluída!"
        });
      } catch (error) {
        console.error("Error completing session:", error);
        toast({
          title: "Erro",
          description: "Erro ao finalizar sessão",
          variant: "destructive"
        });
      }
      return;
    } else {
      // Move to next story
      try {
        // Delete votes for current story
        await supabase
          .from("prj_planning_poker_vote")
          .delete()
          .eq("session_id", id)
          .eq("story_id", currentStory?.id);

        // Update session
        await supabase
          .from("prj_planning_poker_session")
          .update({ 
            current_story_index: nextIndex,
            status: 'voting'
          })
          .eq("id", id);

        // Update local state immediately
        const nextStory = session.stories[nextIndex];
        setSession({ 
          ...session, 
          current_story_index: nextIndex,
          status: 'voting'
        });
        setCurrentStory(nextStory);
        setMyVote(null);

        toast({
          title: "Sucesso",
          description: "Próxima história!"
        });
      } catch (error) {
        console.error("Error moving to next story:", error);
        toast({
          title: "Erro",
          description: "Erro ao ir para próxima história",
          variant: "destructive"
        });
      }
    }
  };

  const handleSkipStory = async () => {
    await handleNextStory();
  };

  const handleLeaveSession = async () => {
    if (!session || !currentUser) return;

    try {
      const updatedParticipants = session.active_participants.filter(
        email => email !== currentUser.email
      );

      await supabase
        .from("prj_planning_poker_session")
        .update({ active_participants: updatedParticipants })
        .eq("id", id);

      navigate("/planning-poker");
    } catch (error) {
      console.error("Error leaving session:", error);
      toast({
        title: "Erro",
        description: "Erro ao sair da sessão",
        variant: "destructive"
      });
    }
  };

  if (!session || !currentUser) return null;

  const isModerator = currentUser.email === session.moderator_email;
  const hasVoted = !!myVote;
  const activeParticipants = session.active_participants || [];
  const voteCounts = votes.reduce((acc, vote) => {
    acc[vote.vote_value] = (acc[vote.vote_value] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-foreground">Carregando sessão...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handleLeaveSession}
              className="border-border hover:bg-accent"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Target className="w-8 h-8 text-primary" />
                {session.name}
              </h1>
            </div>
          </div>
          <Badge className={`${
            session.status === 'waiting' ? 'bg-gray-500/20 text-gray-600 dark:text-gray-400' :
            session.status === 'voting' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
            session.status === 'revealed' ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
            'bg-green-500/20 text-green-600 dark:text-green-400'
          } text-lg px-4 py-2`}>
            {session.status === 'waiting' ? 'Aguardando' :
             session.status === 'voting' ? 'Votando' :
             session.status === 'revealed' ? 'Revelado' :
             'Concluída'}
          </Badge>
        </div>

        {/* Story Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">
              História {session.current_story_index + 1} de {session.stories.length}
            </p>
            <p className="text-sm font-medium text-foreground">
              {votes.length} / {session.participants?.length || 0} votaram
            </p>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${((session.current_story_index + 1) / session.stories.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Story & Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Story */}
            {currentStory ? (
              <Card className="border-2 border-primary/30 bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    {currentStory.title}
                  </CardTitle>
                </CardHeader>
                {currentStory.description && (
                  <CardContent>
                    <div className="prose prose-sm max-w-none text-muted-foreground dark:prose-invert">
                      {currentStory.description}
                    </div>
                  </CardContent>
                )}
              </Card>
            ) : session.stories.length === 0 ? (
              <Card className="border-2 border-yellow-500/30 bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Nenhuma História Disponível
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Não há histórias associadas a esta sessão. Por favor, adicione histórias à sprint antes de iniciar a votação.
                  </p>
                </CardContent>
              </Card>
            ) : null}

            {/* Voting Cards */}
            {session.status === 'voting' && (
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground">
                    {hasVoted ? `Seu voto: ${myVote}` : 'Escolha sua estimativa'}
                  </CardTitle>
                  {hasVoted && (
                    <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Voto registrado
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  {loadingOptions ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-muted-foreground mt-2">Carregando opções...</p>
                    </div>
                  ) : complexityOptions.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Nenhuma opção de complexidade disponível</p>
                      <p className="text-sm text-muted-foreground mt-2">Debug: Session complexity_type = {session.complexity_type}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                      {complexityOptions.map((value) => (
                        <PokerCard
                          key={value}
                          value={value}
                          selected={myVote === value}
                          onClick={() => handleVote(value)}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Moderator Controls */}
            {isModerator && session.status !== 'completed' && (
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    Controles do Moderador
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {session.status === 'waiting' && (
                    <>
                      <Button
                        onClick={handleStartVoting}
                        className="w-full"
                        disabled={session.stories.length === 0}
                      >
                        <Target className="w-4 h-4 mr-2" />
                        Iniciar Votação
                      </Button>
                      <Button
                        onClick={handleCancelSession}
                        variant="destructive"
                        className="w-full"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Cancelar Sessão
                      </Button>
                    </>
                  )}
                  
                  {session.status === 'voting' && (
                    <Button
                      onClick={handleRevealVotes}
                      className="w-full"
                      disabled={votes.length === 0}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Revelar Votos
                    </Button>
                  )}
                  
                  {session.status === 'revealed' && (
                    <>
                      <Button
                        onClick={handleResetVoting}
                        variant="outline"
                        className="w-full border-border hover:bg-accent"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reiniciar Votação
                      </Button>
                      <Button
                        onClick={handleSaveEstimate}
                        className="w-full"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {session.current_story_index === session.stories.length - 1 
                          ? 'Salvar e Finalizar' 
                          : 'Salvar e Próxima'}
                      </Button>
                      <Button
                        onClick={handleNextStory}
                        variant="outline"
                        className="w-full border-border hover:bg-accent"
                      >
                        <SkipForward className="w-4 h-4 mr-2" />
                        Pular História
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Participants & Votes */}
          <div className="space-y-6">
            {/* Participants */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Participantes ({session.participants?.length || 0} total, {activeParticipants.length} online)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {session.participants?.map((participant) => {
                  const vote = votes.find(v => v.voter_email === participant.email);
                  const isOnline = activeParticipants.includes(participant.email);
                  const isMe = participant.email === currentUser.email;

                  return (
                    <div
                      key={participant.email}
                      className={`p-3 rounded-lg flex items-center gap-3 ${
                        isOnline ? 'bg-accent/50' : 'bg-muted/30'
                      }`}
                    >
                      <div className="relative">
                        {participant.avatar_url ? (
                          <img 
                            src={participant.avatar_url} 
                            alt={participant.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                            {participant.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card ${
                          isOnline ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate flex items-center gap-2">
                          {participant.name}
                          {participant.email === session.moderator_email && (
                            <Crown className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                          )}
                          {isMe && (
                            <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs">
                              Você
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {participant.email}
                        </p>
                      </div>
                      <div>
                        {vote ? (
                          session.status === 'revealed' ? (
                            <Badge className="bg-primary/20 text-primary text-lg font-bold min-w-[3rem] justify-center">
                              {vote.vote_value}
                            </Badge>
                          ) : (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Vote Results (when revealed) */}
            {session.status === 'revealed' && votes.length > 0 && (
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground">Resultado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(voteCounts).map(([value, count]) => (
                    <div key={value} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground font-medium">{value} pontos</span>
                        <span className="text-muted-foreground">{count} voto{count > 1 ? 's' : ''}</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${(count / votes.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Summary Modal */}
      {showSummary && session && (
        <PokerSummaryModal
          stories={session.stories}
          onClose={() => {
            setShowSummary(false);
            navigate("/planning-poker");
          }}
          onDelete={async () => {
            try {
              console.log("🔄 Finalizando sessão - ID:", id);
              
              // Usar função SECURITY DEFINER que bypassa RLS
              const client = await getSupabaseClient();
              const { data, error } = await client.rpc('complete_planning_poker_session', {
                p_session_id: id
              });

              if (error) throw error;

              console.log("✅ Sessão finalizada:", data);

              toast({
                title: "Sucesso",
                description: "Sessão finalizada e salva no histórico"
              });
              
              navigate("/planning-poker");
            } catch (error) {
              console.error("❌ Error finalizing session:", error);
              toast({
                title: "Erro",
                description: error instanceof Error ? error.message : "Erro ao finalizar sessão",
                variant: "destructive"
              });
            }
          }}
          projectName={session.name}
          complexityType={session.complexity_type}
        />
      )}
    </div>
  );
}