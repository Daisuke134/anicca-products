import Link from "next/link";
import { MediaNav, MediaFooter, ArticleList } from "../../../../components/blog/OwnedMedia";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import { loadAllBlogPosts } from "../../../../lib/blog-posts";
import { BUSINESSES, businessOf } from "../../../../lib/blog-business.mjs";

const SITE = "https://aniccaai.com";

export function generateStaticParams() {
  return Object.keys(BUSINESSES).map((business) => ({ business }));
}

export function generateMetadata({ params }: { params: { business: string } }) {
  const hub = BUSINESSES[params.business];
  if (!hub) return { title: "Not found" };
  return {
    title: `${hub.label} | Anicca Articles`,
    description: hub.intro,
    alternates: { canonical: `${SITE}/blog/c/${params.business}` },
    robots: { index: true, follow: true },
  };
}

export default function BusinessHub({ params }: { params: { business: string } }) {
  const hub = BUSINESSES[params.business];
  if (!hub) notFound();
  const posts = loadAllBlogPosts().filter((p) => businessOf(p.slug, p.project) === params.business);
  const url = `${SITE}/blog/c/${params.business}`;
  return (
    <main className="media-page">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "CollectionPage", name: hub.label, url, description: hub.intro,
        mainEntity: { "@type": "ItemList", numberOfItems: posts.length,
          itemListElement: posts.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/blog/${p.slug}`, name: p.title })) },
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          { "@type": "ListItem", position: 2, name: "Articles", item: `${SITE}/blog` },
          { "@type": "ListItem", position: 3, name: hub.label, item: url },
        ],
      }} />
      <MediaNav/><div className="media-wrap"><header className="media-hero"><h1>{hub.label}</h1><p>{hub.intro}</p>{hub.product && <Link className="media-button" href={hub.product.href}>{hub.product.label}</Link>}</header>{params.business === "research" && <p><Link href="/blog/manager">Manager research</Link> — papers, hypotheses, experiments and measured results from the existing research collection.</p>}<ArticleList posts={posts}/><MediaFooter/></div>
    </main>
  );
}
