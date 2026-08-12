import { defineArrayMember, defineField, defineType } from 'sanity'
import { CaseIcon } from '@sanity/icons/Case'

export const experience = defineType({
  name: 'experience',
  title: 'Experience',
  type: 'document',
  icon: CaseIcon,
  fields: [
    defineField({
      name: 'role',
      title: 'Role / Degree',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'organization',
      title: 'Organization',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          { title: 'Work', value: 'work' },
          { title: 'Education', value: 'education' },
        ],
        layout: 'radio',
      },
      initialValue: 'work',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'startDate',
      title: 'Start Date',
      type: 'date',
      options: { dateFormat: 'YYYY-MM' },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'endDate',
      title: 'End Date',
      description: 'Leave empty if this is your current role.',
      type: 'date',
      options: { dateFormat: 'YYYY-MM' },
      validation: (rule) =>
        rule.custom((endDate, context) => {
          const doc = context.document as { startDate?: string } | undefined
          if (endDate && doc?.startDate && new Date(endDate as string) < new Date(doc.startDate)) {
            return 'End date must be after start date'
          }
          return true
        }),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [defineArrayMember({ type: 'block' })],
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      description: 'Lower numbers show first when dates tie.',
      type: 'number',
      initialValue: 0,
    }),
  ],
  orderings: [
    {
      title: 'Start Date, Newest First',
      name: 'startDateDesc',
      by: [{ field: 'startDate', direction: 'desc' }],
    },
  ],
  preview: {
    select: { title: 'role', subtitle: 'organization', media: 'logo' },
  },
})
