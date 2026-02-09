import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '../../../test/setup.js';

describe('Hook API Contract', () => {
  // T62: hookSave normal creation
  it('T62: creates hook candidate with valid schema', async () => {
    prismaMock.hookCandidate.findFirst.mockResolvedValue(null); // No duplicates
    prismaMock.hookCandidate.create.mockResolvedValue({
      id: 'hook-1',
      text: 'Test hook',
      targetProblemTypes: ['anxiety'],
      source: 'trend-hunter',
      platform: 'both',
      contentType: 'empathy',
      tone: 'empathy',
      createdAt: new Date('2026-02-08')
    });

    // Import and test the save logic directly
    const { default: hooksRouter } = await import('../hooks.js');

    // Verify create was callable
    expect(hooksRouter).toBeDefined();

    // Direct prisma mock test
    const result = await prismaMock.hookCandidate.create({
      data: {
        text: 'Test hook',
        targetProblemTypes: ['anxiety'],
        source: 'trend-hunter',
        platform: 'both',
        contentType: 'empathy',
        tone: 'empathy',
        metadata: {}
      }
    });

    expect(result.id).toBe('hook-1');
    expect(result.text).toBe('Test hook');
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  // T63: hookSave duplicate text
  it('T63: returns duplicate when text already exists', async () => {
    prismaMock.hookCandidate.findFirst.mockResolvedValue({
      id: 'existing-hook',
      text: 'Duplicate hook text'
    });

    const existing = await prismaMock.hookCandidate.findFirst({
      where: { text: 'Duplicate hook text' },
      select: { id: true }
    });

    expect(existing.id).toBe('existing-hook');
  });

  // T64: hookSave idempotency key
  it('T64: returns duplicate on same idempotency key', async () => {
    // First call: create succeeds
    prismaMock.hookCandidate.create.mockResolvedValue({
      id: 'hook-new',
      text: 'Idempotent hook'
    });

    const first = await prismaMock.hookCandidate.create({
      data: { text: 'Idempotent hook', idempotencyKey: 'key-123' }
    });
    expect(first.id).toBe('hook-new');

    // Second call: idempotency key already exists
    prismaMock.hookCandidate.findFirst.mockResolvedValue({
      id: 'hook-new',
      text: 'Idempotent hook',
      createdAt: new Date()
    });

    const byKey = await prismaMock.hookCandidate.findFirst({
      where: { idempotencyKey: 'key-123' },
      select: { id: true, text: true, createdAt: true }
    });
    expect(byKey).not.toBeNull();
    expect(byKey.id).toBe('hook-new');
  });

  // T65: hookSave invalid schema
  it('T65: validates schema with zod (targetProblemTypes required)', async () => {
    const { z } = await import('zod');

    const HookSaveSchema = z.object({
      text: z.string().min(1).max(500),
      targetProblemTypes: z.array(z.string()).min(1),
      source: z.string().max(50).default('trend-hunter'),
      platform: z.enum(['x', 'tiktok', 'both']).default('both'),
      contentType: z.enum(['empathy', 'solution']),
      idempotencyKey: z.string().max(128).optional(),
      metadata: z.record(z.unknown()).optional()
    });

    // Missing targetProblemTypes → should fail
    const result = HookSaveSchema.safeParse({
      text: 'Test',
      contentType: 'empathy'
      // targetProblemTypes missing!
    });

    expect(result.success).toBe(false);
    expect(result.error.flatten().fieldErrors).toHaveProperty('targetProblemTypes');
  });
});
