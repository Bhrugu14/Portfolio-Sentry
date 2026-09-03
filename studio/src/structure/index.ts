import type { StructureResolver } from 'sanity/structure'
import { CogIcon } from '@sanity/icons/Cog'

const SINGLETONS = ['siteSettings']

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Portfolio Content')
    .items([
      S.listItem()
        .title('Site Settings')
        .icon(CogIcon)
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
            .title('Site Settings')
        ),
      S.divider(),
      ...S.documentTypeListItems()
        .filter((listItem) => !SINGLETONS.includes(listItem.getId() as string))
        .map((listItem) =>
          listItem.getId() === 'project'
            ? listItem.child(
                // Same order the website renders projects in (see PROJECTS_QUERY).
                S.documentTypeList('project').defaultOrdering([
                  { field: 'featured', direction: 'desc' },
                  { field: 'order', direction: 'asc' },
                  { field: '_createdAt', direction: 'desc' },
                ])
              )
            : listItem
        ),
    ])
