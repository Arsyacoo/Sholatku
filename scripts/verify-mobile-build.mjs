import { access, readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const outputDirectory = resolve('dist-mobile');
const indexPath = resolve(outputDirectory, 'index.html');
const secretCanary = 'SHOLATKU_TEST_SERVER_SECRET';

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  }));
  return files.flat();
}

const indexHtml = await readFile(indexPath, 'utf8');
if (indexHtml.includes('/sw.js')) throw new Error('Mobile shell must not reference a service worker.');
if (indexHtml.includes('server.url')) throw new Error('Mobile shell must not contain a remote-wrapper server URL.');

const referencedAssets = [...indexHtml.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map((match) => match[1]);
if (!referencedAssets.length) throw new Error('Mobile index.html does not reference bundled JavaScript or CSS.');
await Promise.all(referencedAssets.map((asset) => access(resolve(outputDirectory, asset.replace(/^\//, '')))));

const output = await Promise.all((await listFiles(outputDirectory)).map((file) => readFile(file, 'utf8')));
const emittedSource = output.join('\n');
if (emittedSource.includes(secretCanary)) throw new Error('A server-secret canary was emitted in the mobile build.');
if (emittedSource.includes('server.url')) throw new Error('A remote-wrapper server URL was emitted in the mobile build.');
if (emittedSource.includes('.next/server')) throw new Error('Mobile output must not depend on a Next.js server artifact.');

console.log(`Validated static mobile shell with ${referencedAssets.length} referenced assets.`);
