import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'en-US',
  title: 'Arto Documentation',
  description:
    'Arto is a flexible, **variant- and state-driven** class name management library for JavaScript and TypeScript applications—especially useful for design systems, UI libraries, or any scenario requiring dynamic, composable class strings.',
  head: [['link', { rel: 'icon', href: '/favicon.ico' }]],

  themeConfig: {
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
