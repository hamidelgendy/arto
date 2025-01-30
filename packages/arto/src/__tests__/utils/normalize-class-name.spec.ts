import { normalizeClassName } from '../../utils'
import type { ClassNameCallback } from '../../types'

describe('normalizeClassName', () => {
  it('handles a simple string input', () => {
    const result = normalizeClassName('btn btn-primary')
    expect(result).toEqual(['btn', 'btn-primary'])
  })

  it('splits multiple spaces and ignores empty fragments', () => {
    const result = normalizeClassName('  foo   bar   ')
    expect(result).toEqual(['foo', 'bar'])
  })

  it('handles an array of strings', () => {
    const result = normalizeClassName(['foo', 'bar'])
    expect(result).toEqual(['foo', 'bar'])
  })

  it('deduplicates duplicates in an array', () => {
    const result = normalizeClassName(['foo', 'bar', 'foo', 'foo', 'bar'])
    // We expect only one 'foo' and one 'bar'
    expect(result).toEqual(['foo', 'bar'])
  })

  it('handles nested arrays', () => {
    const result = normalizeClassName(['foo', ['bar', 'baz', ['qux']], 'foo'])
    // Should flatten everything into unique
    expect(result).toEqual(['foo', 'bar', 'baz', 'qux'])
  })

  it('handles a callback returning a string', () => {
    const callback = vi.fn().mockReturnValue('cb-result')
    const result = normalizeClassName(callback)
    // The callback should have been called once with no context
    expect(callback).toHaveBeenCalledTimes(1)
    expect(result).toEqual(['cb-result'])
  })

  it('handles a callback returning an array', () => {
    const callback = vi.fn().mockReturnValue(['cb1', 'cb2'])
    const result = normalizeClassName(callback)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(result).toEqual(['cb1', 'cb2'])
  })

  it('skips falsy returns from callbacks', () => {
    // If the callback returns false or undefined, no classes are added
    const callback = vi.fn().mockReturnValue(false)
    const result = normalizeClassName(callback)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(result).toEqual([])
  })

  it('handles a callback that itself returns nested arrays', () => {
    const callback = vi.fn().mockReturnValue(['cb1', ['cb2', 'cb3']])
    const result = normalizeClassName(callback)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(result).toEqual(['cb1', 'cb2', 'cb3'])
  })

  it('warns on unsupported types (e.g. object), skipping them', () => {
    // We'll mock console.warn to verify it's called
    const warnSpy = vi.spyOn(global.console, 'warn').mockImplementation(() => {})

    const result = normalizeClassName([
      // @ts-expect-error Testing invalid object input
      { foo: 'bar' },
      'valid-string',
    ])
    // The object item is unhandled, so only "valid-string" should appear
    expect(result).toEqual(['valid-string'])
    expect(warnSpy).toHaveBeenCalled()

    warnSpy.mockRestore()
  })

  it('handles cyclical function references gracefully (warn and skip)', () => {
    const warnSpy = vi.spyOn(global.console, 'warn').mockImplementation(() => {})

    // Create a function that references itself
    const cycFn = function () {
      return cycFn
    } as unknown as ClassNameCallback<unknown>

    const result = normalizeClassName(cycFn)
    // Should warn about a cyclic function, skip deeper evaluation
    expect(result).toEqual([])
    expect(warnSpy).toHaveBeenCalledWith('Cyclic class function detected:', cycFn)

    warnSpy.mockRestore()
  })

  it('throws an error if a callback itself throws', () => {
    const errorFn = () => {
      throw new Error('Callback error')
    }

    expect(() => normalizeClassName(errorFn)).toThrow(
      '[Arto Error]: Error resolving class function: Callback error',
    )
  })

  it('passes context to callback if provided', () => {
    // The context might be an object with some data
    type Context = { user: string }
    const context: Context = { user: 'alice' }

    const callback = vi.fn((ctx: Context) => {
      return ctx?.user === 'alice' ? 'user-alice' : 'no-user'
    }) as ClassNameCallback<Context>

    const result = normalizeClassName(callback, context)
    expect(callback).toHaveBeenCalledWith(context)
    expect(result).toEqual(['user-alice'])
  })
})
