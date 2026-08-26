// studio/schemaTypes/objects/themeColors.ts
import { defineField, defineType } from 'sanity'

export const themeColors = defineType({
  name: 'themeColors',
  title: 'Theme Colors',
  type: 'object',
  fields: [
    defineField({
      name: 'background',
      title: 'Background',
      type: 'string',
      validation: (rule) => rule.required().regex(/^#[0-9a-fA-F]{6}$/, { name: 'hex color' }),
    }),
    defineField({
      name: 'text',
      title: 'Text',
      type: 'string',
      validation: (rule) => rule.required().regex(/^#[0-9a-fA-F]{6}$/, { name: 'hex color' }),
    }),
    defineField({
      name: 'accent',
      title: 'Accent',
      type: 'string',
      validation: (rule) => rule.required().regex(/^#[0-9a-fA-F]{6}$/, { name: 'hex color' }),
    }),
  ],
})
