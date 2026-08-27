import { notFound } from "next/navigation";
import { sanityFetch } from "@/sanity/live";
import {
  EXPERIENCE_QUERY,
  PROJECTS_QUERY,
  SITE_SETTINGS_QUERY,
} from "@/sanity/queries";
import type { SectionVisibility } from "@/components/nav";
import { resolveThemeName, THEME_LAYOUTS } from "@/lib/theme-registry";

export default async function Home() {
  const [{ data: settings }, { data: projects }, { data: experience }] =
    await Promise.all([
      sanityFetch({ query: SITE_SETTINGS_QUERY, stega: false }),
      sanityFetch({ query: PROJECTS_QUERY, stega: false }),
      sanityFetch({ query: EXPERIENCE_QUERY, stega: false }),
    ]);

  if (!settings) return notFound();

  const visibility: SectionVisibility = {
    about: (settings.about?.length ?? 0) > 0,
    skills: (settings.skillCategories?.length ?? 0) > 0,
    projects: projects.length > 0,
    experience: experience.length > 0,
  };

  const activeTheme = resolveThemeName(settings.appearance?.activeTheme);
  const Layout = THEME_LAYOUTS[activeTheme];

  return <Layout settings={settings} visibility={visibility} projects={projects} experience={experience} />;
}
