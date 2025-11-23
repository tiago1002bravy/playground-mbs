import { NextRequest, NextResponse } from 'next/server';
import { OpenRouter } from '@openrouter/sdk';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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';

const openRouter = new OpenRouter({
  apiKey: OPENROUTER_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { systemPrompt, messages, userMessage, model } = body;

    if (!systemPrompt || !userMessage) {
      return NextResponse.json(
        { error: 'systemPrompt e userMessage são obrigatórios' },
        { status: 400 }
      );
    }

    // Preparar mensagens para o OpenRouter
    const llmMessages: any[] = [
      { role: 'system', content: systemPrompt },
      ...(messages || []).filter((m: any) => m.role !== 'system').map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: userMessage },
    ];

    // Chamar OpenRouter
    const completion = await openRouter.chat.send(
      {
        model: model || 'openai/gpt-5.1',
        messages: llmMessages,
        temperature: 0.7,
      },
      {
        headers: {
          'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002',
          'X-Title': 'Playground - Teste de Agentes IA',
        },
      } as any
    );

    if (!completion || !completion.choices || completion.choices.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma resposta do LLM' },
        { status: 500 }
      );
    }

    const choice = completion.choices[0];
    const message = choice.message;

    // Normalizar conteúdo
    let content = '';
    if (typeof message?.content === 'string') {
      content = message.content;
    } else if (Array.isArray(message?.content)) {
      content = message.content
        .map((part: any) => {
          if (typeof part === 'string') return part;
          if (part?.text) return part.text;
          if (part?.content) return part.content;
          return '';
        })
        .filter(Boolean)
        .join('\n');
    }

    // Normalizar usage
    const usage: any = completion.usage || {};
    const normalizedUsage = {
      promptTokens: usage.promptTokens || usage.prompt_tokens || usage.prompt || 0,
      completionTokens: usage.completionTokens || usage.completion_tokens || usage.completion || 0,
      totalTokens: usage.totalTokens || usage.total_tokens || (usage.promptTokens || 0) + (usage.completionTokens || 0),
    };

    return NextResponse.json({
      content,
      model: completion.model || model || 'openai/gpt-5.1',
      usage: normalizedUsage,
    });
  } catch (error: any) {
    console.error('Erro ao chamar OpenRouter:', error);
    return NextResponse.json(
      {
        error: error.message || 'Erro ao processar requisição',
        details: error.response?.data || error.stack,
      },
      { status: 500 }
    );
  }
}

