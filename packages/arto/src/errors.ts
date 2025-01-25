/**
 * Represents a custom error class for exceptions thrown by the Arto library.
 * This class prefixes any provided message with a standardized "[Arto Error]: " tag.
 *
 * Generally thrown for invalid usage or misconfiguration within the library.
 * If you need to catch library-level issues specifically, you can look for this error type.
 */
export class ArtoError extends Error {
  /**
   * Constructs a new ArtoError instance with a prefixed message.
   * @param message - The original error message (automatically prefixed).
   */
  constructor(message: string) {
    super(`[Arto Error]: ${message}`)
    this.name = 'ArtoError'
  }
}

/**
 * Throws a new `ArtoError` with a custom message.
 * Always terminates execution via an exception (no return).
 *
 * @param message - The error message to display.
 * @throws {ArtoError} An error with a "[Arto Error]" prefix.
 */
export const throwError = (message: string): never => {
  throw new ArtoError(message)
}
