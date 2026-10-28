// GitHub Pages only serves real files, so a direct hit on /chess would normally
// get 404.html and bounce through the SPA redirect. Copying index.html to each
// top-level route lets those URLs load straight away with a 200.
// (Deeper client-side routes like /cougher/profile still use 404.html.)
import { copyFileSync, mkdirSync } from 'node:fs';

const routes = ['chess', 'cougher', 'projects', 'blog'];
for (const route of routes) {
  mkdirSync(`dist/${route}`, { recursive: true });
  copyFileSync('dist/index.html', `dist/${route}/index.html`);
}
console.log(`SPA fallbacks written for: ${routes.map((r) => '/' + r).join(', ')}`);
