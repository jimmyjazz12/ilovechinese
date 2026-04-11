import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { response: "Clé API Anthropic non configurée. Ajoutez ANTHROPIC_API_KEY dans .env.local" },
        { status: 200 }
      );
    }

    const systemPrompt = `Tu es Prof Wang (王老师), un professeur de mandarin patient et enthousiaste. Tu parles français avec ton élève.

CONTEXTE DE L'ÉLÈVE :
- Niveau actuel : HSK ${context.hsk_level || 1}
- Mots maîtrisés : ${context.words_mastered || 0}
- Quelques mots maîtrisés : ${(context.mastered_list || []).join(", ") || "aucun pour l'instant"}
- XP total : ${context.xp_total || 0}

RÈGLES :
1. Parle principalement en français, insère du chinois quand c'est pédagogique
2. Utilise toujours le pinyin avec les tons (ā á ǎ à) à côté des caractères
3. Adapte ton vocabulaire au niveau HSK de l'élève
4. Corrige les erreurs avec bienveillance et explique pourquoi
5. Propose des exercices pratiques quand approprié
6. Fais des liens entre les caractères pour aider la mémorisation
7. Encourage l'élève et célèbre ses progrès
8. Si l'élève écrit en chinois, corrige et commente
9. Utilise des exemples de la vie quotidienne
10. Rappelle les règles de ton quand pertinent (ton 3 + ton 3 = ton 2 + ton 3, etc.)

Tu te souviens des conversations précédentes et tu fais référence aux sujets déjà abordés pour montrer que tu suis la progression de l'élève.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const textContent = response.content.find((c) => c.type === "text");
    const responseText = textContent ? textContent.text : "Désolé, je n'ai pas compris.";

    return NextResponse.json({ response: responseText });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { response: "Erreur du serveur. Vérifiez votre clé API." },
      { status: 200 }
    );
  }
}
