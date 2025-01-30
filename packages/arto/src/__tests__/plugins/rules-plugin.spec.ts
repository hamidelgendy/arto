import { RulesPlugin, evaluateSimpleLogic, evaluateObjectLogic } from '../../plugins/rules-plugin'
import * as Utils from '../../utils'
import type { ArtoLogicObject } from '../../types/rules'
import { createMockBuilder } from '../test-utils'

describe('RulesPlugin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('defaults to stage=core and order=0', () => {
      const plugin = new RulesPlugin()
      expect(plugin.stage).toBe('core')
      expect(plugin.order).toBe(0)
      expect(plugin.id).toBe('arto/Internal/RulesPlugin')
    })

    it('allows a custom order', () => {
      const plugin = new RulesPlugin(5)
      expect(plugin.order).toBe(5)
    })
  })

  describe('apply() method', () => {
    it('does nothing if artoConfig.rules is undefined', () => {
      const plugin = new RulesPlugin()

      const mockBuilder = createMockBuilder({
        artoConfig: {
          rules: undefined,
        },
      })

      plugin.apply(mockBuilder)
      expect(mockBuilder.addBaseClasses).not.toHaveBeenCalled()
    })

    it('skips rules that do not pass doesRuleApply', () => {
      type States = 'unused'
      const plugin = new RulesPlugin<never, States>()

      const mockBuilder = createMockBuilder<never, States>({
        artoConfig: {
          rules: [
            { when: { logic: 'AND' }, remove: { base: true } },
            { when: { logic: 'AND' }, add: 'some-class' },
          ],
        },
        activeStates: ['unused'],
      })

      // Since doesRuleApply is private, cast to unknown to spy:
      const doesRuleApplySpy = vi.spyOn(
        RulesPlugin.prototype,
        // @ts-expect-error - we're spying on a private method
        'doesRuleApply',
      )
      // Force doesRuleApply to return false for testing
      // @ts-expect-error We know doesRuleApply returns boolean, but TS sees it as private
      doesRuleApplySpy.mockReturnValue(false)

      plugin.apply(mockBuilder)
      expect(mockBuilder.addBaseClasses).not.toHaveBeenCalled()

      doesRuleApplySpy.mockRestore()
    })

    it('executes removeStuff and add if rule passes doesRuleApply', () => {
      type Variants = {
        size: 'large' | 'small'
      }
      type States = 'disabled'

      const plugin = new RulesPlugin<Variants, States>()

      const mockBuilder = createMockBuilder<Variants, States>({
        artoConfig: {
          rules: [
            {
              when: { logic: 'OR' },
              remove: { variants: ['size'], states: ['disabled'], base: true },
              add: 'extra-class',
            },
          ],
        },
        activeStates: ['disabled'],
        selectedVariants: { size: 'large' },
      })

      // Spy on private method doesRuleApply
      const doesRuleApplySpy = vi.spyOn(
        RulesPlugin.prototype,
        // @ts-expect-error private method
        'doesRuleApply',
      )

      // Force it to return true
      // @ts-expect-error private method
      doesRuleApplySpy.mockReturnValue(true)

      // Also mock out normalizeClassName
      const normalizeSpy = vi.spyOn(Utils, 'normalizeClassName').mockReturnValue(['extra-class'])

      plugin.apply(mockBuilder)

      // => removeStuff
      expect(mockBuilder.clearVariantClasses).toHaveBeenCalledWith('size')
      expect(mockBuilder.clearGlobalStateClasses).toHaveBeenCalledWith('disabled')
      expect(mockBuilder.clearBaseClasses).toHaveBeenCalled()

      // => add
      expect(normalizeSpy).toHaveBeenCalledWith('extra-class', undefined)
      expect(mockBuilder.addBaseClasses).toHaveBeenCalledWith(['extra-class'])

      doesRuleApplySpy.mockRestore()
      normalizeSpy.mockRestore()
    })

    it('handles multiple rules sequentially if they pass doesRuleApply', () => {
      type Variants = {
        size: 'large'
        color: 'red'
      }
      type States = 'disabled'

      const plugin = new RulesPlugin<Variants, States>()

      const mockBuilder = createMockBuilder<Variants, States>({
        artoConfig: {
          rules: [
            {
              when: { states: ['disabled'] },
              remove: { variants: ['size'] },
            },
            {
              when: { variants: { color: ['red'] } },
              add: ['rule-class1', 'rule-class2'],
            },
          ],
        },
        activeStates: ['disabled'],
        selectedVariants: { size: 'large', color: 'red' },
      })

      // doesRuleApply runs real code, no spy override
      plugin.apply(mockBuilder)

      // 1st rule => states:['disabled'] => pass => remove { variants:['size'] }
      expect(mockBuilder.clearVariantClasses).toHaveBeenCalledWith('size')

      // 2nd rule => variants:{ color:['red'] } => pass => add => 'rule-class1','rule-class2'
      expect(mockBuilder.addBaseClasses).toHaveBeenCalledWith(['rule-class1', 'rule-class2'])
    })
  })

  describe('doesRuleApply (integration)', () => {
    it('defaults to AND if no logic, meaning all booleans must be true', () => {
      type Variants = {
        size: 'large'
      }
      type States = 'disabled'

      const plugin = new RulesPlugin<Variants, States>()

      const mockBuilder = createMockBuilder<Variants, States>({
        artoConfig: {
          rules: [
            {
              when: {
                variants: { size: ['large'] },
                states: ['disabled'],
              },
              remove: { base: true },
            },
          ],
        },
        activeStates: ['disabled'],
        selectedVariants: { size: 'large' },
      })

      plugin.apply(mockBuilder)
      // Because variants.size => 'large' => matches => true, states => 'disabled' => true => allBools => [true,true]
      // default => 'AND' => pass => remove base
      expect(mockBuilder.clearBaseClasses).toHaveBeenCalled()
    })
  })
})

