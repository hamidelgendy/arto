import { vi } from 'vitest'
import type { ClassNameBuilder } from '../classname-builder'
import type { ArtoConfig, VariantValue } from '../types'

/**
 * Options for creating a mock ClassNameBuilder in tests,
 * reusing Arto's types.
 */
export interface CreateMockBuilderOptions<
  TVariants extends Record<string, VariantValue>,
  TStates extends string,
  TContext,
> {
  /**
   * The data returned by `getArtoConfig()`. This should be
   * either a partial or full `ArtoConfig` depending on your test.
   */
  artoConfig?: Partial<ArtoConfig<TVariants, TStates, TContext>>

  /**
   * The states considered active in `getActiveStates()`.
   */
  activeStates?: TStates[]

  /**
   * The variants returned by `getSelectedVariants()`.
   */
  selectedVariants?: Partial<TVariants>

  /**
   * The context returned by `getContext()`.
   */
  context?: TContext
}

/**
 * A single helper for all test files that need a mock ClassNameBuilder.
 *
 * @param options - Customize the returned mock (artoConfig, activeStates, etc.)
 * @returns A fully typed mock ClassNameBuilder.
 */
export function createMockBuilder<
  TVariants extends Record<string, VariantValue> = Record<string, VariantValue>,
  TStates extends string = string,
  TContext = unknown,
>(
  options: CreateMockBuilderOptions<TVariants, TStates, TContext> = {},
): ClassNameBuilder<TVariants, TStates, TContext> {
  const { artoConfig = {}, activeStates = [], selectedVariants = {}, context } = options

  return {
    // --- "Getter" methods the tests usually rely on
    getArtoConfig: vi.fn().mockReturnValue(artoConfig),
    getActiveStates: vi.fn().mockReturnValue(new Set<TStates>(activeStates)),
    getSelectedVariants: vi.fn().mockReturnValue(selectedVariants),
    getContext: vi.fn().mockReturnValue(context),

    // --- "Adder" or "Mutator" methods
    addBaseClasses: vi.fn(),
    addGlobalStateClasses: vi.fn(),
    addVariantClasses: vi.fn(),
    addVariantStateClasses: vi.fn(),
    replaceVariantStateClasses: vi.fn(),

    // --- "Clear" methods, if your tests call them
    clearBaseClasses: vi.fn(),
    clearVariantClasses: vi.fn(),
    clearGlobalStateClasses: vi.fn(),
    clearVariantStateClasses: vi.fn(),

    // --- Optionally add the builder’s "post-core" or "final" callback APIs if tested
    addPostCoreCallback: vi.fn(),
    addFinalBuildCallback: vi.fn(),

    // --- If you happen to unit-test the build() or getAllClasses() logic, you can mock them too
    build: vi.fn(),
    getAllClasses: vi.fn().mockReturnValue([]),
  } as unknown as ClassNameBuilder<TVariants, TStates, TContext>
}
