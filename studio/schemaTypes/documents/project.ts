// studio/schemaTypes/documents/project.ts
import { defineArrayMember, defineField, defineType } from 'sanity'
import { ProjectsIcon } from '@sanity/icons/Projects'

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  icon: ProjectsIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true },
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
      name: 'gallery',
      title: 'Gallery',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [defineField({ name: 'alt', type: 'string', title: 'Alternative Text' })],
        }),
      ],
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      description: 'Short text shown on the project card.',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required().max(240),
    }),
    defineField({
      name: 'body',
      title: 'Case Study Body',
      description: 'Optional. If filled in, this project links to a full case-study page.',
      type: 'array',
      of: [defineArrayMember({ type: 'block' }), defineArrayMember({ type: 'image', options: { hotspot: true } })],
    }),
    defineField({
      name: 'techStack',
      title: 'Tech Stack',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'visibility',
      title: 'Visibility',
      description:
        'Public: open-source, links shown as provided. Company / Client: built for an employer/client — shown with a badge explaining why there’s no repo link. Private: personal project you’re keeping closed-source.',
      type: 'string',
      options: {
        list: [
          { title: 'Public (open source)', value: 'public' },
          { title: 'Company / Client project', value: 'company' },
          { title: 'Private project', value: 'private' },
        ],
        layout: 'radio',
      },
      initialValue: 'public',
    }),
    defineField({
      name: 'repoUrl',
      title: 'Repository URL',
      type: 'url',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'liveUrl',
      title: 'Live URL',
      type: 'url',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'showOnSite',
      title: 'Show on Site',
      description: 'Turn off to hide this project from the live site without deleting it (e.g. drafts, work in progress).',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      description: 'Lower numbers show first.',
      type: 'number',
      initialValue: 0,
    }),
  ],
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: { title: 'title', media: 'coverImage', featured: 'featured', showOnSite: 'showOnSite' },
    prepare({ title, media, featured, showOnSite }) {
      const subtitle = [showOnSite === false ? 'Hidden' : undefined, featured ? 'Featured' : undefined]
        .filter(Boolean)
        .join(' · ')
      return { title, subtitle: subtitle || undefined, media }
    },
  },
})
