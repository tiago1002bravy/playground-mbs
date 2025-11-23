# Playground - Teste de Agentes IA

Playground independente para testar e melhorar prompts de agentes de IA. Conecta diretamente ao OpenRouter, sem depender do backend principal.

## 🚀 Como usar

1. Instale as dependências:
```bash
yarn install
```

2. Configure a API Key do OpenRouter:
```bash
# Crie um arquivo .env.local na raiz do playground
OPENROUTER_API_KEY=sk-or-v1-sua-api-key-aqui
NEXT_PUBLIC_SITE_URL=http://localhost:3002
```

3. Execute o servidor de desenvolvimento:
```bash
yarn dev
```

4. Acesse: http://localhost:3002

## 📝 Funcionalidades

- ✅ **Backend próprio**: Conecta diretamente ao OpenRouter via API Routes do Next.js
- ✅ **Editor de System Prompt**: Edite prompts em tempo real
- ✅ **Chat de teste**: Teste o prompt com conversas reais
- ✅ **Seleção de modelo**: Escolha entre GPT-4o, GPT-4, GPT-3.5, Gemini, Claude
- ✅ **Salvar/Carregar**: Salve prompts no localStorage
- ✅ **Histórico de conversa**: Mantém contexto completo
- ✅ **Interface simples**: Focada em produtividade

## 🏗️ Arquitetura

```
Frontend (Next.js)
  ↓
API Route (/api/chat)
  ↓
OpenRouter SDK
  ↓
LLM Providers (OpenAI, Google, Anthropic, etc)
```

## 🔒 Segurança

- API Key armazenada em variável de ambiente
- `.env.local` está no `.gitignore`
- Backend roda server-side (API Routes do Next.js)

## 📦 Deploy na Vercel

1. Conecte o repositório na Vercel
2. Configure as variáveis de ambiente:
   - `OPENROUTER_API_KEY`: Sua chave do OpenRouter
   - `NEXT_PUBLIC_SITE_URL`: URL do seu site (ex: https://playground.vercel.app)
3. Deploy automático!

## 🎯 Uso

1. **Edite o System Prompt** no editor à esquerda
2. **Teste no chat** à direita
3. **Selecione o modelo** no dropdown
4. **Salve prompts** para reutilizar depois
5. **Limpe o histórico** quando necessário

## 💡 Dicas

- Use `Ctrl/Cmd + Enter` para enviar mensagem
- Prompts são salvos automaticamente no localStorage
- O histórico mantém contexto completo da conversa
- Teste diferentes modelos para comparar respostas

