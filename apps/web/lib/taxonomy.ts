import type { Kind } from "@apprank/core";

// ---------------------------------------------------------------------------
// TAXONOMY — single source of truth for listing categories per kind.
// Shared by the publish modal (category picker) and the board browse (sub-filter).
// Keep in sync with any backend validation if categories become constrained.
// "Other" is last deliberately (see CATEGORY_OTHER). Alphabetical otherwise.
// ---------------------------------------------------------------------------
export const KIND_CATS: Record<Exclude<Kind, "idea">, string[]> = {
  app: [
    "Agencies, Studios & Services",
    "AI Agents & Infrastructure",
    "AI Media Generation",
    "Audio, Voice & Podcasting",
    "Business, Finance & Legal",
    "Crypto, Web3 & Investing",
    "Design & Creative",
    "Developer Tools",
    "Directories, Launch & Discovery",
    "Domains & Web Assets",
    "Ecommerce & Retail",
    "Education & Learning",
    "Games & Entertainment",
    "Health, Fitness & Wellness",
    "Hiring, Jobs & Careers",
    "Leaderboards & Attention Markets",
    "Marketing & Advertising",
    "Media & News",
    "People & Profiles",
    "Productivity & Personal Tools",
    "Real Estate & Property",
    "Sales & Lead Generation",
    "Security, Privacy & Compliance",
    "SEO & AI Visibility",
    "Social Media & Creator Tools",
    "Travel, Local & Lifestyle",
    "Writing & Content",
    "Other",
  ],
  mcp: [
    "Browser & Web",
    "Cloud & Hosting",
    "Coding & IDE",
    "Communication",
    "Database",
    "Developer Tools",
    "File & Storage",
    "Machine Learning",
    "Memory & Knowledge",
    "Monitoring",
    "Notifications",
    "Observability & Logging",
    "Payments",
    "Search & Retrieval",
    "Security & Auth",
    "Webhooks & APIs",
    "Other",
  ],
  skill: [
    "Agents & Orchestration",
    "Coding & Engineering",
    "Customer Support",
    "Data & Analytics",
    "Design & Creative",
    "Education & Learning",
    "Finance & Accounting",
    "Marketing & Growth",
    "Media & Audio",
    "Productivity & Personal",
    "Research & Analysis",
    "Sales & CRM",
    "Security & Compliance",
    "Writing & Content",
    "Other",
  ],
};

/** Categories that apply to each kind (used for form + filter). Ideas have none. */
export function categoriesFor(kind: Kind): string[] {
  return kind === "idea" ? [] : KIND_CATS[kind];
}
