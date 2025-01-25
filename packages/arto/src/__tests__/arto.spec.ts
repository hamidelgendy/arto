import { arto } from '../arto'
import { ArtoError } from '../errors'
import { pluginHub, Plugin } from '../plugin-interface'
import type { ArtoConfig, VariantValue } from '../types'
import { ClassNameBuilder } from '../classname-builder.ts'

// Define typed variants, states, and optional context for the tests
type TestVariants = {
  size?: 'small' | 'large'
  color?: 'red' | 'blue'
}
type TestStates = 'disabled' | 'hover'

// Prepare the pluginHub for each test
beforeEach(() => {
  pluginHub.clear()
})
afterEach(() => {
  pluginHub.clear()
})

describe('arto function (comprehensive)', () => {
  // ---------------------------------------------------------------------------
  // 1. Invalid config checks
  // ---------------------------------------------------------------------------
  describe('Invalid config checks', () => {
    it('throws if config is null or non-object', () => {
      // @ts-expect-error Testing a runtime scenario with invalid input
      expect(() => arto(null)).toThrow('[Arto Error]: Invalid config provided to arto.')
      // @ts-expect-error same reason
      expect(() => arto(123)).toThrow('[Arto Error]: Invalid config provided to arto.')
    })

    it('returns a function yielding empty string if config is empty', () => {
      const styleFn = arto({})
      expect(styleFn()).toBe('')
    })
  })

  // ---------------------------------------------------------------------------
  // 2. Base classes usage
  // ---------------------------------------------------------------------------
  describe('Base classes usage', () => {
    it('applies a single base class (string)', () => {
      const styleFn = arto({ className: 'btn' })
      const result = styleFn()
      expect(result).toBe('btn')
    })

    it('handles multiple space-separated base classes', () => {
      const styleFn = arto({ className: 'btn btn-primary' })
      const result = styleFn()
      expect(result).toMatch(/btn/)
      expect(result).toMatch(/btn-primary/)
    })

    it('handles base classes as an array', () => {
      const styleFn = arto({ className: ['card', 'shadow-md'] })
      const result = styleFn()
      expect(result).toContain('card')
      expect(result).toContain('shadow-md')
    })
  })

  // ---------------------------------------------------------------------------
  // 3. Variants usage
  // ---------------------------------------------------------------------------
  describe('Variants usage', () => {
    it('applies user-selected variant classes', () => {
      const styleFn = arto<TestVariants>({
        className: 'btn',
        variants: {
          size: {
            small: 'btn-sm',
            large: 'btn-lg',
          },
        },
      })
      // user picks 'large'
      const result = styleFn({ variants: { size: 'large' } })
      expect(result).toMatch(/btn/)
      expect(result).toMatch(/btn-lg/)
      expect(result).not.toMatch(/btn-sm/)
    })

    it('handles multiple variants simultaneously', () => {
      const styleFn = arto<TestVariants>({
        className: 'card',
        variants: {
          size: { small: 'card-sm', large: 'card-lg' },
          color: { red: 'card-red', blue: 'card-blue' },
        },
      })

      const result = styleFn({ variants: { size: 'large', color: 'blue' } })
      expect(result).toContain('card')
      expect(result).toContain('card-lg')
      expect(result).toContain('card-blue')
    })

    it('throws error if user variant value is invalid', () => {
      const styleFn = arto<TestVariants>({
        variants: {
          size: { small: 'card-sm', large: 'card-lg' },
        },
      })

      // Casting `'unknown'` as a variant is just to trigger the error scenario
      expect(() => styleFn({ variants: { size: 'unknown' as unknown as 'small' } })).toThrowError(
        ArtoError,
      )
    })
  })

  // ---------------------------------------------------------------------------
  // 4. States usage
  // ---------------------------------------------------------------------------
  describe('States usage', () => {
    it('applies a state class if user sets e.g. { disabled: true }', () => {
      const styleFn = arto<TestVariants, 'disabled' | 'active'>({
        className: 'field',
        states: {
          disabled: 'field-disabled',
          active: 'field-active',
        },
      })
      const result = styleFn({ states: { disabled: true } })
      expect(result).toContain('field')
      expect(result).toContain('field-disabled')
      expect(result).not.toContain('field-active')
    })

    it('handles multiple states at once', () => {
      const styleFn = arto<Record<string, VariantValue>, 'active' | 'error'>({
        states: {
          active: 'is-active',
          error: 'is-error',
        },
      })

      const result = styleFn({ states: { active: true, error: true } })
      expect(result).toContain('is-active')
      expect(result).toContain('is-error')
    })

    it('only applies a state if dependencies are satisfied', () => {
      const styleFn = arto<Record<string, VariantValue>, 'focused' | 'active'>({
        className: 'input',
        states: {
          focused: {
            className: 'input-focused',
            dependsOn: ['active'], // must also have "active"
          },
          active: 'input-active',
        },
      })

      // "focused" is requested, but "active" not set => skip "focused"
      const res1 = styleFn({ states: { focused: true } })
      expect(res1).toContain('input')
      expect(res1).not.toContain('input-focused')

      // Now we add "active"
      const res2 = styleFn({ states: { focused: true, active: true } })
      expect(res2).toContain('input-focused')
      expect(res2).toContain('input-active')
    })
  })

  // ---------------------------------------------------------------------------
  // 5. Default Variants
  // ---------------------------------------------------------------------------
  describe('Default variants usage', () => {
    it('merges defaultVariants with user-provided', () => {
      const styleFn = arto({
        className: 'alert',
        variants: {
          size: { sm: 'alert-sm', lg: 'alert-lg' },
          color: { red: 'alert-red', green: 'alert-green' },
        },
        defaultVariants: { size: 'sm', color: 'red' },
      })

      // If user only provides color => size is still 'sm'
      const result = styleFn({ variants: { color: 'green' } })
      expect(result).toMatch(/alert-sm/)
      expect(result).toMatch(/alert-green/)
      expect(result).not.toMatch(/alert-red/)

      // If user provides all => overrides everything
      const result2 = styleFn({ variants: { size: 'lg', color: 'red' } })
      expect(result2).toMatch(/alert-lg/)
      expect(result2).toMatch(/alert-red/)
    })
  })

  // ---------------------------------------------------------------------------
  // 6. Context usage
  // ---------------------------------------------------------------------------
  describe('Context usage in className or variants', () => {
    it('passes user context to a function-based className', () => {
      // We'll define a new context type with a 'user' property
      type MyContext = { user: string }

      const styleFn = arto<Record<string, VariantValue>, never, MyContext>({
        className: (ctx) => `card-by-${ctx?.user ?? 'unknown'}`,
        variants: {
          mood: {
            happy: (ctx) => `${ctx?.user}-is-happy`,
            sad: (ctx) => `${ctx?.user}-is-sad`,
          },
        },
      })

      const res = styleFn({
        variants: { mood: 'happy' },
        context: { user: 'hamid' },
      })
      expect(res).toContain('card-by-hamid')
      expect(res).toContain('hamid-is-happy')
    })
  })

  // ---------------------------------------------------------------------------
  // 7. Local & Global Plugins Integration
  // ---------------------------------------------------------------------------
  describe('Plugin integration (local + global + internal)', () => {
    it('combines local plugins & global plugins in stage order', () => {
      // 1. global 'before'
      const globalBefore: Plugin<TestVariants, TestStates> = {
        id: 'global-before',
        stage: 'before',
        apply: (b: ClassNameBuilder<TestVariants, TestStates>) =>
          b.addBaseClasses(['globalBefore']),
      }
      pluginHub.register(globalBefore)

      // 2. local 'core'
      const localCore: Plugin<TestVariants, TestStates> = {
        id: 'local-core',
        stage: 'core',
        apply: (b) => b.addBaseClasses(['localCore']),
      }

      // 3. local plugin with no stage => defaults to 'core'
      const localNoStage: Plugin<TestVariants, TestStates> = {
        id: 'local-no-stage',
        apply: (b) => b.addBaseClasses(['localNoStage']),
      }

      const config: ArtoConfig<TestVariants, TestStates> = {
        className: 'internalBase',
      }

      const styleFn = arto(config, [localCore, localNoStage])

      // 4. global 'after'
      const globalAfter: Plugin<TestVariants, TestStates> = {
        id: 'global-after',
        stage: 'after',
        apply: (b) => b.addBaseClasses(['globalAfter']),
      }
      pluginHub.register(globalAfter)

      const final = styleFn()
      expect(final).toMatch(/globalBefore/)
      expect(final).toMatch(/internalBase/)
      expect(final).toMatch(/localNoStage/)
      expect(final).toMatch(/localCore/)
      expect(final).toMatch(/globalAfter/)
    })
  })

  // ---------------------------------------------------------------------------
  // 8. Rules usage
  // ---------------------------------------------------------------------------
  describe('Rules usage', () => {
    it('handles a rule removing base and adding a class (no logic => always passes)', () => {
      const styleFn = arto<TestVariants, TestStates>({
        className: 'top-level-class',
        rules: [
          {
            when: {}, // no logic => default => 'AND' => always passes
            remove: { base: true },
            add: 'rule-added',
          },
        ],
      })

      const final = styleFn()
      expect(final).not.toContain('top-level-class')
      expect(final).toContain('rule-added')
    })

    it('applies rules after variants/states if logic passes, removing/adding as needed', () => {
      const styleFn = arto<TestVariants, 'disabled'>({
        className: 'btn',
        variants: {
          size: { small: 'btn-sm', large: 'btn-lg' },
        },
        states: {
          disabled: 'btn-disabled',
        },
        rules: [
          {
            when: {
              variants: { size: ['small'] },
              states: ['disabled'],
            },
            remove: { base: true },
            add: 'small-disabled-rule',
          },
        ],
        defaultVariants: { size: 'small' },
      })

      // user => 'small' + 'disabled' => triggers => remove base => add "small-disabled-rule"
      const final = styleFn({
        variants: { size: 'small' },
        states: { disabled: true },
      })
      const tokens = final.split(/\s+/)

      expect(tokens).toContain('btn-sm')
      expect(tokens).toContain('btn-disabled')
      expect(tokens).not.toContain('btn') // removed
      expect(tokens).toContain('small-disabled-rule')
    })
  })

  // ---------------------------------------------------------------------------
  // 9. Final scenario
  // ---------------------------------------------------------------------------
  it('final scenario with everything: variants, states, local plugin, global plugin, rules, etc.', () => {
    // global 'before' => "gBefore"
    const gBefore: Plugin<TestVariants, TestStates> = {
      id: 'gBefore',
      stage: 'before',
      apply: (b) => b.addBaseClasses(['gBefore']),
    }
    pluginHub.register(gBefore)

    // local 'core' => "lCore"
    const lCore: Plugin<TestVariants, TestStates> = {
      id: 'lCore',
      stage: 'core',
      apply: (b) => b.addBaseClasses(['lCore']),
    }

    // config => base => "cfg-base", variants => { size:... }, states => { disabled:... }, rules => ...
    const config: ArtoConfig<TestVariants, TestStates> = {
      className: 'cfg-base',
      variants: {
        size: { small: 'sm', large: 'lg' },
      },
      states: {
        disabled: 'dis',
      },
      rules: [
        {
          when: {
            variants: { size: ['small'] },
            states: ['disabled'],
          },
          remove: { base: true }, // remove base => 'cfg-base'
          add: 'small-disabled-rule',
        },
      ],
      defaultVariants: { size: 'small' },
    }

    const styleFn = arto(config, [lCore])

    // global 'after' => "gAfter"
    const gAfter: Plugin<TestVariants, TestStates> = {
      id: 'gAfter',
      stage: 'after',
      apply: (b) => b.addBaseClasses(['gAfter']),
    }
    pluginHub.register(gAfter)

    // user => size:'small', states.disabled => triggers => remove base => add "small-disabled-rule"
    const final = styleFn({
      variants: { size: 'small' },
      states: { disabled: true },
    })
    const finalTokens = final.split(/\s+/)

    // base => "gBefore","cfg-base","lCore" => removed by the rule
    expect(finalTokens).not.toContain('gBefore')
    expect(finalTokens).not.toContain('cfg-base')
    expect(finalTokens).not.toContain('lCore')

    // leftover => 'sm','dis','small-disabled-rule','gAfter'
    expect(finalTokens).toContain('sm')
    expect(finalTokens).toContain('dis')
    expect(finalTokens).toContain('small-disabled-rule')
    expect(finalTokens).toContain('gAfter')
  })
})
