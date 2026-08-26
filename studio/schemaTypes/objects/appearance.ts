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
  ],
})
