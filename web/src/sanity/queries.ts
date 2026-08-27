import { defineQuery } from 'next-sanity'

export const SITE_SETTINGS_QUERY = defineQuery(`
  *[_id == "siteSettings"][0]{
    name,
    title,
    about,
    profileImage{
      asset->{_id, url, metadata{lqip, dimensions{width, height}}},
      alt,
      hotspot,
      crop
    },
    resumeFile{
      asset->{_id, url, originalFilename}
    },
    socialLinks[]{_key, platform, url},
    skillCategories[]{
      _key,
      name,
      skills[]{
        _key,
        name,
        icon{asset->{_id, url}, alt}
      }
    },
    appearance{
      activeTheme,
      minimal{background, text, accent},
      professional{background, text, accent},
      cursorGlowEnabled
    },
    seo{
      title,
      description,
      ogImage{asset->{_id, url}}
    }
  }
`)

export const PROJECTS_QUERY = defineQuery(`
  *[_type == "project" && defined(slug.current) && showOnSite != false] | order(featured desc, order asc, _createdAt desc){
    _id,
    title,
    "slug": slug.current,
    coverImage{
      asset->{_id, url, metadata{lqip, dimensions{width, height}}},
      alt,
      hotspot,
      crop
    },
    summary,
    techStack,
    repoUrl,
    liveUrl,
    featured,
    "hasCaseStudy": defined(body) && length(body) > 0
  }
`)

export const PROJECT_BY_SLUG_QUERY = defineQuery(`
  *[_type == "project" && slug.current == $slug && showOnSite != false][0]{
    _id,
    title,
    "slug": slug.current,
    coverImage{
      asset->{_id, url, metadata{lqip, dimensions{width, height}}},
      alt,
      hotspot,
      crop
    },
    gallery[]{
      _key,
      asset->{_id, url, metadata{lqip, dimensions{width, height}}},
      alt,
      hotspot,
      crop
    },
    summary,
    body,
    techStack,
    repoUrl,
    liveUrl
  }
`)

export const PROJECT_SLUGS_QUERY = defineQuery(`
  *[_type == "project" && defined(slug.current) && showOnSite != false]{"slug": slug.current}
`)

export const EXPERIENCE_QUERY = defineQuery(`
  *[_type == "experience"] | order(startDate desc, order asc){
    _id,
    role,
    organization,
    logo{asset->{_id, url}},
    type,
    startDate,
    endDate,
    description
  }
`)
