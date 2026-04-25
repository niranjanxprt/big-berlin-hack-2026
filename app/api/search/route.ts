import { NextResponse } from 'next/server';

import type { TavilyInput } from '../../lib/canvas/contracts';
import { createMockSearchPayload } from '../../lib/canvas/mock-content';

export async function POST(request: Request) {
  const body = (await request.json()) as TavilyInput;

  return NextResponse.json(createMockSearchPayload(body));
}
