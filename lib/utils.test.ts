import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('merges plain class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('drops falsy values', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b')
  })

  it('resolves conflicting tailwind utility classes', () => {
    // tailwind-merge should keep only the last conflicting padding class
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })
})
