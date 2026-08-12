// studio/schemaTypes/objects/socialLink.ts
import { defineField, defineType } from 'sanity'
import { LinkIcon } from '@sanity/icons/Link'

export const socialLink = defineType({
  name: 'socialLink',
  title: 'Social Link',
  type: 'object',
  icon: LinkIcon,
  fields: [
    defineField({
      name: 'platform',
      title: 'Platform',
      type: 'string',
      options: {
        list: [
          { title: 'GitHub', value: 'github' },
          { title: 'LinkedIn', value: 'linkedin' },
          { title: 'X / Twitter', value: 'twitter' },
          { title: 'Email', value: 'email' },
          { title: 'Other', value: 'other' },
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      validation: (rule) =>
        rule
          .required()
          .uri({ scheme: ['http', 'https', 'mailto'] })
          .error('Must be a valid URL (or mailto: link)'),
    }),
  ],
  preview: {
    select: { title: 'platform', subtitle: 'url' },
  },
})
