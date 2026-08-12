// studio/schemaTypes/objects/skill.ts
import { defineField, defineType } from 'sanity'
import { TagIcon } from '@sanity/icons/Tag'

export const skill = defineType({
  name: 'skill',
  title: 'Skill',
  type: 'object',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'icon',
      title: 'Icon',
      description: 'Small square logo/icon for this skill (e.g. a technology logo).',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', type: 'string', title: 'Alternative Text' }),
      ],
    }),
  ],
  preview: {
    select: { title: 'name', media: 'icon' },
  },
})
