# VozzySmart

> Automação de WhatsApp com IA integrada. Dispare campanhas, converse com clientes e deixe agentes de IA atenderem por você.

## Sobre

**VozzySmart** é uma plataforma completa de automação de WhatsApp que ajuda você a se comunicar com clientes de forma mais inteligente e produtiva.

### Por que escolher VozzySmart?

- **Instalação em minutos**: Deploy na Vercel + wizard que configura tudo
- **Campanhas em massa**: Dispare mensagens para milhares de contatos com templates aprovados
- **Inbox em tempo real**: Converse com clientes direto do navegador
- **Agentes de IA**: Deixe a IA responder automaticamente com contexto personalizado
- **Memória de conversas**: A IA lembra do histórico de cada cliente
- **Funciona em qualquer lugar**: Instale como app (PWA) e receba notificações

---

## O que você pode fazer

### Campanhas de WhatsApp

- Dispare mensagens para toda sua base de contatos
- Use templates aprovados pela Meta (marketing, utilidade, autenticação)
- Acompanhe métricas em tempo real (enviados, entregues, lidos)
- Pré-validação antes do disparo para evitar erros
- Reenvio automático para contatos que falharam

### Inbox (Chat em tempo real)

- Receba mensagens de clientes direto no navegador
- Responda manualmente ou deixe a IA atender
- Veja histórico completo de cada conversa
- Notificações push quando chegam mensagens

### Agentes de IA

- Configure agentes com personalidade e instruções
- A IA responde automaticamente às mensagens
- Memória persistente: a IA lembra do contexto de cada cliente
- Logs completos de todas as interações

### Gestão de Contatos

- Importe contatos via CSV
- Campos personalizados para segmentação
- Status de opt-in/opt-out automático
- Validação de números no formato internacional

### Templates do WhatsApp

- Sincronize templates aprovados da sua conta Meta
- Visualize preview antes de usar
- Crie novos templates direto da plataforma

### Lead Forms

- Crie formulários de captura embeddáveis
- Receba leads automaticamente na plataforma

---

## Instalação Rápida

> **Tempo estimado**: 15-20 minutos

### O que você vai fazer

1. Rodar o wizard de instalação
2. Começar a usar!

### Pré-requisitos

Antes de começar, você precisa de contas nestes serviços:

