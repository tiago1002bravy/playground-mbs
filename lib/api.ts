// API para testar prompt customizado - usa API route do Next.js
export const testPrompt = async (
  prompt: string,
  messages: Array<{ role: string; content: string }>,
  model?: string
) => {
  const userMessage = messages[messages.length - 1]?.content || '';
  const historyMessages = messages.slice(0, -1); // Todas exceto a última

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemPrompt: prompt,
      messages: historyMessages,
      userMessage,
      model: model || 'openai/gpt-5.1',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao obter resposta');
  }

  return response.json();
};

