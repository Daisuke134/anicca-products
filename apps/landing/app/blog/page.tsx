import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import type {ReactNode} from 'react';
import { BUSINESSES } from '../../lib/blog-business.mjs';
import { businessOf, editorialOf } from '../../lib/blog-business.mjs';
import {loadAllBlogPosts} from '../../lib/blog-posts';
import {MediaNav,MediaFooter,ArticleList} from '../../components/blog/OwnedMedia';
import {AppDiscovery} from '../../components/blog/OwnedMedia';
export const metadata={title:'Short-Video Hooks, Scripts & AI Agent Research: Free Guides (2026) | Anicca',description:'Free guides to short-video hooks and scripts for TikTok, Reels and YouTube Shorts, plus research on AI agents and zero-human companies, and the work behind Anicca. Browse by topic.',alternates:{canonical:'https://aniccaai.com/blog'}};
// Preserve the canonical Manager overlay's category-link integration point.
function TopicLink({topic,children}:{topic:string;children:ReactNode}){
 const key=topic;
 if(key==='manager')return <Link href="/blog/manager">{children}</Link>;
 return <Link href={`/blog/c/${key}`}>{children}</Link>;
}
export default function BlogIndex(){
 const corpus=loadAllBlogPosts();
 const posts=corpus.filter(p=>editorialOf(p.slug,p.project) !== 'Research').slice(0,6);
 const groups=[['Research',['research']],['Products & publishing',['anicca','thankful','ai-creator-tools','line-stickers','ebook','ebook-publishing']],['Build Notes & Labs',['notes','ai-voice-tools']]] as const;
 const topics=groups.flatMap(([,keys])=>keys.map(key=>{
  const hub=BUSINESSES[key];
  const articles=corpus.filter(p=>key==='research'?editorialOf(p.slug,p.project)==='Research':editorialOf(p.slug,p.project)!=='Research'&&businessOf(p.slug,p.project)===key).slice(0,2);
  return {key,...hub,href:`/blog/c/${key}`,articles};
 })).filter(topic=>topic.articles.length>0);
 return <main className="media-page"><MediaNav/><div className="media-wrap">
 <JsonLd data={{'@context':'https://schema.org','@type':'CollectionPage',name:'Anicca Articles',url:'https://aniccaai.com/blog',description:metadata.description,mainEntity:{'@type':'ItemList',numberOfItems:topics.length,itemListElement:topics.map((topic,i)=>({'@type':'ListItem',position:i+1,url:`https://aniccaai.com${topic.href}`,name:topic.label}))}}}/>
 <header className="media-hero"><p className="article-topic">The work, in words</p><h1>Explore by topic.</h1><p>Free guides to short-video hooks and scripts (TikTok, Reels, YouTube Shorts), research on AI agents and zero-human companies, and notes on publishing and experiments. Choose an area to explore the work behind Anicca.</p><Link href="/blog/archive/1" className="media-button">Browse all articles</Link></header>
 {groups.map(([label,keys])=>{const entries=topics.filter(topic=>keys.some(key=>key===topic.key));return entries.length>0&&<section key={label}><h2>{label}</h2><div className="topic-directory">{entries.map(topic=><article key={topic.key} data-topic={topic.key}><h3><TopicLink topic={topic.key}>{topic.label}</TopicLink></h3><p>{topic.intro}</p>{topic.key==='research'&&<p><Link href="/blog/manager">Manager research collection</Link></p>}<ul>{topic.articles.map(p=><li key={p.slug} data-article-preview={p.slug}><Link href={`/blog/${p.slug}`}>{p.title}</Link><time dateTime={p.date}>{p.date}</time></li>)}</ul><span className="topic-browse"><TopicLink topic={topic.key}>Browse {topic.label}</TopicLink></span></article>)}</div></section>})}
 <section aria-labelledby="latest-heading"><h2 id="latest-heading">Latest articles</h2><ArticleList posts={posts}/><Link href="/blog/archive/1">All articles</Link></section>
 <section aria-label="Elsewhere"><h2>Elsewhere</h2><p>Follow Anicca through our other channels.</p><div className="media-actions"><a href="https://x.com/selawmqt">X updates</a><a href="https://aniccaai.substack.com">Substack</a><Link href="/letter">Anicca Letter</Link></div></section>
 <AppDiscovery/>
 <nav aria-label="Guides and FAQ"><h2>Guides and FAQ</h2><ul><li><a href="/guides/compare/text-message-interpreter-apps/">Text message interpreter apps compared</a></li><li><a href="/guides/what-does-this-text-mean-app/">An app that explains what a text means</a></li><li><a href="/guides/ai-reply-suggestions-text/">AI reply suggestions for a text message</a></li><li><a href="/honne-faq/">Honne FAQ</a></li><li><a href="/guides/gratitude-journal-prompts/">Gratitude journal prompts for busy days</a></li><li><a href="/guides/simple-gratitude-journal-app/">A simple gratitude journal app</a></li><li><a href="/thankful-faq/">Thankful FAQ</a></li><li><a href="/pdf-insight">PDF Insight: summaries and cited answers</a></li><li><a href="/lm/guide/busy-day-schedule-travel-buffer">外出が多い日のスケジュールの組み方</a></li><li><a href="/ai-cafe-tokyo/">AI cafe Tokyo</a></li><li><a href="/ai-grave/">AI grave in Tokyo</a></li></ul></nav>
 <MediaFooter/></div></main>;
}
