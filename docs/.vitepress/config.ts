import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'en-US',
  title: 'Arto Documentation',
  description:
    'Arto is a flexible, **variant- and state-driven** class name management library for JavaScript and TypeScript applications—especially useful for design systems, UI libraries, or any scenario requiring dynamic, composable class strings.',
  head: [['link', { rel: 'icon', href: '/favicon.ico' }]],

  themeConfig: {
    nav: [
      { text: 'Docs', link: 'index' },
      { text: 'API Reference', link: '/api/arto-function' },
      {
        text: 'Contribute',
        link: '/contributing/contributing',
      },
    ],
    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Installation', link: '/getting-started/installation' },
          { text: 'Basic Usage', link: '/getting-started/basic-usage' },
        ],
      },
      {
        text: 'Core Concepts',
        items: [
          { text: 'Variants', link: '/core-concepts/variants' },
          { text: 'States', link: '/core-concepts/states' },
          { text: 'Rules', link: '/core-concepts/rules' },
          { text: 'Plugins', link: '/core-concepts/plugins' },
        ],
      },
      {
        text: 'Advanced Topics',
        items: [
          { text: 'Performance & Optimization', link: '/advanced/performance' },
          { text: 'Context Usage', link: '/advanced/context' },
          { text: 'Testing Your Config', link: '/advanced/testing' },
          { text: 'Accessibility', link: '/advanced/accessibility' },
        ],
      },
      {
        text: 'API Reference',
        items: [
          { text: 'arto()', link: '/api/arto-function' },
          { text: 'ClassNameBuilder', link: '/api/classname-builder' },
          { text: 'Plugin Interface', link: '/api/plugin-interface' },
          { text: 'Rules & Logic Types', link: '/api/rules-types' },
          { text: 'Variants & States Types', link: '/api/variants-states-types' },
          { text: 'ClassName', link: '/api/classname' },
          { text: 'TypeScript Guide', link: '/api/typescript-guide' },
        ],
      },
      {
        text: 'Contributing',
        items: [
          { text: 'Contributing Guide', link: '/contributing/contributing' },
          { text: 'Local Development', link: '/contributing/local-dev' },
          { text: 'Publishing & Release Flow', link: '/contributing/release-flow' },
        ],
      },
    ],
    search: {
      provider: 'local',
    },
    footer: {
      message: 'Open-sourced under the MIT License. Contributions are welcome!',
      copyright: '© 2025 Hamid Elgndy',
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/hamidelgendy/arto' }],
  },
})
