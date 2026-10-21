import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname,resolve,extname} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import ts from 'typescript';
const require=createRequire(import.meta.url),cache=new Map();
const root=fileURLToPath(new URL('../../',import.meta.url));
export function compiled(file){
 const path=file instanceof URL?fileURLToPath(file):file;if(cache.has(path))return cache.get(path);
 let {outputText}=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,removeComments:true}});
 // CSS is verified by exact-build browser QA; this helper only renders real server components.
 outputText=outputText.replace(/import\s+['"][^'"]+\.css['"];?/g,'');
 const parsed=ts.createSourceFile(path+'.js',outputText,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
 const replacements=[];
 for(const statement of parsed.statements){
  if(!ts.isImportDeclaration(statement)&&!ts.isExportDeclaration(statement))continue;
  const specifier=statement.moduleSpecifier;if(!specifier||!ts.isStringLiteral(specifier))continue;
  const name=specifier.text;
  if(name.startsWith('node:')||['fs','path'].includes(name))continue;
  let target;
  if(name.startsWith('.')||name.startsWith('@/')){target=name.startsWith('@/')?resolve(root,name.slice(2)):resolve(dirname(path),name);if(!extname(target))target=['.ts','.tsx','.mjs','.js'].map(e=>target+e).find(existsSync);if(!target)throw new Error('Missing '+name);}
  else target=require.resolve(name);
  replacements.push([specifier.getStart(parsed),specifier.end,JSON.stringify(/\.tsx?$/.test(target)?compiled(target):pathToFileURL(target).href)]);
 }
 for(const [start,end,value] of replacements.reverse())outputText=outputText.slice(0,start)+value+outputText.slice(end);
 const url='data:text/javascript;base64,'+Buffer.from(outputText).toString('base64');cache.set(path,url);return url;
}
