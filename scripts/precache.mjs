import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';

const files = (await readdir('dist', { recursive: true, withFileTypes: true }))
  .filter(entry => entry.isFile() && !['sw.js', '.nojekyll'].includes(entry.name))
  .map(entry => entry.parentPath.replace(/^dist\/?/, '') + '/' + entry.name)
  .map(name => './' + name.replace(/^\//, ''))
  .sort();
const template = await readFile('scripts/service-worker.js', 'utf8');
const version = createHash('sha256').update(template);
for (const file of files) version.update(file).update(await readFile('dist/' + file));
await writeFile('dist/sw.js', template
  .replace('/*__FILES__*/ []', JSON.stringify(files))
  .replace('__REVISION__', version.digest('hex').slice(0, 16)));
await writeFile('dist/.nojekyll', '');