// ----------------------------------------------------
// EvaluateSimpleLogic
// ----------------------------------------------------
describe('evaluateSimpleLogic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('defaults to AND if operator is undefined', () => {
    const conditions = [true, true, false]
    expect(evaluateSimpleLogic(conditions, undefined)).toBe(false)
  })

  it('handles AND', () => {
    expect(evaluateSimpleLogic([true, true, true], 'AND')).toBe(true)
    expect(evaluateSimpleLogic([true, false, true], 'AND')).toBe(false)
    // edge case: empty array => every() => true
    expect(evaluateSimpleLogic([], 'AND')).toBe(true)
  })

  it('handles OR', () => {
    expect(evaluateSimpleLogic([false, false], 'OR')).toBe(false)
    expect(evaluateSimpleLogic([false, true], 'OR')).toBe(true)
    expect(evaluateSimpleLogic([], 'OR')).toBe(false)
  })

  it('handles NOT', () => {
    expect(evaluateSimpleLogic([false, false], 'NOT')).toBe(true)
    expect(evaluateSimpleLogic([false, true], 'NOT')).toBe(false)
  })

  it('handles XOR', () => {
    expect(evaluateSimpleLogic([true, false], 'XOR')).toBe(true)
    expect(evaluateSimpleLogic([true, true], 'XOR')).toBe(false)
    expect(evaluateSimpleLogic([false, false], 'XOR')).toBe(false)
    expect(evaluateSimpleLogic([true, false, false], 'XOR')).toBe(true)
  })

  it('handles IMPLIES with the first two booleans only', () => {
    expect(evaluateSimpleLogic([false, false], 'IMPLIES')).toBe(true)
    expect(evaluateSimpleLogic([true, false], 'IMPLIES')).toBe(false)
    // extra booleans => ignored
    expect(evaluateSimpleLogic([true, false, true], 'IMPLIES')).toBe(false)
  })
})

// ----------------------------------------------------
// EvaluateObjectLogic
// ----------------------------------------------------
describe('evaluateObjectLogic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('defaults to { variants:"AND", states:"AND", combine:"AND" } if no fields present', () => {
    const logicObj: ArtoLogicObject = {}
    expect(evaluateObjectLogic([], [], logicObj)).toBe(true) // empty => all pass => true

    // partial => [true, false] => ...
    expect(evaluateObjectLogic([true, false], [true], logicObj)).toBe(false)
  })

  it('tests variants=AND, states=OR, combine=AND', () => {
    const logicObj: ArtoLogicObject = {
      variants: 'AND',
      states: 'OR',
      combine: 'AND',
    }
    expect(evaluateObjectLogic([true, true], [true, false], logicObj)).toBe(true)
    expect(evaluateObjectLogic([true, false], [true, false], logicObj)).toBe(false)
  })

  it('tests variants=OR, states=AND, combine=OR', () => {
    const logicObj: ArtoLogicObject = {
      variants: 'OR',
      states: 'AND',
      combine: 'OR',
    }
    expect(evaluateObjectLogic([false, false], [true, true], logicObj)).toBe(true)
    expect(evaluateObjectLogic([false, false], [true, false], logicObj)).toBe(false)
  })

  it('handles edge cases like empty arrays', () => {
    const logicObj: ArtoLogicObject = { variants: 'OR', states: 'AND', combine: 'AND' }
    // variant => OR => empty => false, states => AND => empty => true => final => false
    expect(evaluateObjectLogic([], [], logicObj)).toBe(false)
  })
})
