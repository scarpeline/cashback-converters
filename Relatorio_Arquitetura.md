# Relatório de Arquitetura: Sistema de Mensageria e Inteligência Artificial
**Projeto:** Salão Cashback (Cashback Converters)
**Data:** Abril de 2026

---

## 1. O Ponto de Partida: O Desafio do Twilio
Durante nossa implementação do sistema de automação para barbearias, deparamos com um gargalo de escala:
* O sistema atual utiliza **Twilio (API Oficial)**, que cobra em dólar *por cada mensagem enviada ou recebida*.
* Para escalar para milhares de assinantes, arcar com este custo corroeria as margens de lucro ou tornaria o sistema inviável financeiramente para assinantes menores.

## 2. A Evolução da Arquitetura: WhatsApp Web via QR Code
Diante das perguntas sobre ativação de WhatsApp Web, chegamos à necessidade de alterar as fundações da infraestrutura de comunicação.

**Sua dúvida:**
> *"e como funciona contratar api de qr code?"* / *"seria ideal eu criar meu servidor para esse sistema e aqui ou criar em outro lugar e apontar para esse sistema podendo usar outros sisstemas nele"*

**Nossa Resolução Técnica:**
Optar pelo modelo de **Hardware Separado (Microserviços)** usando **Evolution API** (Open Source):
1. **O Servidor Central de Mensagens:** Você deverá alugar uma VPS (Máquina Virtual Linux) básica em serviços como Hetzner ou DigitalOcean (~ R$ 50-100 mensais).
2. **A Instalação:** Hospedaremos a *Evolution API* lá. Isso transforma sua VPS na sua própria central ilimitada de disparos via QR Code.
3. **Escalabilidade (O Ouro):** Este servidor será **independente**. O sistema de barbearias (Supabase) apenas aponta para ele. Se no futuro você construir um app de petshops ou delivery, eles também apontarão para este mesmo servidor sem custos adicionais. O limite é a potência da máquina.

---

## 3. Implementando a Inteligência Artificial (Mensageria 2.0)
Reestruturamos a inteligência para ser dinâmica, barata e modular.

**Sua dúvida:**
> *"as ias gratuitas funcionam com mensagem de audio? (...) e a ia do app não pode ser gratuita como tera milhares de assinantes o limite vai estourar o que voce me recomenda"*

**O Modelo Recomendado para Escala:**
Construímos a regra de negócio para a IA baseada em três pilares:

1. **Traga Sua Chave (Bring Your Own Key - BYOK):** O assinante que tem alto volume de clientes é incentivado a colocar a própria chave dele (OpenAI, Gemini) no painel. O seu sistema não absorve custo nenhum da IA dele.
2. **A Carteira Exclusiva (Micro-cobrança):**
   * Separamos o saldo financeiro de IA do saldo de SMS/Cashback.
   * Se o assinante quer usar a IA *fornecida pela sua plataforma*, ele recarrega a Carteira de IA.
   * A plataforma cobra pequenas frações (Ex: R$ 0,05) por interação de IA, gerando margem enquanto usa serviços como o Gemini Pro ou Groq.
   * **Trava de Segurança:** Se o saldo zerar, a IA é instantaneamente bloqueada e o sistema volta ao "Menu Antigo (1, 2, 3)". Isso impede prejuízo operacional.
3. **Processamento Multimodal (Áudio):** Sim, modelos de nova geração (Gemini Flash e Groq com Whisper) conseguem transcrever áudios recebidos pelo WhatsApp. O robô puxará o arquivo, lerá em texto puro e devolverá uma resposta coesa com a intenção do cliente, simulando uma secretária real.

---

## 4. Estratégia de Fallback (Sobrevivência)
O que acontece se algo falhar?

**Sua dúvida:**
> *"pode cria a opção de adicionar 3 e implementar fallback caso uma falhar a outra assume?"*

**O Sistema em Cascata:**
O banco de dados e os processos em Edge Functions funcionarão com prioridades:
* Se a *IA Nível 1* (Chave do Assinante) estourar limite, o sistema tenta a *IA Nível 2* (Chave da Plataforma Gemini).
* Se a *Nível 2* falhar, tenta a *IA Nível 3* (Chave da Plataforma Groq).
* **Sobrevivência Absoluta:** Se toda a rede de Inteligência Artificial apresentar pane mundial ou o cliente estiver sem saldo, as requisições voltam IMEDIATAMENTE para o Menu de Botões ("Digite 1 para Cortes"). O fluxo do cliente final NUNCA morre no vazio.

## 5. Próximos Passos
O que faremos a seguir, assim que autorizado a mudança formal?
1. Configurar o banco de dados Supabase com a tabela isolada de `ai_credits_balance` e `ai_providers_cascade`.
2. Encerrar o ciclo com Twilio e focar no preparo das conexões tipo Webhook aguardando a futura integração com a VPS (Evolution API).
