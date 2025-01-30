import { describe, it, expect } from 'vitest'
import { isClassNameType } from '../../utils'

describe('isClassNameType', () => {
  it('returns true for a string input', () => {
    const input = 'some-class'
    expect(isClassNameType(input)).toBe(true)
  })

  it('returns true for an array input', () => {
    const input = ['class-a', 'class-b']
    expect(isClassNameType(input)).toBe(true)
  })

  it('returns true for a callback function', () => {
    const fn = () => 'some-class'
    expect(isClassNameType(fn)).toBe(true)
  })

  it('returns false for null or undefined', () => {
    expect(isClassNameType(null)).toBe(false)
    expect(isClassNameType(undefined)).toBe(false)
  })

  it('returns false for an object', () => {
    const obj = { foo: 'bar' }
    expect(isClassNameType(obj)).toBe(false)
  })

  it('returns false for a number', () => {
    expect(isClassNameType(42)).toBe(false)
    expect(isClassNameType(3.14)).toBe(false)
  })

  it('returns false for a boolean', () => {
    expect(isClassNameType(true)).toBe(false)
    expect(isClassNameType(false)).toBe(false)
  })

  it('returns false for a symbol', () => {
    const sym = Symbol('test')
    expect(isClassNameType(sym)).toBe(false)
  })

  it('returns false for a bigInt', () => {
    // BigInt literals require "ES2020" or higher in tsconfig's "target"
    const bigNum = BigInt(9007199254740991)
    expect(isClassNameType(bigNum)).toBe(false)
  })

  it('returns false if the array contains unexpected types but shallowly passes', () => {
    // We test the "shallow" nature: an array is recognized as "true",
    // even if it might contain invalid items like an object or number.
    // That deeper check occurs in normalizeClassName, not here.
    const input = ['valid-string', 123, { nested: true }]
    expect(isClassNameType(input)).toBe(true)
    // This is exactly the shallow pass. We *do not* validate the array contents here.
  })
})
