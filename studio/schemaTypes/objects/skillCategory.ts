// studio/schemaTypes/objects/skillCategory.ts
import { defineArrayMember, defineField, defineType } from 'sanity'
import { TagIcon } from '@sanity/icons/Tag'
import { BulkAddSkillsInput } from '../../src/components/BulkAddSkillsInput'

export const skillCategory = defineType({
  name: 'skillCategory',
  title: 'Skill Category',
  type: 'object',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Category Name',
      type: 'string',
      description: 'e.g. "Frontend", "Backend", "Tools"',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'skills',
      title: 'Skills',
      type: 'array',
      of: [defineArrayMember({ type: 'skill' })],
      components: { input: BulkAddSkillsInput },
      validation: (rule) => rule.min(1).error('Add at least one skill'),
    }),
  ],
  preview: {
    select: { title: 'name', skills: 'skills' },
    prepare({ title, skills }) {
      return { title, subtitle: `${skills?.length ?? 0} skills` }
    },
  },
})