| Serviço | Para quê | Link |
|---------|----------|------|
| **GitHub** | Código do projeto | [github.com](https://github.com/) |
| **Vercel** | Hospedagem | [vercel.com](https://vercel.com/) |
| **Supabase** | Banco de dados | [supabase.com](https://supabase.com/) |
| **Upstash** | QStash (fila) + Redis (cache) | [upstash.com](https://upstash.com/) |
| **Meta Business** | API do WhatsApp (depois) | [business.facebook.com](https://business.facebook.com/) |

> **Dica**: Crie as contas antes de começar e deixe abertas em abas diferentes.

## Primeiros Passos

### 1. Fazer login

Acesse o sistema e faça login com o **email** e **senha** que você configurou no wizard.

### 2. Configurar WhatsApp

1. Vá em **Configurações**
2. Na seção **WhatsApp**, preencha:
   - Phone Number ID
   - Business Account ID
   - Access Token
3. Configure o **Webhook** no Meta Business Suite:
   - URL: `https://seu-dominio.com/api/webhook`
   - Verify Token: o mesmo que você configurou

### 3. Sincronizar templates

1. Vá em **Templates**
2. Clique em **Sincronizar**
3. Seus templates aprovados aparecerão na lista

### 4. Importar contatos

1. Vá em **Contatos**
2. Clique em **Importar CSV**
3. Mapeie as colunas (nome, telefone, etc.)
4. Importe!

### 5. Criar sua primeira campanha

1. Vá em **Campanhas** → **Nova Campanha**
2. Escolha um template
3. Selecione os contatos
4. Rode o **Precheck** para validar
5. Dispare!

### 6. Testar o Inbox

1. Vá em **Inbox**
2. Peça para alguém enviar uma mensagem para seu número
3. A mensagem aparecerá em tempo real!

---

## Como Usar

### Navegação Principal

O VozzySmart tem estas áreas principais:

- **Campanhas**: Criar e gerenciar disparos em massa
- **Contatos**: Lista de contatos e importação
- **Templates**: Templates do WhatsApp
- **Inbox**: Chat em tempo real com clientes
- **Configurações**: WhatsApp, IA, Integrações

### Disparando uma Campanha

1. Vá em **Campanhas** → **Nova Campanha**
2. Dê um nome para a campanha
3. Escolha o template que quer usar
4. Selecione os contatos (pode filtrar por tags)
5. Clique em **Precheck** para validar
6. Se tudo estiver OK, clique em **Disparar**
7. Acompanhe as métricas em tempo real

### Usando o Inbox

O Inbox mostra todas as conversas com clientes:

1. Clique em uma conversa para ver o histórico
2. Digite sua mensagem e envie
3. Ou ative o **AI Agent** para responder automaticamente

### Configurando AI Agents

Para ter respostas automáticas:

1. Vá em **Configurações → IA**
2. Configure uma chave de API (Gemini, OpenAI ou Anthropic)
3. Vá em **Agentes**
4. Crie um agente com:
   - Nome
   - Instruções (prompt do sistema)
   - Configurações de memória
5. Ative o agente

---

## Configurações

### WhatsApp

Você precisa de uma conta no Meta Business Suite com acesso à Cloud API.

**O que configurar:**
- **Phone Number ID**: ID do número de telefone
- **Business Account ID**: ID da conta business
- **Access Token**: Token de acesso (permanente recomendado)
- **Verify Token**: Token para verificação do webhook

### Inteligência Artificial

Para usar AI Agents, configure uma chave de API:

| Provedor | Onde conseguir |
|----------|----------------|
| **Google Gemini** | [Google AI Studio](https://makersuite.google.com/app/apikey) |
| **OpenAI** | [platform.openai.com](https://platform.openai.com/api-keys) |
| **Anthropic** | [console.anthropic.com](https://console.anthropic.com/) |

Depois:
1. Vá em **Configurações → IA**
2. Cole a chave de API
3. Escolha o modelo
4. Salve

### Upstash (QStash + Redis)

O VozzySmart usa dois serviços do Upstash:

**QStash** - Fila para processar campanhas em lote:
- Vá em [upstash.com](https://upstash.com/) → QStash
- Copie o `QSTASH_TOKEN`

**Redis** - Cache e dados de sessão:
- Vá em [upstash.com](https://upstash.com/) → Redis → Create Database
- Copie `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`

> Ambos são configurados automaticamente pelo wizard.

---

## Problemas Comuns

### Não consigo fazer login

**Possíveis causas:**
- Senha incorreta
- Wizard não foi completado

**Solução:**
- Verifique se completou a instalação via wizard
- Confirme a senha que você configurou
- Veja a seção [FAQ → Como resetar minha senha?](#como-resetar-minha-senha)

### Mensagens não estão sendo enviadas

**Possíveis causas:**
- Credenciais do WhatsApp incorretas
- Token expirado
- Template não aprovado

**Solução:**
1. Verifique as credenciais em **Configurações**
2. Confirme que o template está aprovado no Meta
3. Veja os logs da campanha para erros específicos

### Webhook não recebe mensagens

**Possíveis causas:**
- URL do webhook incorreta
- Verify token não confere
- Webhook não configurado no Meta

**Solução:**
1. Verifique se a URL está correta: `https://seu-dominio.com/api/webhook`
2. Confirme o verify token nas duas pontas
3. Teste com: `curl "https://seu-dominio.com/api/webhook?hub.verify_token=SEU_TOKEN&hub.challenge=test&hub.mode=subscribe"`

### AI Agent não responde

**Possíveis causas:**
- Chave de API não configurada
- Agente não está ativo
- Créditos da API esgotados

**Solução:**
1. Vá em **Configurações → IA**
2. Verifique se a chave está preenchida
3. Confirme que o agente está ativo
4. Verifique os logs do agente

### Campanha travou

**Possíveis causas:**
- Problema no QStash
- Erro no template

**Solução:**
1. Veja o status em **Campanhas**
2. Clique na campanha para ver detalhes
3. Se necessário, pause e retome

### Push notifications não funcionam

**Possíveis causas:**
- PWA não instalado
- Permissões negadas

**Solução:**
1. Instale o app como PWA (adicionar à tela inicial)
2. Aceite as permissões de notificação
3. Em iOS, precisa adicionar à tela inicial primeiro

---

## FAQ

### Como resetar minha senha?

1. Acesse vercel.com e faça login
2. Clique no seu projeto VozzySmart
3. Clique em **Settings** (menu da esquerda)
4. Clique em **Environment Variables**
5. Ache `MASTER_PASSWORD` na lista
6. Clique nos 3 pontinhos do lado direito → **Edit**
7. Apague tudo e digite sua nova senha (ex: `MinhaSenha123`)
8. Clique em **Save**
9. Clique em **Deployments** (menu da esquerda)
10. No primeiro da lista, clique nos 3 pontinhos → **Redeploy** → **Redeploy**
11. Espera 1 minuto
12. Pronto! Entra com a nova senha.

---

### Estrutura do Projeto

```
VozzySmart/
├── app/                 # Rotas Next.js (App Router)
│   ├── (auth)/          # Páginas de auth (login, install)
│   ├── (dashboard)/     # Páginas do dashboard
│   └── api/             # API Routes
├── components/          # Componentes React
├── hooks/               # Hooks customizados
├── lib/                 # Bibliotecas e utilitários
├── services/            # Camada de acesso à API
└── supabase/            # Migrations do banco
```

