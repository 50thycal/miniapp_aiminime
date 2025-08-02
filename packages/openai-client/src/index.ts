import OpenAI from 'openai'

export interface StyleMimicOptions {
  username: string
  sampleCasts: string[]
  targetCast: string
}

/**
 * Generates a reply imitating the user's public style.
 * Returns at most 140 characters to remain native to Warpcast.
 */
export async function generateStyleMimicReply(
  opts: StyleMimicOptions,
  apiKey: string,
): Promise<string> {
  const openai = new OpenAI({ apiKey })
  const examples = opts.sampleCasts.slice(0, 5).join('\n')

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `You are the AI twin of ${opts.username}.`,
    },
    {
      role: 'system',
      content:
        'Guidelines: keep the voice, brevity, emojis, inside jokes. Respond in <=140 characters.',
    },
    {
      role: 'system',
      content: `Examples:\n${examples}`,
    },
    {
      role: 'user',
      content: `Reply to: ${opts.targetCast}`,
    },
  ]

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    max_tokens: 80,
    temperature: 0.7,
  })

  return completion.choices[0]?.message.content?.trim() ?? ''
}