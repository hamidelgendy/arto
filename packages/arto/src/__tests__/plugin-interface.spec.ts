import { PluginRegistry, pluginHub, PluginStage } from '../plugin-interface'

describe('PluginRegistry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('initially has no plugins', () => {
    const registry = new PluginRegistry()
    expect(registry.getPlugins()).toEqual([])
  })

  it('registers a single plugin; defaults are *not* set by the registry', () => {
    const registry = new PluginRegistry()

    const mockPlugin = {
      id: 'test-plugin',
      apply: vi.fn(), // minimal plugin
    }

    registry.register(mockPlugin)
    const all = registry.getPlugins()
    expect(all).toHaveLength(1)
    expect(all[0].id).toBe('test-plugin')
    // In the new approach, the registry doesn't auto-fill `stage` or `order`:
    // If no stage is provided, it remains `undefined` until the ClassNameBuilder.
    expect(all[0].stage).toBeUndefined()
    expect(all[0].order).toBeUndefined()
  })

  it('overwrites a plugin if the same ID is registered again', () => {
    const registry = new PluginRegistry()

    // First plugin
    const pluginV1 = { id: 'same-id', stage: 'before' as PluginStage, order: 0, apply: vi.fn() }
    // Second plugin (overwrites)
    const pluginV2 = { id: 'same-id', stage: 'after' as PluginStage, order: 10, apply: vi.fn() }

    registry.register(pluginV1)
    registry.register(pluginV2)

    const all = registry.getPlugins()
    // Only 1 plugin remains because second overwrote first
    expect(all).toHaveLength(1)
    expect(all[0].id).toBe('same-id')
    // The second plugin's stage/order remain unchanged in the stored plugin
    expect(all[0].stage).toBe('after')
    expect(all[0].order).toBe(10)
  })

  it('registers multiple plugins at once (registerBatch), preserving insertion order', () => {
    const registry = new PluginRegistry()

    const pluginA = { id: 'A', stage: 'before' as PluginStage, order: 2, apply: vi.fn() }
    const pluginB = { id: 'B', stage: 'core' as PluginStage, order: 5, apply: vi.fn() }
    const pluginC = { id: 'C', stage: 'core' as PluginStage, order: 1, apply: vi.fn() }

    registry.registerBatch([pluginA, pluginB, pluginC])
    const all = registry.getPlugins()
    expect(all).toHaveLength(3)

    // With no sorting in the registry, the insertion order should match [A, B, C]:
    expect(all.map((p) => p.id)).toEqual(['A', 'B', 'C'])
  })

  it('unregisters a plugin by ID', () => {
    const registry = new PluginRegistry()

    const pluginA = { id: 'A', apply: vi.fn() }
    registry.register(pluginA)
    expect(registry.getPlugins()).toHaveLength(1)

    registry.unregister('A')
    expect(registry.getPlugins()).toEqual([])
  })

  it('getByStage filters only by stage (no order sorting)', () => {
    const registry = new PluginRegistry()

    const pA = { id: 'A', stage: 'core' as PluginStage, order: 10, apply: vi.fn() }
    const pB = { id: 'B', stage: 'core' as PluginStage, order: 2, apply: vi.fn() }
    const pC = { id: 'C', stage: 'after' as PluginStage, order: 5, apply: vi.fn() }
    const pD = { id: 'D', stage: 'before' as PluginStage, order: 1, apply: vi.fn() }

    registry.registerBatch([pA, pB, pC, pD])

    // Only 'core' => pA, pB
    const corePlugins = registry.getByStage('core')
    expect(corePlugins.map((p) => p.id)).toEqual(['A', 'B'])
    // 'before' => D
    expect(registry.getByStage('before').map((p) => p.id)).toEqual(['D'])
    // 'after' => C
    expect(registry.getByStage('after').map((p) => p.id)).toEqual(['C'])
  })

  it('clear() removes all plugins', () => {
    const registry = new PluginRegistry()

    registry.register({ id: 'p1', apply: vi.fn() })
    registry.register({ id: 'p2', apply: vi.fn() })
    expect(registry.getPlugins()).toHaveLength(2)

    registry.clear()
    expect(registry.getPlugins()).toEqual([])
  })
})

describe('pluginHub (global registry)', () => {
  beforeEach(() => {
    pluginHub.clear()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('is an instance of PluginRegistry', () => {
    expect(pluginHub).toBeInstanceOf(PluginRegistry)
  })

  it('can register/unregister plugins globally', () => {
    pluginHub.register({ id: 'global-1', apply: vi.fn() })
    expect(pluginHub.getPlugins()).toHaveLength(1)

    pluginHub.unregister('global-1')
    expect(pluginHub.getPlugins()).toHaveLength(0)
  })
})
