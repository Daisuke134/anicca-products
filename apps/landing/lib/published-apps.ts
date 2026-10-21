import fs from 'node:fs';
import path from 'node:path';
export type PublishedApp = {id:string;name:string;store:string;intro:{en:string|null;ja:string|null};description:{en:string;ja:string};icon:string;iconSha256:string;presentationLanguage:string;storeLanguages:string[]};
// Generated build input from the immutable canonical marketing package, never a second source registry.
export function loadPublishedApps(): PublishedApp[] {
 const apps=JSON.parse(fs.readFileSync(path.join(process.cwd(),'public/assets/manager-site/published-apps.json'),'utf8')) as PublishedApp[];
 if(apps.length!==6 || new Set(apps.map(a=>a.id)).size!==6)throw new Error('Expected six canonical published apps');
 return apps;
}
