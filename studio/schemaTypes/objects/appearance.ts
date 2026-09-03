// studio/schemaTypes/objects/appearance.ts
import { defineField, defineType } from 'sanity'
import { AppearanceInput } from '../../src/components/AppearanceInput'

export const appearance = defineType({
  name: 'appearance',
  title: 'Appearance',
  type: 'object',
  components: { input: AppearanceInput },
  fields: [
    defineField({
      name: 'activeTheme',
      title: 'Active Theme',
      type: 'string',
      options: {
        list: [
          { title: 'Minimal', value: 'minimal' },
          { title: 'Professional', value: 'professional' },
        ],
      },
      initialValue: 'minimal',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'minimal',
      title: 'Minimal Theme Colors',
      type: 'themeColors',
      initialValue: { background: '#fafafa', text: '#18181b', accent: '#6366f1' },
    }),
    defineField({
      name: 'professional',
      title: 'Professional Theme Colors',
      type: 'themeColors',
      initialValue: { background: '#f8f7f4', text: '#1a1a1a', accent: '#0f4c3a' },
    }),
    defineField({
      name: 'cursorGlowEnabled',
      title: 'Cursor Glow Effect',
      description: 'A soft accent-colored glow that follows the cursor. Applies to both themes. Desktop only (no effect on touch devices).',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'backgroundEffect',
      title: 'Background Effect',
      description:
        'A decorative full-page background animation, colored from the theme\'s own colors above. Applies to both themes. Off by default; skipped automatically for visitors who prefer reduced motion.',
      type: 'string',
      options: {
        list: [
          { title: 'None', value: 'none' },
          { title: 'Particle Network (interactive)', value: 'particles' },
          { title: 'Ripple Grid (interactive)', value: 'ripple' },
          { title: 'Magnetic Orbs (interactive)', value: 'orbs' },
          { title: 'Aurora Drift (ambient)', value: 'aurora' },
          { title: 'Floating Dust (ambient)', value: 'dust' },
        ],
      },
      initialValue: 'none',
    }),
  ],
})
