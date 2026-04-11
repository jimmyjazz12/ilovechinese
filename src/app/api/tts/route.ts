import { NextRequest, NextResponse } from "next/server";

// This route is a placeholder for future TTS integration
// Currently the app uses the browser's built-in Web Speech API
export async function POST(req: NextRequest) {
  const { text, lang } = await req.json();

  return NextResponse.json({
    message: "TTS is handled client-side via Web Speech API",
    text,
    lang: lang || "zh-CN",
  });
}
