// Run against the local dev/preview server. This is not a browser layout test.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
const directory = fileURLToPath(new URL('.', import.meta.url));

async function main() {
  const source = fs.readFileSync(path.join(directory, '../src/components/admin/map-layout.ts'), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const moduleObject = { exports: {} };
  vm.runInNewContext(compiled, { module: moduleObject, exports: moduleObject.exports });
  const { constrainMapPadding } = moduleObject.exports;
  const viewports = [[320, 568], [375, 667], [390, 844], [430, 932], [768, 1024], [844, 390], [1440, 900]];
  const desired = { top: 64, right: 64, bottom: 400, left: 420 };
  for (const [width, height] of viewports) {
    const mapHeight = Math.max(1, height - 176);
    const padding = constrainMapPadding(width, mapHeight, desired);
    assert.ok(padding.left + padding.right <= width * .8 + 1e-8);
    assert.ok(padding.top + padding.bottom <= mapHeight * .8 + 1e-8);
    assert.ok(Object.values(padding).every(value => Number.isFinite(value) && value >= 0));
  }
  for (const size of [0, 1, 24, 64]) {
    const result = constrainMapPadding(size, size, { left: -1, bottom: 999 });
    assert.ok(result.bottom <= size * .8);
    assert.equal(result.left, 0);
  }
  const desktop = { top: 64, right: 64, bottom: 64, left: 420 };
  assert.equal(JSON.stringify(constrainMapPadding(1440, 900, desktop)), JSON.stringify(desktop));
  console.log('PASS: map padding stays valid at seven portrait/landscape sizes, tiny containers and desktop.');

  const base = process.env.PREVIEW_URL || 'http://localhost:3000';
  const routes = ['/', '/map', '/app', '/app/trees', '/app/map', '/app/profile', '/app/report', '/app/reports', '/app/explore', '/app/hazards', '/app/maintenance', '/contractor', '/contractor/tasks', '/contractor/map', '/contractor/history', '/admin', '/admin/map', '/admin/trees', '/admin/maintenance', '/admin/hazards', '/admin/sla', '/admin/insights', '/admin/operations'];
  const stylesheets = new Map();
  for (const route of routes) {
    const response = await fetch(base + route);
    assert.equal(response.status, 200, route);
    const html = await response.text();
    assert.match(html, /name="viewport"[^>]*width=device-width/, route);
    assert.doesNotMatch(html, /user-scalable=no|maximum-scale=1(?:[,\"])/, route);
    const styles = [];
    for (const match of html.matchAll(/<link[^>]+href="([^" ]+\.css[^" ]*)"/g)) {
      const url = new URL(match[1].replaceAll('&amp;', '&'), base).href;
      if (!stylesheets.has(url)) {
        const css = await fetch(url);
        assert.equal(css.status, 200, url);
        stylesheets.set(url, await css.text());
      }
      styles.push(stylesheets.get(url));
    }
    const css = styles.join('\n');
    for (const selector of ['.site-menu-toggle', '.admin-operations-dialog', '.nature-form-progress', '100dvh']) {
      assert.ok(css.includes(selector), `${route}: missing emitted responsive rule ${selector}`);
    }
    if (route === '/' || route === '/map') {
      assert.match(html, /aria-label="Open navigation"/);
      assert.match(html, /aria-expanded="false"/);
    }
    console.log(`PASS: ${route} loads, permits zoom and includes responsive styles.`);
  }
  console.log('Browser rendering, touch interactions and real-device checks still require manual or browser-based QA.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
