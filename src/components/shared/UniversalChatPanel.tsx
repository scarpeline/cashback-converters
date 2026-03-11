import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MessageCircle, Send, Loader2, UserCheck, User, Users } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface Message {
  id: string;
  usuario_id: string;
  contador_id: string;
  mensagem: string;
  remetente: string;
  lido: boolean;
  data_envio: string;
  created_at: string;
  user_type?: string;
}

interface ContadorInfo {
  id: string;
  name: string;
  email: string;
  empresa_contabil: string | null;
  cidade: string | null;
  estado: string | null;
  aceita_novos_clientes: boolean;
}

interface UserInfo {
  id: string;
  email: string;
  name?: string;
}

type ChatMode = "usuario" | "contador" | "superadmin";

export function UniversalChatPanel({ 
  mode, 
  contadorId, 
  usuarioId,
  userType = "barbershop" 
}: {
  mode: ChatMode;
  contadorId?: string;
  usuarioId?: string;
  userType?: "barbershop" | "profissional" | "afiliado";
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [contador, setContador] = useState<ContadorInfo | null>(null);
  const [usuario, setUsuario] = useState<UserInfo | null>(null);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [contadores, setContadores] = useState<ContadorInfo[]>([]);
  const [usuarios, setUsuarios] = useState<UserInfo[]>([]);
  const [selectedContadorId, setSelectedContadorId] = useState<string>(contadorId || "");
  const [selectedUsuarioId, setSelectedUsuarioId] = useState<string>(usuarioId || "");
  const bottomRef = useRef<HTMLDivElement>(null);

  const currentUserId = user?.id;
  const effectiveContadorId = mode === "contador" ? 
    (contadores.find(c => c.id === selectedContadorId)?.id || "") : 
    selectedContadorId;
  const effectiveUsuarioId = mode === "usuario" ? 
    currentUserId : 
    selectedUsuarioId;

  // Carregar lista de contadores disponíveis
  const loadContadores = async () => {
    try {
      const { data, error } = await supabase
        .from("accountants")
        .select("id, name, email, empresa_contabil, cidade, estado, aceita_novos_clientes")
        .eq("is_active", true)
        .eq("status_verificado", "verified")
        .order("name");

      if (error) throw error;
      setContadores(data || []);
      
      // Auto-selecionar primeiro contador se nenhum estiver selecionado
      if (!selectedContadorId && data && data.length > 0) {
        setSelectedContadorId(data[0].id);
      }
    } catch (error) {
      console.error("Erro ao carregar contadores:", error);
      toast.error("Erro ao carregar lista de contadores");
    }
  };

  // Carregar lista de usuários (para contador)
  const loadUsuarios = async () => {
    if (mode !== "contador") return;
    
    try {
      const { data, error } = await supabase
        .from("recent_chat_messages")
        .select("usuario_id, usuario_email, usuario_name")
        .eq("contador_id", effectiveContadorId)
        .neq("usuario_id", currentUserId)
        .distinct();

      if (error) throw error;
      
      const usuariosUnicos = data?.map(u => ({
        id: u.usuario_id,
        email: u.usuario_email,
        name: u.usuario_name || u.usuario_email
      })) || [];
      
      setUsuarios(usuariosUnicos);
      
      // Auto-selecionar primeiro usuário se nenhum estiver selecionado
      if (!selectedUsuarioId && usuariosUnicos.length > 0) {
        setSelectedUsuarioId(usuariosUnicos[0].id);
      }
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    }
  };

  // Carregar informações do contador
  const loadContadorInfo = async () => {
    if (!effectiveContadorId) return;
    
    try {
      const { data, error } = await supabase
        .from("accountants")
        .select("id, name, email, empresa_contabil, cidade, estado, aceita_novos_clientes")
        .eq("id", effectiveContadorId)
        .single();

      if (error) throw error;
      setContador(data);
    } catch (error) {
      console.error("Erro ao carregar info do contador:", error);
    }
  };

  // Carregar informações do usuário
  const loadUsuarioInfo = async () => {
    if (!effectiveUsuarioId) return;
    
    try {
      const { data, error } = await supabase.auth.admin.getUserById(effectiveUsuarioId);
      if (error) throw error;
      
      if (data.user) {
        setUsuario({
          id: data.user.id,
          email: data.user.email || "",
          name: data.user.user_metadata?.name || data.user.email
        });
      }
    } catch (error) {
      console.error("Erro ao carregar info do usuário:", error);
    }
  };

  // Carregar mensagens
  const loadMessages = async () => {
    if (!effectiveContadorId || !effectiveUsuarioId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from("chat_contador")
        .select("*")
        .eq("contador_id", effectiveContadorId)
        .eq("usuario_id", effectiveUsuarioId)
        .order("data_envio", { ascending: true });

      const { data, error } = await query;
      
      if (error) throw error;
      setMessages(data || []);

      // Marcar mensagens como lidas (se for contador)
      if (mode === "contador") {
        await supabase
          .from("chat_contador")
          .update({ lido: true })
          .eq("contador_id", effectiveContadorId)
          .eq("usuario_id", effectiveUsuarioId)
          .eq("remetente", "usuario");
      }
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
      toast.error("Erro ao carregar mensagens");
    } finally {
      setLoading(false);
    }
  };

  // Enviar mensagem
  const sendMessage = async () => {
    if (!messageText.trim() || !effectiveContadorId || !effectiveUsuarioId || !currentUserId) {
      toast.error("Preencha todos os campos");
      return;
    }

    setSending(true);
    try {
      const payload = {
        usuario_id: effectiveUsuarioId,
        contador_id: effectiveContadorId,
        mensagem: messageText.trim(),
        remetente: mode === "contador" ? "contador" : "usuario",
        user_type: userType
      };

      const { error } = await supabase.from("chat_contador").insert(payload);
      
      if (error) throw error;
      
      setMessageText("");
      toast.success("Mensagem enviada");
      await loadMessages();
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  };

  // Configurar subscription em tempo real
  useEffect(() => {
    if (!effectiveContadorId || !effectiveUsuarioId) return;

    const channel = supabase
      .channel(`chat_${effectiveContadorId}_${effectiveUsuarioId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "chat_contador",
        filter: `contador_id=eq.${effectiveContadorId}&usuario_id=eq.${effectiveUsuarioId}`,
      }, (payload) => {
        if (payload.eventType === "INSERT") {
          setMessages(prev => [...prev, payload.new as Message]);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        } else if (payload.eventType === "UPDATE") {
          setMessages(prev => 
            prev.map(msg => msg.id === payload.new.id ? payload.new as Message : msg)
          );
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [effectiveContadorId, effectiveUsuarioId]);

  // Carregar dados iniciais
  useEffect(() => {
    if (mode === "usuario" || mode === "superadmin") {
      loadContadores();
    } else if (mode === "contador" && effectiveContadorId) {
      loadUsuarios();
    }
  }, [mode, effectiveContadorId]);

  useEffect(() => {
    loadContadorInfo();
  }, [effectiveContadorId]);

  useEffect(() => {
    loadUsuarioInfo();
  }, [effectiveUsuarioId]);

  useEffect(() => {
    if (effectiveContadorId && effectiveUsuarioId) {
      loadMessages();
    }
  }, [effectiveContadorId, effectiveUsuarioId]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("pt-BR", { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", { 
      day: "2-digit", 
      month: "short" 
    });
  };

  const getChatTitle = () => {
    if (mode === "usuario") {
      return `Chat com ${contador?.name || "Contador"}`;
    } else if (mode === "contador") {
      return `Chat com ${usuario?.name || "Cliente"}`;
    } else {
      return "Chat Contábil";
    }
  };

  const getChatDescription = () => {
    if (mode === "usuario" && contador?.empresa_contabil) {
      return contador.empresa_contabil;
    } else if (mode === "contador" && usuario?.email) {
      return usuario.email;
    } else if (contador?.cidade && contador?.estado) {
      return `${contador.cidade} - ${contador.estado}`;
    }
    return "";
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">{getChatTitle()}</CardTitle>
          </div>
          {(mode === "usuario" || mode === "superadmin") && (
            <Select value={selectedContadorId} onValueChange={setSelectedContadorId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione um contador" />
              </SelectTrigger>
              <SelectContent>
                {contadores.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} - {c.cidade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {mode === "contador" && (
            <Select value={selectedUsuarioId} onValueChange={setSelectedUsuarioId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {usuarios.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {getChatDescription() && (
          <CardDescription>{getChatDescription()}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">Nenhuma mensagem ainda.</p>
            <p className="text-xs text-muted-foreground mt-1">
              {mode === "usuario" || mode === "superadmin"
                ? "Apresente-se e descreva sua necessidade contábil."
                : "Aguardando mensagem do cliente."}
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isMe = 
              (mode === "usuario" && message.remetente === "usuario") ||
              (mode === "contador" && message.remetente === "contador") ||
              (mode === "superadmin" && message.usuario_id === currentUserId);

            return (
              <div key={message.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-xl px-3 py-2 space-y-1 ${
                  isMe
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted rounded-bl-sm"
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {!isMe && (
                      <span className="text-xs font-medium opacity-70">
                        {message.remetente === "contador" ? (
                          <span className="flex items-center gap-1">
                            <UserCheck className="w-3 h-3" /> Contador
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" /> Cliente
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {message.mensagem}
                  </p>
                  <p className={`text-xs opacity-60 text-right`}>
                    {formatDate(message.data_envio)} {formatTime(message.data_envio)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </CardContent>

      <div className="p-3 border-t flex gap-2">
        <Input
          placeholder="Digite sua mensagem..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          disabled={sending || !effectiveContadorId || !effectiveUsuarioId}
        />
        <Button 
          variant="gold" 
          size="icon" 
          onClick={sendMessage} 
          disabled={sending || !messageText.trim() || !effectiveContadorId || !effectiveUsuarioId}
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </Card>
  );
}

export default UniversalChatPanel;
