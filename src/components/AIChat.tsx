/**
 * AIChat — Chat com IA + Áudio
 * - Gravação via Web Speech API (SpeechRecognition)
 * - Transcrição automática em português
 * - Resposta em voz via SpeechSynthesis (TTS nativo)
 * - Upload de arquivo de áudio (mp3/wav/ogg)
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAIChat } from '@/hooks/useEnhancedAI';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Mic, MicOff, Volume2, VolumeX, Upload, Bot, User } from 'lucide-react';
import { toast } from 'sonner';

interface AIChatProps {
  clientId: string;
  clientName?: string;
}

// Verifica suporte do browser
const hasSpeechRecognition = typeof window !== 'undefined' &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

const hasSpeechSynthesis = typeof window !== 'undefined' && 'speechSynthesis' in window;

export function AIChat({ clientId, clientName = 'Cliente' }: AIChatProps) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [transcript, setTranscript] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { messages, sendMessage, isProcessing, hasHistory } = useAIChat(clientId);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-falar última resposta da IA
  useEffect(() => {
    if (!autoSpeak || !hasSpeechSynthesis) return;
    const last = messages[messages.length - 1];
    if (last?.sender === 'ai') speakText(last.text);
  }, [messages, autoSpeak, speakText]);

  // ── Gravação de voz ──────────────────────────────────────────────────────────
  const startRecording = useCallback(() => {
    if (!hasSpeechRecognition) {
      toast.error('Seu browser não suporta reconhecimento de voz. Use Chrome.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setIsRecording(true);

    recognition.onresult = (event: any) => {
      const result = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join('');
      setTranscript(result);
      if (event.results[0].isFinal) {
        setMessage(result);
        setTranscript('');
      }
    };

    recognition.onerror = (e: any) => {
      console.error('Speech error:', e.error);
      if (e.error === 'not-allowed') toast.error('Permissão de microfone negada.');
      else if (e.error === 'no-speech') toast.info('Nenhuma fala detectada.');
      setIsRecording(false);
    };

    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }, []);

  // ── TTS — falar texto ────────────────────────────────────────────────────────
  const speakText = useCallback((text: string) => {
    if (!hasSpeechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Preferir voz em português se disponível
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang.startsWith('pt'));
    if (ptVoice) utterance.voice = ptVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  // ── Upload de arquivo de áudio ───────────────────────────────────────────────
  const handleAudioUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm'];
    if (!allowed.includes(file.type)) {
      toast.error('Formato não suportado. Use MP3, WAV ou OGG.');
      return;
    }

    toast.info('Processando áudio...');

    // Tentar transcrição via Web Speech API (SpeechRecognition)
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const audioUrl = URL.createObjectURL(file);
        const audio = new Audio(audioUrl);
        const recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event: any) => {
          const transcript = event.results[0]?.[0]?.transcript || '';
          if (transcript) {
            setMessage(transcript);
            toast.success('Áudio transcrito com sucesso!');
          } else {
            setMessage(`[Áudio: ${file.name}]`);
            toast.info('Transcrição vazia. Mensagem de contexto inserida.');
          }
          URL.revokeObjectURL(audioUrl);
        };

        recognition.onerror = () => {
          setMessage(`[Áudio: ${file.name}]`);
          toast.info('Transcrição não disponível. Contexto do áudio inserido.');
          URL.revokeObjectURL(audioUrl);
        };

        audio.onplay = () => recognition.start();
        audio.play().catch(() => {
          // Fallback silencioso se autoplay bloqueado
          setMessage(`[Áudio: ${file.name}]`);
          toast.info('Reprodução bloqueada pelo navegador. Contexto inserido.');
        });
      } catch {
        setMessage(`[Áudio: ${file.name}]`);
        toast.info('Contexto do áudio inserido. Envie para processar.');
      }
    } else {
      // Navegador sem suporte a SpeechRecognition
      setMessage(`[Áudio: ${file.name}]`);
      toast.info('Seu navegador não suporta transcrição. Contexto inserido.');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // ── Enviar mensagem ──────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if (!message.trim() || isProcessing) return;
    const text = message;
    setMessage('');
    try {
      await sendMessage(text);
    } catch {
      toast.error('Erro ao enviar mensagem.');
    }
  }, [message, isProcessing, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-background border border-border rounded-xl shadow-lg overflow-hidden">

      {/* Header */}
      <div className="bg-gradient-to-r from-primary/80 to-primary p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">{clientName}</p>
            <p className="text-xs text-white/70">{hasHistory ? 'Histórico carregado' : 'IA Inteligente'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasSpeechSynthesis && (
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 h-8 px-2 text-xs"
              onClick={() => setAutoSpeak(v => !v)}
              title={autoSpeak ? 'Desativar voz automática' : 'Ativar voz automática'}
            >
              {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="ml-1 hidden sm:inline">{autoSpeak ? 'Voz On' : 'Voz Off'}</span>
            </Button>
          )}
          <Badge variant="secondary" className="text-xs bg-white/20 text-white border-0">
            {messages.length} msgs
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <Bot className="w-12 h-12 opacity-30" />
            <p className="text-sm">Olá! Como posso ajudar?</p>
            <p className="text-xs opacity-60">Digite, fale ou envie um áudio</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.sender === 'ai' && (
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}
            <div className={`max-w-[75%] ${msg.sender === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <Card className={`px-3 py-2 text-sm ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                <p>{msg.text}</p>
              </Card>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.sender === 'ai' && hasSpeechSynthesis && (
                  <button
                    onClick={() => isSpeaking ? stopSpeaking() : speakText(msg.text)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    title="Ouvir resposta"
                  >
                    {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                  </button>
                )}
              </div>
            </div>
            {msg.sender === 'user' && (
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {/* Transcrição em tempo real */}
        {transcript && (
          <div className="flex justify-end">
            <Card className="px-3 py-2 text-sm bg-primary/30 text-primary-foreground max-w-[75%] italic opacity-70">
              {transcript}...
            </Card>
          </div>
        )}

        {isProcessing && (
          <div className="flex gap-2 justify-start">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <Card className="px-3 py-2">
              <div className="flex gap-1 items-center">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </Card>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-card p-3 space-y-2">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? 'Ouvindo...' : 'Digite ou fale sua mensagem...'}
            disabled={isProcessing || isRecording}
            className="flex-1 text-sm"
          />
          <Button
            onClick={handleSend}
            disabled={isProcessing || !message.trim()}
            size="icon"
            className="shrink-0"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>

        {/* Controles de áudio */}
        <div className="flex gap-2">
          {hasSpeechRecognition && (
            <Button
              variant={isRecording ? 'destructive' : 'outline'}
              size="sm"
              className="flex-1 text-xs"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
            >
              {isRecording ? (
                <><MicOff className="w-3 h-3 mr-1" />Parar</>
              ) : (
                <><Mic className="w-3 h-3 mr-1" />Falar</>
              )}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
          >
            <Upload className="w-3 h-3 mr-1" />
            Enviar Áudio
          </Button>

          {hasSpeechSynthesis && messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => {
                const last = messages.filter(m => m.sender === 'ai').pop();
                if (last) {
                  if (isSpeaking) stopSpeaking(); else speakText(last.text);
                }
              }}
              disabled={isProcessing}
            >
              {isSpeaking ? (
                <><VolumeX className="w-3 h-3 mr-1" />Parar</>
              ) : (
                <><Volume2 className="w-3 h-3 mr-1" />Ouvir</>
              )}
            </Button>
          )}
        </div>

        {!hasSpeechRecognition && (
          <p className="text-xs text-muted-foreground text-center">
            Use Chrome para habilitar reconhecimento de voz
          </p>
        )}
      </div>

      {/* Input oculto para upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleAudioUpload}
      />
    </div>
  );
}
