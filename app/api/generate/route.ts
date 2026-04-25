import { NextResponse } from 'next/server';

import type { GenerateInput } from '../../lib/canvas/contracts';
import { createMockGenerationPayload } from '../../lib/canvas/mock-content';

export async function POST(request: Request) {
  const body = (await request.json()) as GenerateInput;

  return NextResponse.json(createMockGenerationPayload(body));
}
