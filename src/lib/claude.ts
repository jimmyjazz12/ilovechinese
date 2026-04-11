import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const TEACHER_SYSTEM_PROMPT = `Tu es un professeur de mandarin patient et encourageant. Tu parles couramment le francais et le chinois mandarin.

Regles :
- Reponds toujours en francais sauf quand tu donnes des exemples en chinois.
- Quand tu donnes un mot ou une phrase en chinois, fournis toujours : les caracteres simplifies, le pinyin avec tons, et la traduction en francais.
- Corrige les erreurs de l'eleve avec bienveillance en expliquant pourquoi c'est faux et comment le corriger.
- Adapte ton niveau au HSK de l'eleve (indique dans le contexte).
- Utilise des exemples concrets et des phrases du quotidien.
- Si l'eleve fait une erreur de ton, explique la difference de sens entre les tons.
- Encourage l'eleve a pratiquer la prononciation et l'ecriture.
- Tu peux proposer des mini-exercices ou des quiz quand c'est pertinent.
- Sois concis dans tes reponses tout en restant complet.`

/**
 * Chat with the Mandarin teacher (Claude).
 *
 * @param messages - The conversation history.
 * @param systemContext - Extra context about the student (level, mastered words, etc.).
 * @returns The assistant's response text.
 */
export async function chatWithTeacher(
  messages: Array<{ role: string; content: string }>,
  systemContext: string
): Promise<string> {
  const systemPrompt = `${TEACHER_SYSTEM_PROMPT}\n\nContexte de l'eleve :\n${systemContext}`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  })

  const textBlock = response.content.find((block) => block.type === 'text')
  return textBlock ? textBlock.text : ''
}
