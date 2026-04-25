import { NextResponse } from 'next/server';

import type { GenerateInput } from '../../lib/canvas/contracts';
import { createMockGenerationPayload } from '../../lib/canvas/mock-content';
import {
  generateCanvasPayloadWithGemini,
  isGeminiConfigured,
} from '../../lib/providers/gemini';

export async function POST(request: Request) {
  const body = (await request.json()) as GenerateInput;

  if (!isGeminiConfigured() || body.type === 'animation') {
    return NextResponse.json(createMockGenerationPayload(body));
  }

  try {
    const payload = await generateCanvasPayloadWithGemini(body);
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(createMockGenerationPayload(body));
  }
}
