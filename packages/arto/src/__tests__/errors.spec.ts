import { ArtoError, throwError } from '../errors'

describe('ArtoError', () => {
  it('prefixes the message with "[Arto Error]: "', () => {
    const err = new ArtoError('Something bad happened')
    expect(err.message).toBe('[Arto Error]: Something bad happened')
  })

  it('is an instance of Error and has name="ArtoError"', () => {
    const err = new ArtoError('Test error')
    expect(err).toBeInstanceOf(Error)

    expect(err.name).toBe('ArtoError')
  })
})

describe('throwError', () => {
  it('throws an ArtoError with prefixed message', () => {
    expect(() => throwError('Test message')).toThrow(ArtoError)
    expect(() => throwError('Test message')).toThrow('[Arto Error]: Test message')
  })

  it('never returns (has TypeScript "never" type)', () => {
    // We can confirm it always throws:
    let reached = false

    try {
      throwError('Will definitely throw')
      reached = true // we should never get here
    } catch {
      // Expected path: we catch the thrown error
    }
    expect(reached).toBe(false) // Confirm code never reached
  })
})
