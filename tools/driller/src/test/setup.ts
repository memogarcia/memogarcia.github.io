import { beforeAll, vi } from 'vitest'

// Mock crypto.randomUUID for tests
beforeAll(() => {
  if (!globalThis.crypto) {
    globalThis.crypto = {
      randomUUID: vi.fn(() => 'test-uuid-' + Math.random().toString(36).substring(7))
    } as any
  }
})