import { VariantsPlugin, isVariantConfig } from '../../plugins/variants-plugin'
import * as Utils from '../../utils'
import * as Errors from '../../errors'
import { createMockBuilder } from '../test-utils'

describe('VariantsPlugin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  // ----------------------------------------------------
  // Constructor
  // ----------------------------------------------------
  describe('constructor', () => {
    it('defaults order=0 if none provided', () => {
      const plugin = new VariantsPlugin()
      expect(plugin.order).toBe(0)
      expect(plugin.stage).toBe('core') // default stage
      expect(plugin.id).toBe('arto/Internal/ApplyVariantClassesPlugin')
    })

    it('respects the provided order', () => {
      const plugin = new VariantsPlugin(5)
      expect(plugin.order).toBe(5)
    })
  })

  // ----------------------------------------------------
  // apply() method - Basic Scenarios
  // ----------------------------------------------------
  describe('apply() method', () => {
    it('does nothing if artoConfig.variants is undefined', () => {
      const plugin = new VariantsPlugin()

      // No "variants" in artoConfig => no calls
      const mockBuilder = createMockBuilder({
        artoConfig: {}, // no "variants"
        selectedVariants: {},
      })

      plugin.apply(mockBuilder)
      expect(mockBuilder.addVariantClasses).not.toHaveBeenCalled()
    })

    it('skips any variant key if userChosenValue is undefined', () => {
      type Variants = {
        color: 'red'
      }

      const plugin = new VariantsPlugin<Variants>()

      const mockBuilder = createMockBuilder<Variants>({
        artoConfig: {
          variants: {
            color: { red: 'red-class' },
          },
        },
        selectedVariants: { color: undefined },
      })

      plugin.apply(mockBuilder)
      expect(mockBuilder.addVariantClasses).not.toHaveBeenCalled()
    })

    it('throws if userChosenValue is invalid for that variant key', () => {
      type Variants = {
        color: 'red'
      }
      const plugin = new VariantsPlugin<Variants>()

      const mockBuilder = createMockBuilder<Variants>({
        artoConfig: {
          variants: {
            color: { red: 'red-class' },
          },
        },
        selectedVariants: {
          // @ts-expect-error: invalid value
          color: 'invalid',
        },
      })

      const throwErrorSpy = vi.spyOn(Errors, 'throwError')

      expect(() => plugin.apply(mockBuilder)).toThrow(
        "Invalid value 'invalid' for variant 'color'.",
      )
      expect(throwErrorSpy).toHaveBeenCalled()

      throwErrorSpy.mockRestore()
    })
  })

  // ----------------------------------------------------
  // apply() method - Handling direct className
  // ----------------------------------------------------
  describe('apply() with direct className usage', () => {
    it('applies if userChosenValue is a direct string', () => {
      type Variants = {
        size: 'small' | 'large'
      }
      const plugin = new VariantsPlugin<Variants>()

      const mockBuilder = createMockBuilder<Variants>({
        artoConfig: {
          variants: {
            size: {
              small: 'sm-class',
              large: 'lg-class',
            },
          },
        },
        selectedVariants: { size: 'small' },
        context: {},
      })

      const normalizeSpy = vi.spyOn(Utils, 'normalizeClassName').mockReturnValue(['sm-class'])

      plugin.apply(mockBuilder)

      expect(normalizeSpy).toHaveBeenCalledWith('sm-class', {})
      expect(mockBuilder.addVariantClasses).toHaveBeenCalledWith('size', ['sm-class'])

      normalizeSpy.mockRestore()
    })

    it('applies if userChosenValue is a function-based className', () => {
      type Variants = {
        color: 'red'
      }
      type Context = {
        user: string
      }

      const plugin = new VariantsPlugin<Variants, never, Context>()

      const mockBuilder = createMockBuilder<Variants, never, Context>({
        artoConfig: {
          variants: {
            color: {
              red: (ctx) => ctx && `dynamic-${ctx.user}-red`,
            },
          },
        },
        selectedVariants: { color: 'red' },
        context: { user: 'alice' },
      })

      const normalizeSpy = vi
        .spyOn(Utils, 'normalizeClassName')
        .mockReturnValue(['dynamic-alice-red'])

      plugin.apply(mockBuilder)

      // The actual function is tested inside `normalizeClassName`; we just confirm calls:
      expect(normalizeSpy).toHaveBeenCalledWith(expect.any(Function), { user: 'alice' })
      expect(mockBuilder.addVariantClasses).toHaveBeenCalledWith('color', ['dynamic-alice-red'])

      normalizeSpy.mockRestore()
    })
  })

  // ----------------------------------------------------
  // apply() method - Handling a VariantConfig
  // ----------------------------------------------------
  describe('apply() with a VariantConfig (className + states)', () => {
    it('merges base className from VariantConfig, then merges any states', () => {
      type Variants = {
        color: 'red'
      }
      type States = 'disabled' | 'active'

      const plugin = new VariantsPlugin<Variants, States>()

      const mockBuilder = createMockBuilder<Variants, States>({
        artoConfig: {
          variants: {
            color: {
              red: {
                className: 'base-color-class',
                states: {
                  disabled: 'color-disabled',
                  active: {
                    className: 'color-active',
                    dependsOn: (actives) => actives.has('active'),
                  },
                },
              },
            },
          },
        },
        selectedVariants: { color: 'red' },
        context: {},
        activeStates: ['active'], // so the "active" state is present
      })

      const normalizeSpy = vi.spyOn(Utils, 'normalizeClassName').mockImplementation((val) => {
        if (typeof val === 'string') return [val]
        return ['fn-result']
      })

      plugin.apply(mockBuilder)

      // Confirm base class usage
      expect(mockBuilder.addVariantClasses).toHaveBeenCalledWith('color', ['base-color-class'])

      // Then handle states => 'disabled', 'active'
      expect(mockBuilder.addVariantStateClasses).toHaveBeenCalledWith('color', 'disabled', [
        'color-disabled',
      ])
      expect(mockBuilder.replaceVariantStateClasses).toHaveBeenCalledWith('color', 'active', [
        'color-active',
      ])

      normalizeSpy.mockRestore()
    })

    it('skips a variant-level state if dependsOn is not met', () => {
      type Variants = {
        size: 'large'
      }
      type States = 'active' | 'disabled'

      const plugin = new VariantsPlugin<Variants, States>()

      const mockBuilder = createMockBuilder<Variants, States>({
        artoConfig: {
          variants: {
            size: {
              large: {
                className: 'some-base',
                states: {
                  active: {
                    className: 'active-class',
                    dependsOn: (actives) => actives.has('active'),
                  },
                },
              },
            },
          },
        },
        selectedVariants: { size: 'large' },
        context: null,
        activeStates: ['disabled'], // not 'active'
      })

      plugin.apply(mockBuilder)
      // We do get the base => 'some-base'
      expect(mockBuilder.addVariantClasses).toHaveBeenCalledWith('size', ['some-base'])
      // But we skip 'active' => no calls
      expect(mockBuilder.addVariantStateClasses).not.toHaveBeenCalledWith(
        'size',
        'active',
        expect.any(Array),
      )
      expect(mockBuilder.replaceVariantStateClasses).not.toHaveBeenCalled()
    })

    it('throws if a nested state config is invalid', () => {
      type Variants = {
        color: 'blue'
      }
      type States = 'disabled'

      const plugin = new VariantsPlugin<Variants, States>()

      const mockBuilder = createMockBuilder<Variants, States>({
        artoConfig: {
          variants: {
            color: {
              // @ts-expect-error: invalid type for demonstration
              blue: {
                className: 'some-base',
                states: {
                  disabled: 123,
                },
              },
            },
          },
        },
        selectedVariants: { color: 'blue' },
        context: {},
        activeStates: ['disabled'],
      })

      expect(() => plugin.apply(mockBuilder)).toThrow(
        "Invalid state config for state 'disabled' ...",
      )
    })
  })

  // ----------------------------------------------------
  // isVariantConfig
  // ----------------------------------------------------
  describe('isVariantConfig() utility function', () => {
    it('returns true if object has at least className or states', () => {
      expect(isVariantConfig({ className: 'foo' })).toBe(true)
      expect(isVariantConfig({ states: {} })).toBe(true)
      expect(isVariantConfig({ className: ['bar'], states: { abc: 'some' } })).toBe(true)
    })

    it('returns false otherwise', () => {
      expect(isVariantConfig(null)).toBe(false)
      expect(isVariantConfig(undefined)).toBe(false)
      expect(isVariantConfig({})).toBe(false)
      expect(isVariantConfig({ random: 123 })).toBe(false)
    })
  })
})
