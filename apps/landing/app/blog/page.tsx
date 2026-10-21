import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { BUSINESSES } from '../../lib/blog-business.mjs';
import { editorialOf } from '../../lib/blog-business.mjs';
import {loadAllBlogPosts} from '../../lib/blog-posts';
import {MediaNav,MediaFooter,ArticleList,AppDiscovery,ProductGuideNav} from '../../components/blog/OwnedMedia';
export const metadata={title:'Articles | Anicca',description:'Practical product guides, founder development notes and research from Anicca.',alternates:{canonical:'https://aniccaai.com/blog'}};
export default function BlogIndex(){
 const posts=loadAllBlogPosts().filter(p=>editorialOf(p.slug,p.project) !== 'Research').slice(0,6);
 const groups=[['Product guides',['anicca','thankful','ai-creator-tools','line-stickers','ebook','ebook-publishing']],['Build Notes & Labs',['notes','ai-voice-tools']],['Research',['research','manager']]] as const;
 return <main className="media-page"><MediaNav/><div className="media-wrap">
 <JsonLd data={{'@context':'https://schema.org','@type':'CollectionPage',name:'Anicca Articles',url:'https://aniccaai.com/blog',description:metadata.description,mainEntity:{'@type':'ItemList',numberOfItems:posts.length,itemListElement:posts.map((p,i)=>({'@type':'ListItem',position:i+1,url:`https://aniccaai.com/blog/${p.slug}`,name:p.title}))}}}/>
 <header className="media-hero"><h1>Articles for everyday life</h1><p>Explore our apps, read practical guides, and follow the development and research behind Anicca.</p><Link href="/blog/archive/1" className="media-button">Browse all articles</Link></header>
 <ProductGuideNav/>
 <AppDiscovery/>
 <section><h2>Latest articles</h2><ArticleList posts={posts}/><Link href="/blog/archive/1">All articles</Link></section>
 {groups.map(([label,keys])=><section key={label}><h2>{label}</h2><div className="media-topics">{keys.filter(key=>BUSINESSES[key]).map(key=><article key={key}><Link href={`/blog/c/${key}`}>{BUSINESSES[key].label}</Link><p>{BUSINESSES[key].intro}</p></article>)}</div></section>)}
 <section aria-label="Elsewhere"><h2>Elsewhere</h2><p>Follow Anicca through our other channels.</p><div className="media-actions"><a href="https://x.com/selawmqt">X updates</a><a href="https://aniccaai.substack.com">Substack</a><Link href="/letter">Anicca Letter</Link></div></section>
 <MediaFooter/></div></main>;
}
