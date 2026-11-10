import Link from 'next/link';
import {loadPublishedApps,publishedAppStoreUrl} from '../../lib/published-apps';
import type {BlogPostMeta} from '../../lib/blog-posts';
import {BUSINESSES,businessOf} from '../../lib/blog-business.mjs';
import {blogLangName} from '../../lib/blog-alternates.mjs';
import './owned-media.css';
export function MediaNav(){return <nav className="media-nav" aria-label="Articles navigation"><Link href="/en" className="media-brand">Anicca</Link><div><Link href="/blog">Articles</Link><Link href="/dais">Products</Link><Link href="/blog/c/research">Research</Link><Link href="/en#story">About</Link></div></nav>}
function ArticleListItems({posts}:{posts:BlogPostMeta[]}){return <ol className="article-list">{posts.map(p=><li key={p.slug}><time dateTime={p.date}>{p.date}</time><div><Link href={`/blog/${p.slug}`}>{p.title}</Link><span className="article-topic">{BUSINESSES[businessOf(p.slug,p.project)]?.label}</span></div></li>)}</ol>}
// Mixed-language lists read as one undifferentiated stream (reader feedback, 2026-11-07), so when a
// list contains more than one language it is split into one block per language. Post URLs and
// ordering inside each language stay exactly as before. Blocks are ordered English, Japanese,
// then any other language (2026-11-08: the corpus also publishes es/pt/fr/de/it/id articles, which
// previously fell into the "English" block because grouping only distinguished ja from non-ja).
export function ArticleList({posts}:{posts:BlogPostMeta[]}){
 const codes=[...new Set(posts.map(p=>p.lang||'en'))];
 if(codes.length<=1)return <ArticleListItems posts={posts}/>;
 const rank=(c:string)=>c==='en'?0:c==='ja'?1:2;
 const groups=codes.sort((a,b)=>rank(a)-rank(b)||a.localeCompare(b)).map(code=>({code,items:posts.filter(p=>(p.lang||'en')===code)}));
 return <div className="article-list-by-lang">{groups.map(g=><section key={g.code} aria-label={g.code==='ja'?'日本語の記事':`Articles in ${blogLangName(g.code)}`} lang={g.code}><h3 className="article-lang-heading">{blogLangName(g.code)}</h3><ArticleListItems posts={g.items}/></section>)}</div>;
}
export function AppDiscovery(){return <section aria-labelledby="apps-heading"><h2 id="apps-heading">Find your next app</h2><div className="media-apps">{loadPublishedApps().map(a=><article key={a.id} id={`app-${a.id}`} data-app-id={a.id} lang={a.presentationLanguage==='ja'?'ja':undefined}><img src={a.icon} alt={`${a.name} app icon`} width="80" height="80" loading="lazy"/><div><h3>{a.name}</h3><p>{a.description.en}</p><div className="media-actions">{a.intro.en&&<a href={a.intro.en} aria-label={`${a.name} introduction`}>{a.presentationLanguage==='ja'?'アプリの紹介':'Explore the app'}</a>}<a href={publishedAppStoreUrl(a,'blog')} aria-label={`${a.name} on the App Store`}>{a.presentationLanguage==='ja'?'App Storeで見る':'View on the App Store'}</a></div></div></article>)}</div></section>}
export function MediaFooter(){return <footer className="media-footer"><Link href="/blog/archive/1">All articles</Link><Link href="/feed.xml">RSS feed</Link><Link href="/en#story">About Anicca</Link></footer>}

// Link to real product summaries, not empty article categories.
export function ProductGuideNav(){return <nav aria-label="Product introductions" className="media-actions">{loadPublishedApps().map(a=><a key={a.id} href={`#app-${a.id}`} lang={a.presentationLanguage==='ja'?'ja':undefined}>{a.name}</a>)}<Link href="/lm">Life Manager (agent in development)</Link></nav>}
