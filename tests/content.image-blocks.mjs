import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {extract, readHTML, root, script} from './extract.mjs';
import {assert, suite} from './test-util.mjs';

await suite('image blocks', t => {
  const html = readHTML();
  const src = script(html);
  const helper = src.match(/function isLocalImageSrc\([^]*?\n}/);
  assert(helper, 'isLocalImageSrc missing');
  const isLocalImageSrc = vm.runInNewContext('(' + helper[0] + ')');

  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const precache = sw.match(/const PRECACHE_URLS = (\[[^]*?\]);/);
  assert(precache, 'PRECACHE_URLS missing');
  const precacheURLs = vm.runInNewContext(precache[1]);

  function validateImage(block) {
    assert(typeof block.alt === 'string' && block.alt.trim(), 'Expected non-empty alt text');
    assert(isLocalImageSrc(block.src), 'Expected a local diagram path');
    assert(fs.existsSync(path.join(root, block.src)), 'Diagram file missing');
    if (Object.hasOwn(block, 'caption')) {
      assert(typeof block.caption === 'string' && block.caption.trim(), 'Expected a non-empty caption');
    }
    const url = './' + block.src.replace(/^\.\//, '');
    assert(precacheURLs.includes(url), 'Diagram missing from PRECACHE_URLS');
  }

  const good = {type: 'image', src: 'diagrams/AIM-L02-token-loop.png', alt: 'Token loop'};
  for (const value of [good.src, './diagrams/x.svg', 'diagrams/A.JPG', 'diagrams/a.JPEG', 'diagrams/a.webp']) {
    t.check('accept ' + value, () => assert.equal(isLocalImageSrc(value), true));
  }
  for (const value of [
    'https://example.com/a.png', '//cdn.example.com/a.png', '/diagrams/a.png',
    'diagrams/../index.html', '../diagrams/a.png', 'data:image/png;base64,AAAA',
    'javascript:alert(1)', 'diagrams/sub/a.png', 'diagrams/a.png?x=1',
    'diagrams/a.gif', '', null, undefined, 42, 'diagrams/a..png',
    'diagrams//a.png', 'diagrams\\a.png', 'diagrams/a.png#x', 'diagrams/a.png\n',
    'Diagrams/a.png', 'blob:example', 'http://example.com/a.png',
  ]) {
    t.check('reject ' + JSON.stringify(value), () => assert.equal(isLocalImageSrc(value), false));
  }

  let count = 0;
  for (const [name, lessons] of Object.entries(extract(html))) {
    if (!name.endsWith('_LESSONS')) continue;
    lessons.forEach((lesson, i) => lesson.content.forEach((block, j) => {
      if (block.type !== 'image') return;
      count++;
      t.check(`${name}[${i}].content[${j}]`, () => validateImage(block));
    }));
  }
  console.log(`image blocks: ${count} in lesson content`);

  t.check('renderBlock guards the image branch', () => {
    const renderer = src.match(/const renderBlock = \(block, i\) => \{[^]*?\n  \};/);
    assert(renderer, 'renderBlock missing');
    const image = renderer[0].match(/case "image":([^]*?)(?=\n\s*(?:case |default:)|$)/);
    assert(image, 'image case missing');
    assert.match(image[1], /isLocalImageSrc\(block\.src\)/);
    assert.match(image[1], /typeof block\.alt !== "string"/);
    assert.match(image[1], /!block\.alt\.trim\(\)/);
    assert.doesNotMatch(image[1], /http/i);
  });

  for (const file of fs.readdirSync(path.join(root, 'diagrams')).sort()) {
    if (/\.png$/i.test(file)) {
      t.check('precache ' + file, () => assert(precacheURLs.includes('./diagrams/' + file)));
    }
  }
  t.check('precache URLs are relative', () => {
    for (const url of precacheURLs) {
      assert.equal(typeof url, 'string');
      assert.doesNotMatch(url.trim(), /^(?:[a-z][a-z0-9+.-]*:|[/\\])/i);
    }
  });

  for (const url of precacheURLs) {
    if (url === './') continue;
    t.check(`precache file exists: ${url}`, () => {
      assert(fs.existsSync(path.join(root, url)), `Precache file missing: ${url}`);
    });
  }

  const {alt, ...missingAlt} = good;
  for (const [label, block, error] of [
    ['missing alt', missingAlt, /alt text/],
    ['whitespace alt', {...good, alt: '  '}, /alt text/],
    ['remote src', {...good, src: 'https://example.com/a.png'}, /local diagram path/],
    ['missing file', {...good, src: 'diagrams/missing-image-block-fixture.png'}, /file missing/],
  ]) {
    t.check('invalid fixture: ' + label, () => assert.throws(() => validateImage(block), error));
  }
  t.check('valid fixture', () => validateImage({...good, src: './' + good.src, caption: 'Token loop'}));
});
