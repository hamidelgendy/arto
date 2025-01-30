import type { Mock } from 'vitest'
import { ClassNameBuilder } from '../classname-builder'
import type { ArtoConfig, VariantValue } from '../types'
import type { Plugin } from '../plugin-interface'

type NoVariants = Record<never, VariantValue>

describe('ClassNameBuilder (Comprehensive)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  // ----------------------------------------------------
  // Constructor & Plugin Sorting
  // ----------------------------------------------------
  describe('Constructor & Plugin Sorting', () => {
    it('sorts plugins by stage -> order and stores them internally', () => {
      const beforePlugin: Plugin = {
        id: 'beforePlugin',
        stage: 'before',
        order: 2,
        apply: vi.fn(),
      }
      const corePlugin: Plugin = {
        id: 'corePlugin',
        stage: 'core',
        order: 0,
        apply: vi.fn(),
      }
      const afterPlugin: Plugin = {
        id: 'afterPlugin',
        stage: 'after',
        order: 5,
        apply: vi.fn(),
      }
      const anotherBefore: Plugin = {
        id: 'anotherBefore',
        stage: 'before',
        order: 1,
        apply: vi.fn(),
      }

      // We create the builder with these plugins
      const builder = new ClassNameBuilder({}, {}, new Set<never>(), undefined, [
        corePlugin,
        beforePlugin,
        afterPlugin,
        anotherBefore,
      ])

      // Trigger .build() so that each plugin's apply() is called
      builder.build()

      // Check call order
      const anotherBeforeCall = (anotherBefore.apply as Mock).mock.invocationCallOrder[0]
      const beforePluginCall = (beforePlugin.apply as Mock).mock.invocationCallOrder[0]
      const corePluginCall = (corePlugin.apply as Mock).mock.invocationCallOrder[0]
      const afterPluginCall = (afterPlugin.apply as Mock).mock.invocationCallOrder[0]

      // Should be strictly ascending: anotherBefore(1) < beforePlugin(2) < corePlugin(0) < afterPlugin(5)
      expect(anotherBeforeCall).toBeLessThan(beforePluginCall)
      expect(beforePluginCall).toBeLessThan(corePluginCall)
      expect(corePluginCall).toBeLessThan(afterPluginCall)
    })

    it('defaults plugins with no stage to "core" and no order to 0', () => {
      const noStagePlugin: Plugin = {
        id: 'no-stage',
        // no 'stage' or 'order'
        apply: vi.fn(),
      }

      const builder = new ClassNameBuilder({}, {}, new Set<never>(), undefined, [noStagePlugin])

      builder.build()
      // plugin must have stage=core, order=0
      expect(noStagePlugin.stage).toBe('core')
      expect(noStagePlugin.order).toBe(0)
    })
  })

  // ----------------------------------------------------
  // build() method
  // ----------------------------------------------------
  describe('build() method', () => {
    it('applies plugins in stage order, runs after-build callbacks, then merges classes', () => {
      const beforePlugin: Plugin = {
        id: 'before-plugin',
        stage: 'before',
        apply(builder) {
          builder.addBaseClasses(['before-class'])
        },
      }
      const corePlugin: Plugin = {
        id: 'core-plugin',
        stage: 'core',
        apply(builder) {
          builder.addVariantClasses('size', ['core-size'])
        },
      }
      const afterPlugin: Plugin = {
        id: 'after-plugin',
        stage: 'after',
        apply(builder) {
          builder.addGlobalStateClasses('disabled', ['after-disabled'])
        },
      }

      // We mark 'disabled' as active to see if after-plugin's classes appear
      const builder = new ClassNameBuilder({}, {}, new Set(['disabled']), undefined, [
        beforePlugin,
        corePlugin,
        afterPlugin,
      ])

      const afterBuildSpy = vi.fn()
      builder.addPostCoreCallback(afterBuildSpy)

      const final = builder.build()
      expect(final).toEqual(['before-class', 'core-size', 'after-disabled'])
      expect(afterBuildSpy).toHaveBeenCalled()
    })
  })

  // ----------------------------------------------------
  // After-Build Callbacks
  // ----------------------------------------------------
  describe('addAfterBuildCallback()', () => {
    it('executes callbacks after core plugins but before after plugins', () => {
      const corePlugin: Plugin = {
        id: 'core-plugin',
        stage: 'core',
        apply(builder) {
          builder.addBaseClasses(['core-class'])
        },
      }
      const afterPlugin: Plugin = {
        id: 'after-plugin',
        stage: 'after',
        apply(builder) {
          builder.addBaseClasses(['after-class'])
        },
      }

      const builder = new ClassNameBuilder({}, {}, new Set<never>(), undefined, [
        corePlugin,
        afterPlugin,
      ])

      const callback = vi.fn(() => {
        // at this moment, 'core' has run => 'core-class' is present
        // 'after' not run yet => 'after-class' not present
        expect(builder.getBaseClasses()).toContain('core-class')
        expect(builder.getBaseClasses()).not.toContain('after-class')
      })

      builder.addPostCoreCallback(callback)
      const final = builder.build()

      // after => 'after-class' is appended
      expect(final).toEqual(['core-class', 'after-class'])
      expect(callback).toHaveBeenCalled()
    })
  })

  // ----------------------------------------------------
  // Base Classes
  // ----------------------------------------------------
  describe('Base Classes API', () => {
    it('addBaseClasses() and build()', () => {
      const builder = new ClassNameBuilder({}, {}, new Set<never>())

      builder.addBaseClasses(['baseA', 'baseB'])
      expect(builder.getBaseClasses()).toEqual(['baseA', 'baseB'])

      const final = builder.build()
      expect(final).toEqual(['baseA', 'baseB'])
    })

    it('clearBaseClasses()', () => {
      const builder = new ClassNameBuilder({}, {}, new Set<never>())
      builder.addBaseClasses(['foo', 'bar'])
      builder.clearBaseClasses()
      expect(builder.getBaseClasses()).toEqual([])
      expect(builder.build()).toEqual([])
    })
  })

  // ----------------------------------------------------
  // Variant Classes
  // ----------------------------------------------------
  describe('Variant Classes API', () => {
    it('addVariantClasses() merges classes for a variant key', () => {
      type Variants = { size: 'small' | 'large' }

      const builder = new ClassNameBuilder<Variants>({}, { size: 'small' }, new Set<never>())
      builder.addVariantClasses('size', ['size-sm', 'size-lg'])
      const final = builder.build()
      expect(final).toEqual(['size-sm', 'size-lg'])
    })

    it('replaceVariantClasses() overwrites classes for a variant key', () => {
      type Variants = { color: 'red' }

      const builder = new ClassNameBuilder<Variants>({}, { color: 'red' }, new Set<never>())
      builder.addVariantClasses('color', ['c-red', 'c-green'])
      builder.replaceVariantClasses('color', ['c-blue'])
      const final = builder.build()
      expect(final).toEqual(['c-blue'])
    })

    it('clearVariantClasses() removes them from final output', () => {
      type Variants = { theme: 'dark' | 'light' }

      const builder = new ClassNameBuilder<Variants, never>({}, { theme: 'dark' }, new Set<never>())
      builder.addVariantClasses('theme', ['theme-dark'])
      builder.clearVariantClasses('theme')
      expect(builder.build()).toEqual([])
    })

    it('getVariantClassMap() returns a readonly copy', () => {
      type Variants = { mode: 'on' | 'off' }

      const builder = new ClassNameBuilder<Variants, never>({}, { mode: 'on' }, new Set<never>())
      builder.addVariantClasses('mode', ['mode-on'])

      const map = builder.getVariantClassMap()
      expect(map.mode).toEqual(['mode-on'])

      // mutate returned array => no effect on the real builder
      map.mode?.push('extra')
      expect(builder.build()).toEqual(['mode-on'])
    })
  })

  // ----------------------------------------------------
  // Global State Classes
  // ----------------------------------------------------
  describe('Global State Classes API', () => {
    it('addGlobalStateClasses() applies them if that state is active', () => {
      type States = 'hover'

      const builder = new ClassNameBuilder<NoVariants, States>({}, {}, new Set<States>(['hover']))
      builder.addGlobalStateClasses('hover', ['bg-hover'])
      const final = builder.build()
      expect(final).toEqual(['bg-hover'])
    })

    it('replaceGlobalStateClasses() overwrites existing ones', () => {
      type States = 'focus'

      const builder = new ClassNameBuilder<NoVariants, States>({}, {}, new Set<States>(['focus']))
      builder.addGlobalStateClasses('focus', ['old-focus'])
      builder.replaceGlobalStateClasses('focus', ['new-focus'])
      expect(builder.build()).toEqual(['new-focus'])
    })

    it('clearGlobalStateClasses() removes them from final build', () => {
      type States = 'active' | 'disabled'

      const builder = new ClassNameBuilder<NoVariants, States>(
        {},
        {},
        new Set(['active', 'disabled']),
      )
      builder.addGlobalStateClasses('active', ['active-class'])
      builder.addGlobalStateClasses('disabled', ['disabled-class'])
      builder.clearGlobalStateClasses('active')
      expect(builder.build()).toEqual(['disabled-class'])
    })

    it('getGlobalStateClassesFor() returns a copy of classes for that state', () => {
      type States = 'checked'

      const builder = new ClassNameBuilder<NoVariants, States>({}, {}, new Set(['checked']))
      builder.addGlobalStateClasses('checked', ['some-checked-class'])

      const retrieved = builder.getGlobalStateClassesFor('checked')
      expect(retrieved).toEqual(['some-checked-class'])

      retrieved.push('extra')
      expect(builder.getGlobalStateClassesFor('checked')).toEqual(['some-checked-class'])
    })
  })

  // ----------------------------------------------------
  // Variant-Level State Classes
  // ----------------------------------------------------
  describe('Variant-Level State Classes API', () => {
    it('addVariantStateClasses() merges classes for a variant + state', () => {
      type Variants = { type: 'primary' | 'secondary' }
      type States = 'disabled'

      const builder = new ClassNameBuilder<Variants, States>(
        {},
        { type: 'primary' },
        new Set(['disabled']),
      )
      builder.addVariantStateClasses('type', 'disabled', ['primary-disabled'])
      expect(builder.build()).toEqual(['primary-disabled'])
    })

    it('replaceVariantStateClasses() overwrites them for that variant + state', () => {
      type Variants = { flavor: 'sweet' | 'sour' }
      type States = 'hover'

      const builder = new ClassNameBuilder<Variants, States>(
        {},
        { flavor: 'sweet' },
        new Set(['hover']),
      )
      builder.addVariantStateClasses('flavor', 'hover', ['old-sweet-hover'])
      builder.replaceVariantStateClasses('flavor', 'hover', ['new-sweet-hover'])
      expect(builder.build()).toEqual(['new-sweet-hover'])
    })

    it('clearVariantStateClasses() removes them', () => {
      type Variants = { shape: 'round' | 'square' }
      type States = 'focus' | 'selected'

      const builder = new ClassNameBuilder<Variants, States>(
        {},
        { shape: 'round' },
        new Set(['focus', 'selected']),
      )
      builder.addVariantStateClasses('shape', 'focus', ['round-focus'])
      builder.addVariantStateClasses('shape', 'selected', ['round-selected'])

      builder.clearVariantStateClasses('shape', 'focus')
      expect(builder.build()).toEqual(['round-selected'])
    })

    it('getVariantStateClasses() returns a copy of classes for that variant + state', () => {
      type Variants = { style: 'classic' | 'modern' }
      type States = 'highlighted'

      const builder = new ClassNameBuilder<Variants, States>(
        {},
        { style: 'classic' },
        new Set(['highlighted']),
      )
      builder.addVariantStateClasses('style', 'highlighted', ['classic-highlight'])

      const retrieved = builder.getVariantStateClasses('style', 'highlighted')
      expect(retrieved).toEqual(['classic-highlight'])

      retrieved.push('extra')
      expect(builder.getVariantStateClasses('style', 'highlighted')).toEqual(['classic-highlight'])
    })
  })

  // ----------------------------------------------------
  // Additional Getters & Setters
  // ----------------------------------------------------
  describe('Additional Getters & Setters', () => {
    it('getArtoConfig() returns the original config (read-only)', () => {
      const config: ArtoConfig = {
        className: 'base-classes',
      }

      const builder = new ClassNameBuilder(config, {}, new Set())
      expect(builder.getArtoConfig()).toBe(config)
    })

    it('getSelectedVariants() & setSelectedVariants()', () => {
      type Variants = { size?: string; color?: string }

      const builder = new ClassNameBuilder<Variants>({}, { size: 'medium' }, new Set<never>())
      expect(builder.getSelectedVariants()).toEqual({ size: 'medium' })

      builder.setSelectedVariants({ color: 'red' })
      expect(builder.getSelectedVariants()).toEqual({ color: 'red' })
    })

    it('getActiveStates() & setActiveStates()', () => {
      type States = 'hover' | 'disabled'

      const initStates = new Set<States>(['hover'])

      const builder = new ClassNameBuilder<NoVariants, States>({}, {}, initStates)
      expect(builder.getActiveStates()).toBe(initStates)

      const newStates = new Set<States>(['disabled'])
      builder.setActiveStates(newStates)
      expect(builder.getActiveStates()).toBe(newStates)
    })

    it('getContext() returns the context if any', () => {
      type TestContext = {
        user: string
      }

      const builder = new ClassNameBuilder<NoVariants, never, TestContext>({}, {}, new Set(), {
        user: 'JohnDoe',
      })
      expect(builder.getContext()).toEqual({ user: 'JohnDoe' })
    })
  })
})
