// Gerenciamento de prompts salvos com versionamento

export interface SavedPrompt {
  id: string;
  name: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}

const STORAGE_KEY = 'playground_prompts';
const STORAGE_KEY_CURRENT = 'playground_current_prompt';

export const promptStorage = {
  // Salvar prompt com nome
  save: (name: string, content: string, notes?: string): SavedPrompt => {
    const prompts = promptStorage.getAll();
    const existing = prompts.find(p => p.name === name);
    
    const prompt: SavedPrompt = existing
      ? { ...existing, content, notes, updatedAt: new Date() }
      : {
          id: Date.now().toString(),
          name,
          content,
          notes,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

    if (existing) {
      const index = prompts.findIndex(p => p.id === existing.id);
      prompts[index] = prompt;
    } else {
      prompts.push(prompt);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
    return prompt;
  },

  // Listar todos os prompts
  getAll: (): SavedPrompt[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
      const prompts = JSON.parse(stored);
      return prompts.map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      }));
    } catch {
      return [];
    }
  },

  // Carregar prompt por ID
  getById: (id: string): SavedPrompt | null => {
    const prompts = promptStorage.getAll();
    return prompts.find(p => p.id === id) || null;
  },

  // Carregar prompt por nome
  getByName: (name: string): SavedPrompt | null => {
    const prompts = promptStorage.getAll();
    return prompts.find(p => p.name === name) || null;
  },

  // Deletar prompt
  delete: (id: string): void => {
    const prompts = promptStorage.getAll();
    const filtered = prompts.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  // Salvar prompt atual (temporário)
  saveCurrent: (content: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_CURRENT, content);
  },

  // Carregar prompt atual
  getCurrent: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEY_CURRENT);
  },

  // Exportar todos os prompts
  export: (): string => {
    const prompts = promptStorage.getAll();
    return JSON.stringify(prompts, null, 2);
  },

  // Importar prompts
  import: (json: string): { success: boolean; count: number; error?: string } => {
    try {
      const prompts = JSON.parse(json) as SavedPrompt[];
      if (!Array.isArray(prompts)) {
        return { success: false, count: 0, error: 'Formato inválido' };
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
      return { success: true, count: prompts.length };
    } catch (error: any) {
      return { success: false, count: 0, error: error.message };
    }
  },
};

