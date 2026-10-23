import {loadPublishedApps,publishedAppStoreUrl} from '../../lib/published-apps';
import {MediaNav} from '../../components/blog/OwnedMedia';
import '../dailydharma/landing.css';
export const metadata={"title": "Sleep Reset | Sleep Schedule & Bedtime Routine App", "description": "Start with a free sleep reset score and recovery outlook. Explore paid personalized plans, bedtime timing, guided breathwork and next-morning steps.", "alternates": {"canonical": "https://aniccaai.com/sleepreset"}};
const content={
  "h1": "A bedtime starting point.",
  "intro": "When your sleep schedule feels off, start with a free sleep reset score and recovery outlook. A paid subscription adds a personal reset plan, bedtime timing, guided breathwork, and next-morning steps.",
  "cta": "Get Sleep Reset",
  "note": "Free score and recovery outlook. Plans and guided breathwork require a paid subscription. Requires iOS 18.0 or later.",
  "hero": "score",
  "caption": "Example screen, not a prediction of your results.",
  "sections": [
    [
      "Start with your routine",
      "Answer the app’s onboarding questions about your goals to get your free sleep reset score and recovery outlook.",
      "goals"
    ],
    [
      "See your next steps",
      "A paid subscription unlocks a personalized reset plan, bedtime timing, and next-morning recovery steps. The score is free; unlocking the personalized plan requires a paid subscription.",
      "score"
    ],
    [
      "Follow a breathing session",
      "Follow the breathing count as part of your bedtime routine. Guided breathwork requires a paid subscription.",
      "breathwork"
    ]
  ],
  "faq": [
    [
      "What can I use for free?",
      "The sleep reset score and recovery outlook are free. The personalized plan, bedtime timing, guided breathwork, and next-morning recovery steps require a separate paid subscription."
    ],
    [
      "Does Sleep Reset treat insomnia?",
      "Sleep Reset is a general-wellness app, not medical advice, and does not guarantee a particular sleep outcome."
    ],
    [
      "How do I manage a subscription?",
      "Manage or cancel your subscription in your Apple ID subscription settings. Review the price and renewal terms shown before subscribing."
    ],
    [
      "Which devices can I use?",
      "Sleep Reset is listed for iPhone and requires iOS 18.0 or later."
    ]
  ],
  "close": "Start with your score.",
  "links": [
    [
      "All products",
      "/dais"
    ],
    [
      "Privacy",
      "https://paste.rs/c6Z6L"
    ],
    [
      "Terms",
      "https://paste.rs/Jspqm"
    ],
    [
      "Support",
      "mailto:support@sleepreset.app"
    ]
  ],
  "assets": {
    "goals": {
      "src": "/images/sleepreset/goals.webp",
      "alt": "Sleep Reset onboarding screen asking the user to choose a primary goal."
    },
    "score": {
      "src": "/images/sleepreset/score.webp",
      "alt": "Sleep Reset example score screen showing a score of 24 and an Unlock My Reset Plan button."
    },
    "breathwork": {
      "src": "/images/sleepreset/breathwork.webp",
      "alt": "Sleep Reset guided breathwork screen with an inhale count, cycle indicator and Begin Session button."
    }
  }
};
export default function ProductLanding(){const app=loadPublishedApps().find(a=>a.id==='6762143790');if(!app)throw new Error('Missing published app');const store=publishedAppStoreUrl(app,'detail');const hero=content.assets[content.hero as keyof typeof content.assets];return <main lang="en" className="media-page dhamma-page"><MediaNav/><div className="dhamma-layout"><aside className="dhamma-stage"><img src={hero.src} alt={hero.alt}/></aside><div className="dhamma-content"><header><p>{app.name}</p><h1>{content.h1}</h1><p>{content.intro}</p><a className="media-button" href={store}>{content.cta}</a><p className="dhamma-note">{content.note}</p><img className="dhamma-mobile-hero" src={hero.src} alt={hero.alt}/><p className="dhamma-note">{content.caption}</p></header>{content.sections.map(([heading,body,image])=>{const shot=image?content.assets[image as keyof typeof content.assets]:null;return <section key={heading}><h2>{heading}</h2><p>{body}</p>{shot&&<img className="dhamma-screen" src={shot.src} alt={shot.alt} loading="lazy"/>}</section>})}<section><h2>Your questions</h2>{content.faq.map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</section><section><h2>{content.close}</h2><a className="media-button" href={store}>{content.cta}</a><p className="dhamma-note">{content.note}</p></section><footer>{content.links.map(([label,href])=><a key={href} href={href}>{label}</a>)}</footer></div></div></main>}
