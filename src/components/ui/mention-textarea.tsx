import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { bmr } from "@/api/boomerangClient";
import { getSupabaseClient } from "@/lib/supabase-client";
import { cn } from "@/lib/utils";
import { useTenantId } from "@/hooks/useTenantId";

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onMention?: (mentionedUsers: string[]) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}

interface User {
  email: string;
  name: string;
  avatar_url?: string;
}

export function MentionTextarea({
  value,
  onChange,
  onMention,
  placeholder,
  className,
  rows = 4,
}: MentionTextareaProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const tenantId = useTenantId();

  useEffect(() => {
    loadUsers();
  }, [tenantId]);

  const loadUsers = async () => {
    try {
      if (!tenantId) return;
      
      // Buscar usuários do cliente atual via Supabase
      const supabase = await getSupabaseClient();
      const { data: userClients, error: clientsError } = await supabase
        .from('bmr_user_clients')
        .select(`
          user_id,
          bmr_user!inner (
            user_id,
            name,
            email,
            avatar_url
          )
        `)
        .eq('client_id', tenantId);
      
      if (clientsError) {
        console.error("Error loading user clients:", clientsError);
        return;
      }
      
      if (!userClients || userClients.length === 0) {
        setUsers([]);
        return;
      }
      
      // Mapear para formato User
      const clientUsers = userClients.map((uc: any) => ({
        email: uc.bmr_user.email,
        name: uc.bmr_user.name || uc.bmr_user.email,
        avatar_url: uc.bmr_user.avatar_url
      }));
      
      setUsers(clientUsers);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const position = e.target.selectionStart;
    
    onChange(newValue);
    setCursorPosition(position);

    // Detectar @ para começar menção
    const textBeforeCursor = newValue.substring(0, position);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      const hasSpace = textAfterAt.includes(" ");
      
      if (!hasSpace) {
        // Mostrar sugestões
        setMentionStart(lastAtIndex);
        const query = textAfterAt.toLowerCase();
        const filtered = users.filter(
          (user) =>
            user.name.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query)
        );
        setFilteredUsers(filtered);
        setShowSuggestions(filtered.length > 0);
        setSelectedIndex(0);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const insertMention = (user: User) => {
    if (mentionStart === -1) return;

    const beforeMention = value.substring(0, mentionStart);
    const afterCursor = value.substring(cursorPosition);
    const mention = `@${user.name} `;
    const newValue = beforeMention + mention + afterCursor;

    onChange(newValue);
    setShowSuggestions(false);
    setMentionStart(-1);

    // Notificar sobre menção
    if (onMention) {
      const mentionedEmails = extractMentionedEmails(newValue);
      onMention(mentionedEmails);
    }

    // Focar no textarea após inserir
    setTimeout(() => {
      if (textareaRef.current) {
        const newPosition = beforeMention.length + mention.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  const extractMentionedEmails = (text: string): string[] => {
    const mentions: string[] = [];
    const regex = /@(\w+(?:\s+\w+)*)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const mentionedName = match[1];
      const user = users.find((u) => u.name === mentionedName);
      if (user) {
        mentions.push(user.email);
      }
    }

    return mentions;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredUsers.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        if (filteredUsers[selectedIndex]) {
          e.preventDefault();
          insertMention(filteredUsers[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        break;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn("min-h-[100px]", className)}
        rows={rows}
      />

      {showSuggestions && (
        <Card className="absolute z-50 mt-1 w-full max-w-sm" ref={suggestionsRef}>
          <CardContent className="p-0">
            <ScrollArea className="max-h-60">
              {filteredUsers.map((user, index) => (
                <button
                  key={user.email}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-accent",
                    index === selectedIndex && "bg-accent"
                  )}
                  onClick={() => insertMention(user)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url} alt={user.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </button>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
