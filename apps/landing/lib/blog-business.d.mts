export const BUSINESSES: Record<string, { label: string; intro: string; product?: { href: string; label: string } }>;
export function businessOf(slug: string, project?: string | null): string;

export function editorialOf(slug: string, project?: string | null): string;
