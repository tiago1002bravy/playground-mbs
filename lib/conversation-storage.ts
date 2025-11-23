// Gerenciamento de conversas de teste salvas

export interface SavedConversation {
  id: string;
  promptId?: string;
  promptName?: string;
  model: string;
  messages: Array<{ role: string; content: string; timestamp: string }>;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  createdAt: Date;
  notes?: string;
}

const STORAGE_KEY = 'playground_conversations';

export const conversationStorage = {
  // Salvar conversa
  save: (
    promptId: string | undefined,
    promptName: string | undefined,
    model: string,
    messages: Array<{ role: string; content: string; timestamp: Date }>,
    tokenUsage?: { promptTokens: number; completionTokens: number; totalTokens: number },
    notes?: string
  ): SavedConversation => {
    const conversations = conversationStorage.getAll();
    const conversation: SavedConversation = {
      id: Date.now().toString(),
      promptId,
      promptName,
      model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp.toISOString(),
      })),
      tokenUsage,
      createdAt: new Date(),
      notes,
    };

    conversations.unshift(conversation); // Adiciona no início
    // Manter apenas as últimas 50 conversas
    if (conversations.length > 50) {
      conversations.splice(50);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    return conversation;
  },

  // Listar todas as conversas
  getAll: (): SavedConversation[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
      const conversations = JSON.parse(stored);
      return conversations.map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt),
      }));
    } catch {
      return [];
    }
  },

  // Buscar conversas por prompt
  getByPrompt: (promptId: string): SavedConversation[] => {
    return conversationStorage.getAll().filter(c => c.promptId === promptId);
  },

  // Deletar conversa
  delete: (id: string): void => {
    const conversations = conversationStorage.getAll();
    const filtered = conversations.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  // Limpar todas as conversas
  clear: (): void => {
    localStorage.removeItem(STORAGE_KEY);
  },
};

