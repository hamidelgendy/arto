import { collectTrueKeys } from '../../utils'

describe('collectTrueKeys', () => {
  it('returns an empty set if no argument is provided', () => {
    const result = collectTrueKeys()
    expect(result).toEqual(new Set())
  })

  it('returns an empty set if all boolean values are false', () => {
    const result = collectTrueKeys({
      disabled: false,
      active: false,
    })
    expect(result).toEqual(new Set())
  })

  it('returns a set with a single active key when exactly one boolean is true', () => {
    const result = collectTrueKeys({
      disabled: true,
      loading: false,
    })
    // Only 'disabled' is true
    expect(result).toEqual(new Set(['disabled']))
  })

  it('returns a set with multiple active keys when several are true', () => {
    const result = collectTrueKeys({
      disabled: true,
      active: true,
      loading: false,
      hovered: true,
    })
    // Should have 'disabled', 'active', 'hovered'
    expect(result).toEqual(new Set(['disabled', 'active', 'hovered']))
  })

  it('returns an empty set if an empty object is passed', () => {
    const result = collectTrueKeys({})
    expect(result).toEqual(new Set())
  })

  it('handles partial records, ignoring any missing keys', () => {
    // e.g. if TKeys is 'disabled' | 'active' | 'hovered' but we only pass { active:true }
    const result = collectTrueKeys({
      active: true,
    })
    expect(result).toEqual(new Set(['active']))
  })
})
