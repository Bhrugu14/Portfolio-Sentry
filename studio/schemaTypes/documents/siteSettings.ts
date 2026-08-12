// studio/schemaTypes/documents/siteSettings.ts
import { defineArrayMember, defineField, defineType } from 'sanity'
import { CogIcon } from '@sanity/icons/Cog'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  icon: CogIcon,
  groups: [
    { name: 'profile', title: 'Profile', default: true },
    { name: 'skills', title: 'Skills' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Full Name',
      type: 'string',
      group: 'profile',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Tagline / Role',
      type: 'string',
      description: 'e.g. "Full-Stack Developer"',
      group: 'profile',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'about',
      title: 'About',
      type: 'array',
      of: [defineArrayMember({ type: 'block' })],
      group: 'profile',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'profileImage',
      title: 'Profile Image',
      type: 'image',
      options: { hotspot: true },
      group: 'profile',
      fields: [
        defineField({
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
          validation: (rule) => rule.required().warning('Alt text is important for SEO'),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'resumeFile',
      title: 'Resume (PDF)',
      type: 'file',
      options: { accept: '.pdf' },
      group: 'profile',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'array',
      of: [defineArrayMember({ type: 'socialLink' })],
      group: 'profile',
    }),
    defineField({
      name: 'skillCategories',
      title: 'Skill Categories',
      type: 'array',
      of: [defineArrayMember({ type: 'skillCategory' })],
      group: 'skills',
      validation: (rule) => rule.min(1).error('Add at least one skill category'),
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      group: 'seo',
      fields: [
        defineField({ name: 'title', type: 'string', title: 'SEO Title' }),
        defineField({
          name: 'description',
          type: 'text',
          title: 'SEO Description',
          validation: (rule) => rule.max(200).warning('Keep it under 200 characters for best SEO'),
        }),
        defineField({
          name: 'ogImage',
          type: 'image',
          title: 'Social Share Image',
          options: { hotspot: true },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'title' },
    prepare({ title, subtitle }) {
      return { title: title || 'Site Settings', subtitle }
    },
  },
})
