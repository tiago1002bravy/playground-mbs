'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Download, Upload, X, Copy, Check } from 'lucide-react';
import { testPrompt } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export default function PlaygroundPage() {
  const [systemPrompt, setSystemPrompt] = useState(`# AGENTE BRIEFING MASTER — VERSÃO COMPACTA REFINADA

Você é um consultor sênior conduzindo um briefing estratégico com um cliente que investiu R$ 25.000 em mentoria. Sua missão é coletar informações essenciais de forma consultiva, inteligente e estruturada.

---
## FLUXO OBRIGATÓRIO (5 ETAPAS)

1. **Pergunta**: faça apenas UMA pergunta clara e objetiva.
2. **Processamento da resposta**: demonstre compreensão, resuma em 1–2 frases e faça apenas UMA pergunta de clarificação se necessário.
3. **Confirmação**: pergunte somente uma vez: "Está correto?".
4. **Formatação para o banco (após confirmar)**:
\`\`\`
[DADO LIMPO PARA O BANCO]

Perfeito! Confirme esta resposta no checklist clicando em ''Confirmar resposta''.
\`\`\`
5. **Próxima pergunta**: avance somente após o usuário sinalizar "confirmado", "ok", "pronto".

---
## REGRAS CRÍTICAS

### Nunca:
- Repetir "Está correto?" após confirmação
- Fazer múltiplas perguntas juntas
- Pular orientação do checklist
- Poluir o dado limpo na ETAPA 4
- Agir como formulário automático

### Sempre:
- 1 pergunta por vez
- Demonstrar compreensão real
- Adaptar o tom ao cliente
- Manter contexto das respostas anteriores
- Aguardar confirmação do checklist antes de prosseguir`);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState('openai/gpt-5.1');
  const [promptName, setPromptName] = useState('prompt');
  const [totalTokens, setTotalTokens] = useState({ input: 0, output: 0, total: 0 });
  const [copied, setCopied] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFileName, setExportFileName] = useState('');

  // Modelos disponíveis (mesmos do frontend principal)
  const AVAILABLE_MODELS = [
    { id: 'openai/gpt-5.1', name: 'GPT 5.1' },
    { id: 'openai/gpt-5-mini-2025-08-07', name: 'GPT 5 (mini)' },
    { id: 'anthropic/claude-4.5-sonnet-20250929', name: 'Claude 4.5 Sonnet' },
    { id: 'google/gemini-3-pro-preview-20251117', name: 'Gemini 3 Pro (preview)' },
    { id: 'x-ai/grok-4.1-fast', name: 'Grok 4.1 Fast' },
    { id: 'qwen/qwen3-coder-30b-a3b-instruct', name: 'Qwen 3 Coder 30B' },
    { id: 'deepseek/deepseek-v3-base', name: 'DeepSeek V3 Base' },
    { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { id: 'anthropic/claude-4-sonnet-20250522', name: 'Claude 4 Sonnet' },
    { id: 'meta-llama/llama-4-maverick', name: 'Llama 4 Maverick' },
    { id: 'mistralai/mistral-small-3.1-24b-instruct', name: 'Mistral Small 3.1 24B Instruct' },
  ];

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Preparar mensagens para o LLM (incluindo histórico)
      const llmMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage.content },
      ];

      const response = await testPrompt(systemPrompt, llmMessages, model);
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.content || response.message || 'Erro ao obter resposta',
        timestamp: new Date(),
        tokenUsage: response.usage,
      };

      // Atualizar estatísticas de tokens
      if (response.usage) {
        setTotalTokens(prev => ({
          input: prev.input + response.usage.promptTokens,
          output: prev.output + response.usage.completionTokens,
          total: prev.total + response.usage.totalTokens,
        }));
      }

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: `Erro: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (confirm('Deseja limpar todo o histórico de mensagens?')) {
      setMessages([]);
      setTotalTokens({ input: 0, output: 0, total: 0 });
    }
  };


  const handleExportPrompt = () => {
    setExportFileName(promptName || 'prompt');
    setShowExportModal(true);
  };

  const handleConfirmExport = () => {
    // Formatar como Markdown
    let markdown = `# ${exportFileName || promptName || 'Prompt'}\n\n`;
    
    markdown += `## System Prompt\n\n${systemPrompt}\n\n`;
    
    // Criar e baixar arquivo .md
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = exportFileName.trim() || promptName || 'prompt';
    // Remover caracteres inválidos do nome do arquivo
    const sanitizedFileName = fileName.replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
    a.download = `${sanitizedFileName}.md`;
    a.click();
    URL.revokeObjectURL(url);
    
    setShowExportModal(false);
    setExportFileName('');
  };

  const handleImportPrompt = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        
        // Verificar se é JSON ou Markdown
        if (file.name.endsWith('.json')) {
          const data = JSON.parse(content);
          
          if (data.content) {
            setSystemPrompt(data.content);
            if (data.name) {
              setPromptName(data.name);
            }
            alert('Prompt importado com sucesso!');
          } else {
            alert('Arquivo inválido. Deve conter um campo "content".');
          }
        } else if (file.name.endsWith('.md')) {
          // Extrair conteúdo do Markdown
          // Procura pela seção "## System Prompt" ou usa todo o conteúdo após o título
          const systemPromptMatch = content.match(/##\s+System\s+Prompt\s*\n\n([\s\S]*?)(?=\n\n---|\n*$)/i);
          
          let promptContent = '';
          if (systemPromptMatch && systemPromptMatch[1]) {
            // Extrai o conteúdo da seção System Prompt
            promptContent = systemPromptMatch[1].trim();
          } else {
            // Se não encontrar a seção, tenta extrair de bloco de código
            const codeBlockRegex = /```[\s\S]*?```/g;
            const codeMatches = content.match(codeBlockRegex);
            if (codeMatches && codeMatches.length > 0) {
              promptContent = codeMatches[0].replace(/```/g, '').trim();
            } else {
              // Se não encontrar nada, usa o conteúdo completo (pula título e notas)
              const lines = content.split('\n');
              let startIndex = 0;
              // Pula o título (# ...)
              if (lines[0]?.startsWith('#')) startIndex = 1;
              // Pula notas se existirem
              const notesIndex = lines.findIndex((line, idx) => idx > startIndex && line.startsWith('## Notas'));
              if (notesIndex !== -1) {
                const systemPromptIndex = lines.findIndex((line, idx) => idx > notesIndex && line.startsWith('## System Prompt'));
                if (systemPromptIndex !== -1) {
                  startIndex = systemPromptIndex + 1;
                }
              }
              promptContent = lines.slice(startIndex).join('\n').replace(/^---.*$/gm, '').trim();
            }
          }
          
          if (!promptContent) {
            alert('Não foi possível extrair o prompt do arquivo Markdown.');
            return;
          }
          
          setSystemPrompt(promptContent);
          
          // Tenta extrair o nome do título
          const titleMatch = content.match(/^#\s+(.+)$/m);
          const importedName = titleMatch ? titleMatch[1].trim() : file.name.replace('.md', '');
          setPromptName(importedName);
          
          alert('Prompt importado com sucesso!');
        } else {
          alert('Formato de arquivo não suportado. Use .json ou .md');
        }
      } catch (error) {
        alert('Erro ao importar prompt. Verifique o formato do arquivo.');
      }
    };
    reader.readAsText(file);
  };


  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(systemPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-4 h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                🧪 Playground - Laboratório de Prompts
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Desenvolva e teste prompts antes de colocar em produção
              </p>
            </div>
          </div>
          
          {/* Contador de Tokens */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Tokens Totais
                  </div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {totalTokens.total.toLocaleString('pt-BR')}
                  </div>
                </div>
                <div className="h-12 w-px bg-gray-300 dark:bg-gray-600"></div>
                <div>
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Input
                  </div>
                  <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                    {totalTokens.input.toLocaleString('pt-BR')}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Output
                  </div>
                  <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                    {totalTokens.output.toLocaleString('pt-BR')}
                  </div>
                </div>
                <div className="h-12 w-px bg-gray-300 dark:bg-gray-600"></div>
                <div>
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Modelo
                  </div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {AVAILABLE_MODELS.find(m => m.id === model)?.name || model}
                  </div>
                </div>
              </div>
              {totalTokens.total > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Deseja resetar o contador de tokens?')) {
                      setTotalTokens({ input: 0, output: 0, total: 0 });
                    }
                  }}
                  className="px-3 py-1.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Resetar
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden">
          {/* Editor de Prompt */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  System Prompt
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyPrompt}
                    className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center gap-1"
                    title="Copiar prompt"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                  <button
                    onClick={handleExportPrompt}
                    className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-1"
                    title="Exportar"
                  >
                    <Download size={12} />
                  </button>
                  <button
                    onClick={handleImportPrompt}
                    className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-1"
                    title="Importar"
                  >
                    <Upload size={12} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.md"
                    onChange={handleFileImport}
                    className="hidden"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Prompt:
                </label>
                <input
                  type="text"
                  value={promptName}
                  onChange={(e) => setPromptName(e.target.value)}
                  placeholder="nome-do-prompt"
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
            </div>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="flex-1 p-4 border-0 resize-none focus:outline-none font-mono text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
              placeholder="Digite o system prompt aqui..."
            />
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Modelo:
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                {AVAILABLE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Chat */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Chat de Teste
              </h2>
              <button
                onClick={handleReset}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Limpar
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                  <p>Nenhuma mensagem ainda.</p>
                  <p className="text-sm mt-2">Comece enviando uma mensagem abaixo.</p>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                    <div className={`text-xs mt-1 flex items-center gap-2 ${
                      msg.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      <span>{msg.timestamp.toLocaleTimeString('pt-BR')}</span>
                      {msg.tokenUsage && (
                        <span className="opacity-75">
                          • {msg.tokenUsage.totalTokens.toLocaleString('pt-BR')} tokens
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-gray-600 dark:text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Pensando...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={2}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Exportar Prompt */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Exportar Prompt
              </h3>
              <button
                onClick={() => {
                  setShowExportModal(false);
                  setExportFileName('');
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome do arquivo:
                </label>
                <input
                  type="text"
                  value={exportFileName}
                  onChange={(e) => setExportFileName(e.target.value)}
                  placeholder="nome-do-arquivo"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleConfirmExport();
                    } else if (e.key === 'Escape') {
                      setShowExportModal(false);
                      setExportFileName('');
                    }
                  }}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  O arquivo será salvo como <strong>{exportFileName || 'prompt'}.md</strong>
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowExportModal(false);
                    setExportFileName('');
                  }}
                  className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmExport}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Exportar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
