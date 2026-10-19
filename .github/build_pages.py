"""Build only One-CALC public runtime assets for Cloudflare Pages.
Build command: python3 .github/build_pages.py ; output directory: dist
The existing GitHub Pages runtime files and CNAME are never modified.
"""
from pathlib import Path
import os,re,shutil,subprocess

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'dist'
FILES=['index.html','utilities.css','layout.css','accents.css','page.js','manifest.json','sw.js',
       'icons/icon-192x192.png','icons/icon-512x512.png',
       'assets/brand/onechart-favicon.svg','assets/brand/onechart-lockup-horizontal-black.svg',
       'assets/brand/onechart-lockup-horizontal-white.svg','assets/brand/onechart-og.png']
FILES += ['assets/share/'+name for name in ('share-core.js','share-core.css','tool-share.js','tool-share.css','calc-diagrams.js','calc-diagrams.css','calc-position.js','multi-market-engine.js','multi-market.js','multi-market.css')]
EXTRA={'domain-config.js','404.html','_headers'}
revision=os.environ.get('CF_PAGES_COMMIT_SHA') or subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
if not re.fullmatch('[0-9a-f]{40}',revision):raise ValueError('A concrete Git source revision is required')
OUT.mkdir(exist_ok=True)
for name in FILES:
    source=ROOT/name
    if not source.is_file() or source.is_symlink():raise ValueError('Missing or indirect public asset: '+name)
    target=OUT/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,target)
html=(OUT/'index.html').read_text()
for before,after in [('https://bs.onechart.top/','https://calc.onechartlab.com/'),
                     ('https://simu.onechart.top/','https://simu.onechartlab.com/'),
                     ('https://onechart.top/','https://onechartlab.com/')]:html=html.replace(before,after)
# Only host configuration is injected; financial logic and local storage keys stay intact.
if html.count('<head>')!=1:raise ValueError('Unexpected document head')
html=html.replace('<head>','<head>\n    <script src="./domain-config.js"></script>',1)
(OUT/'index.html').write_text(html)
(OUT/'domain-config.js').write_text("'use strict';\nif (location.hostname === 'calc.onechartlab.com' || location.hostname === 'simu.onechartlab.com') {\n  window.__ONECHART_KELLY_COOKIE_DOMAIN__ = '.onechartlab.com';\n}\n")
sw=(OUT/'sw.js').read_text()
if sw.count("const CACHE_NAME = 'position-calc-v10-share-20261020';")!=1 or sw.count('const APP_SHELL_URLS = [')!=1:raise ValueError('Review the source PWA cache before publishing')
sw=sw.replace("const CACHE_NAME = 'position-calc-v10-share-20261020';","const CACHE_NAME = 'one-calc-com-"+revision[:12]+"';",1)
sw=sw.replace('const APP_SHELL_URLS = [',"const APP_SHELL_URLS = [\n    './domain-config.js',",1)
(OUT/'sw.js').write_text(sw)
(OUT/'404.html').write_text('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>页面不存在 · One-CALC</title><p>页面不存在，请返回<a href="/">仓位计算器</a>。</p></html>\n')
(OUT/'_headers').write_text('/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n/\n  Cache-Control: no-cache\n/index.html\n  Cache-Control: no-cache\n/sw.js\n  Cache-Control: no-cache\n/domain-config.js\n  Cache-Control: no-cache\n')
actual={str(p.relative_to(OUT)) for p in OUT.rglob('*') if p.is_file()}
if actual!=set(FILES)|EXTRA:raise ValueError('Unexpected files in public output: '+repr(actual^(set(FILES)|EXTRA)))
for name in FILES:
    if name not in ['index.html','sw.js'] and (ROOT/name).read_bytes()!=(OUT/name).read_bytes():raise ValueError('Runtime asset changed: '+name)
print('One-CALC public assets:',len(actual),'source:',revision,'canonical: calc.onechartlab.com')
