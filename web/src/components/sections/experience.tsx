"use client";

import { motion } from "framer-motion";
import { PortableText } from "next-sanity";
import { SanityImage } from "@/components/ui/sanity-image";
import { formatDateRange } from "@/lib/format-date-range";
import type { EXPERIENCE_QUERY_RESULT } from "../../../sanity.types";

export function Experience({ items }: { items: EXPERIENCE_QUERY_RESULT }) {
  if (items.length === 0) return null;

  return (
    <section id="experience" className="mx-auto max-w-5xl px-6 py-16">
      <h2 className="mb-10 text-sm font-semibold uppercase tracking-widest text-accent">
        Experience
      </h2>
      <ol className="flex flex-col gap-10 border-l border-border pl-6">
        {items.map((item, i) => (
          <motion.li
            key={item._id}
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="relative"
          >
            <span className="absolute -left-[29px] top-1.5 h-2.5 w-2.5 rounded-full bg-accent" />
            <div className="flex items-center gap-3">
              {item.logo?.asset && (
                <SanityImage
                  value={item.logo}
                  width={32}
                  height={32}
                  className="rounded-md"
                />
              )}
              <div>
                <h3 className="text-base font-medium">
                  {item.role} · {item.organization}
                </h3>
                <p className="text-sm text-muted">
                  {formatDateRange(item.startDate, item.endDate)}
                </p>
              </div>
            </div>
            {item.description && (
              <div className="prose prose-neutral prose-sm mt-3 max-w-none text-foreground dark:prose-invert">
                <PortableText value={item.description} />
              </div>
            )}
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
