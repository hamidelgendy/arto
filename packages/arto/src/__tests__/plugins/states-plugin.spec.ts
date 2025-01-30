import {
  StatesPlugin,
  checkStateDependencies,
  isStateConfig,
  extractStateClassName,
} from '../../plugins/states-plugin'
import * as Utils from '../../utils'
import { createMockBuilder } from '../test-utils'

describe('StatesPlugin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  // ----------------------------------------------------
  // 1. Constructor
  // ----------------------------------------------------
  it('constructs with provided states config and order', () => {
    const plugin = new StatesPlugin({}, 5)

    expect(plugin.order).toBe(5)
    expect(plugin.stage).toBe('core')
    expect(plugin.id).toBe('arto/Internal/ApplyStateClassesPlugin')
  })

  // ----------------------------------------------------
  // 2. apply() method
  // ----------------------------------------------------
  describe('apply() method', () => {
    it('applies no classes if activeStates is empty', () => {
      const plugin = new StatesPlugin({}, 0)

      const mockBuilder = createMockBuilder({
        activeStates: [],
      })

      plugin.apply(mockBuilder)
      // No states => no calls
      expect(mockBuilder.addGlobalStateClasses).not.toHaveBeenCalled()
    })

    it('skips if the config has no corresponding state entry', () => {
      type States = 'disabled' | 'active'

      const plugin = new StatesPlugin<never, States>({ disabled: 'some-class' }, 0)

      // Active states: both 'disabled' and 'active'
      // But only 'disabled' is recognized by the config
      const mockBuilder = createMockBuilder<never, States>({
        activeStates: ['disabled', 'active'],
      })

      plugin.apply(mockBuilder)
      expect(mockBuilder.addGlobalStateClasses).toHaveBeenCalledTimes(1)
      expect(mockBuilder.addGlobalStateClasses).toHaveBeenCalledWith('disabled', ['some-class'])
    })

    it('adds classes if a state is present as a simple string', () => {
      type States = 'active'

      const plugin = new StatesPlugin<never, States>({ active: 'active-class' }, 0)
      const mockBuilder = createMockBuilder<never, States>({
        activeStates: ['active'],
      })

      plugin.apply(mockBuilder)
      expect(mockBuilder.addGlobalStateClasses).toHaveBeenCalledWith('active', ['active-class'])
    })

    it('applies a StateConfig with no dependsOn', () => {
      type States = 'disabled'

      const plugin = new StatesPlugin<never, States>(
        {
          disabled: { className: 'disabled-class' },
        },
        0,
      )
      const mockBuilder = createMockBuilder<never, States>({
        activeStates: ['disabled'],
      })

      plugin.apply(mockBuilder)
      expect(mockBuilder.addGlobalStateClasses).toHaveBeenCalledWith('disabled', ['disabled-class'])
    })

    it('skips a StateConfig if dependsOn function returns false', () => {
      type States = 'disabled' | 'active'

      const plugin = new StatesPlugin<never, States>(
        {
          disabled: {
            className: 'disabled-class',
            dependsOn: (actives) => actives.has('active'),
          },
        },
        0,
      )
      const mockBuilder = createMockBuilder<never, States>({
        activeStates: ['disabled'], // Missing 'active'
      })

      plugin.apply(mockBuilder)
      expect(mockBuilder.addGlobalStateClasses).not.toHaveBeenCalled()
    })

    it('applies a StateConfig if dependsOn function returns true', () => {
      type States = 'disabled' | 'active'

      const plugin = new StatesPlugin<never, States>(
        {
          disabled: {
            className: 'disabled-class',
            dependsOn: (actives) => actives.has('disabled'),
          },
        },
        0,
      )
      const mockBuilder = createMockBuilder<never, States>({
        activeStates: ['disabled'],
      })

      plugin.apply(mockBuilder)
      expect(mockBuilder.addGlobalStateClasses).toHaveBeenCalledWith('disabled', ['disabled-class'])
    })

    it('skips a StateConfig if dependsOn array is not satisfied', () => {
      type States = 'active' | 'hovered'

      const plugin = new StatesPlugin<never, States>(
        {
          hovered: {
            className: 'hover-class',
            dependsOn: ['active'],
          },
        },
        0,
      )
      const mockBuilder = createMockBuilder<never, States>({
        activeStates: ['hovered'],
      })

      plugin.apply(mockBuilder)
      expect(mockBuilder.addGlobalStateClasses).not.toHaveBeenCalled()
    })

    it('applies a StateConfig if dependsOn array is satisfied', () => {
      type States = 'active' | 'hovered' | 'disabled'

      const plugin = new StatesPlugin<never, States>(
        {
          hovered: {
            className: 'hover-class',
            dependsOn: ['hovered', { not: ['disabled'] }],
          },
        },
        0,
      )
      const mockBuilder = createMockBuilder<never, States>({
        activeStates: ['hovered', 'active'],
      })

      plugin.apply(mockBuilder)
      expect(mockBuilder.addGlobalStateClasses).toHaveBeenCalledWith('hovered', ['hover-class'])
    })

    it('adds resolved classes if it is a direct or callback className', () => {
      type States = 'active' | 'disabled'
      type Context = { user: string }

      const stateCallback = vi.fn().mockReturnValue('callback-active-class')

      const plugin = new StatesPlugin<never, States, Context>({ active: stateCallback }, 0)

      const mockBuilder = createMockBuilder<never, States, Context>({
        activeStates: ['active'],
        context: { user: 'Alice' },
      })

      // Spy on normalizeClassName
      const normalizeSpy = vi.spyOn(Utils, 'normalizeClassName')

      plugin.apply(mockBuilder)

      expect(stateCallback).toHaveBeenCalledWith({ user: 'Alice' })
      expect(normalizeSpy).toHaveBeenCalled()
      expect(mockBuilder.addGlobalStateClasses).toHaveBeenCalledWith('active', [
        'callback-active-class',
      ])

      normalizeSpy.mockRestore()
    })
  })

  // ----------------------------------------------------
  // 3. checkStateDependencies() utility
  // ----------------------------------------------------
  describe('checkStateDependencies()', () => {
    it('returns true if dependsOn is undefined', () => {
      expect(checkStateDependencies(undefined, new Set(['active']))).toBe(true)
    })

    it('executes function if dependsOn is a callback', () => {
      const fn = vi.fn().mockReturnValue(true)
      const activeSet = new Set(['hovered'])
      const result = checkStateDependencies(fn, activeSet, { debug: true })

      expect(fn).toHaveBeenCalledWith(activeSet, { debug: true })
      expect(result).toBe(true)
    })

    it('handles an array with "not" for exclusion', () => {
      const dependsOn = ['active', { not: ['disabled'] }]
      // must have 'active', must NOT have 'disabled'
      const pass = checkStateDependencies(dependsOn, new Set(['active']), {})
      expect(pass).toBe(true)

      // If we also have 'disabled', we fail
      const fail = checkStateDependencies(dependsOn, new Set(['active', 'disabled']), {})
      expect(fail).toBe(false)
    })
  })

  // ----------------------------------------------------
  // 4. isStateConfig() and extractStateClassName()
  // ----------------------------------------------------
  describe('isStateConfig & extractStateClassName', () => {
    it('isStateConfig returns true if object has "className"', () => {
      const config = { className: 'some-classes' }
      expect(isStateConfig(config)).toBe(true)
    })

    it('isStateConfig returns false otherwise', () => {
      expect(isStateConfig(null)).toBe(false)
      expect(isStateConfig({})).toBe(false)
      expect(isStateConfig({ something: 123 })).toBe(false)
    })

    it('extractStateClassName returns config.className if isStateConfig', () => {
      const validConfig = { className: 'state-foo' }
      expect(extractStateClassName(validConfig)).toBe('state-foo')
    })

    it('extractStateClassName returns config if isClassNameType', () => {
      const directClass = 'simple-class'
      expect(extractStateClassName(directClass)).toBe('simple-class')
    })

    it('extractStateClassName throws if neither a ClassName nor a StateConfig', () => {
      // e.g. a random object
      expect(() =>
        extractStateClassName(
          // @ts-expect-error: Invalid input
          {},
        ),
      ).toThrow('Invalid configuration for className. Expected ClassName or StateConfig.')
    })
  })
})
