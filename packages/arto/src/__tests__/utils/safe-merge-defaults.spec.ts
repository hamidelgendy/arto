import { safeMergeDefaults } from '../../utils'

interface Variants {
  size?: 'small' | 'large' | null
  color?: string
  disabled?: boolean
  count?: number
}

describe('safeMergeDefaults', () => {
  it('returns defaults if userVariants is empty', () => {
    const defaults: Partial<Variants> = { size: 'small', color: 'blue' }
    const user: Partial<Variants> = {}

    const result = safeMergeDefaults(defaults, user)
    expect(result).toEqual({ size: 'small', color: 'blue' })
  })

  it('overrides defaults if userVariants has a non-null/undefined value', () => {
    const defaults: Partial<Variants> = { size: 'small', color: 'blue' }
    const user: Partial<Variants> = { size: 'large', color: 'red' }

    const result = safeMergeDefaults(defaults, user)
    expect(result).toEqual({ size: 'large', color: 'red' })
  })

  it('ignores null/undefined in userVariants, preserving the default', () => {
    const defaults: Partial<Variants> = { size: 'small', color: 'blue', disabled: false }
    const user: Partial<Variants> = {
      size: null, // should keep default 'small'
      color: undefined, // should keep default 'blue'
      disabled: true, // valid override
    }

    const result = safeMergeDefaults(defaults, user)
    expect(result).toEqual({ size: 'small', color: 'blue', disabled: true })
  })

  it('handles numeric overrides, including zero', () => {
    const defaults: Partial<Variants> = { count: 5 }
    const user: Partial<Variants> = { count: 0 } // 0 is a valid override, not null or undefined

    const result = safeMergeDefaults(defaults, user)
    expect(result).toEqual({ count: 0 })
  })

  it('uses an empty object as defaults if not provided', () => {
    // The second argument has a default value of {},
    // so if we don't pass anything, it just returns an empty object.
    const result = safeMergeDefaults({})
    expect(result).toEqual({})
  })

  it('does not mutate the original defaults object', () => {
    const defaults: Partial<Variants> = { size: 'small' }
    const user: Partial<Variants> = { size: 'large' }

    const result = safeMergeDefaults(defaults, user)
    expect(result).not.toBe(defaults) // different object reference
    expect(defaults).toEqual({ size: 'small' }) // unchanged
    expect(result).toEqual({ size: 'large' })
  })
})
