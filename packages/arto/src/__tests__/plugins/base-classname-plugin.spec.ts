import { BaseClassNamePlugin } from '../../plugins/base-classname-plugin'
import * as Utils from '../../utils'
import { ClassNameCallback } from '../../types'
import { createMockBuilder } from '../test-utils'

describe('BaseClassNamePlugin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('defaults to order=0 if not specified', () => {
      const plugin = new BaseClassNamePlugin()

      expect(plugin.order).toBe(0)
      expect(plugin.stage).toBe('core')
      expect(plugin.id).toBe('arto/Internal/AddBaseClassesPlugin')
    })

    it('respects provided order', () => {
      // Provide an order=10
      const plugin = new BaseClassNamePlugin(10)
      expect(plugin.order).toBe(10)
      expect(plugin.stage).toBe('core')
    })
  })

  describe('apply() method', () => {
    it('does nothing if artoConfig.className is not defined', () => {
      const plugin = new BaseClassNamePlugin()
      const mockBuilder = createMockBuilder()
      plugin.apply(mockBuilder)
      expect(mockBuilder.addBaseClasses).not.toHaveBeenCalled()
    })

    it('adds base classes if className is present as a string', () => {
      const plugin = new BaseClassNamePlugin()

      // Stub out normalizeClassName
      const normalizeSpy = vi
        .spyOn(Utils, 'normalizeClassName')
        .mockReturnValue(['base-classA', 'base-classB'])

      const mockBuilder = createMockBuilder({
        artoConfig: { className: 'base-classA base-classB' },
      })

      plugin.apply(mockBuilder)

      expect(normalizeSpy).toHaveBeenCalledWith('base-classA base-classB', undefined)
      expect(mockBuilder.addBaseClasses).toHaveBeenCalledWith(['base-classA', 'base-classB'])

      normalizeSpy.mockRestore()
    })

    it('adds base classes if className is an array', () => {
      const plugin = new BaseClassNamePlugin()

      const mockBuilder = createMockBuilder({
        artoConfig: { className: ['foo', 'bar'] },
      })

      plugin.apply(mockBuilder)

      expect(mockBuilder.addBaseClasses).toHaveBeenCalledWith(['foo', 'bar'])
    })

    it('adds base classes if className is a callback', () => {
      interface Context {
        user: string
      }
      const plugin = new BaseClassNamePlugin<never, never, Context>()

      const classNameCallback = vi.fn<ClassNameCallback<Context>>((ctx) => `cb-${ctx?.user}`)

      const mockBuilder = createMockBuilder<never, never, Context>({
        // artoConfig: { className: classNameCallback },
        artoConfig: { className: classNameCallback },
        context: { user: 'Alice' },
      })

      plugin.apply(mockBuilder)

      // The callback is invoked once with { user:'Alice' }
      expect(classNameCallback).toHaveBeenCalledWith({ user: 'Alice' })
      // Suppose normalizeClassName => ['cb-Alice']
      expect(mockBuilder.addBaseClasses).toHaveBeenCalledWith(['cb-Alice'])
    })
  })
})
