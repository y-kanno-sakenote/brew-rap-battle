// 採掘器(mine_corpus.py)へ渡すエンジン情報を吐く: 既存VOCAB語 + role→{sig3,form}
// 使い方: node docs/dump_engine.js > /tmp/engine_dump.json
const fs = require('fs');
const dir = __dirname + '/..';
const html = fs.readFileSync(dir + '/index.html', 'utf8');
const script = html.slice(html.indexOf('<script>') + 8, html.indexOf('// ---- 選択UI ----'));
const sb = {};
new Function('s', script + '\n;Object.assign(s,{VOCAB,ROLE_SIG});')(sb);
const lint = fs.readFileSync(dir + '/lint.js', 'utf8');
const fb = lint.slice(lint.indexOf('const FORM = {') + 13, lint.indexOf('};', lint.indexOf('const FORM = {')));
const FORM = {};
for (const m of fb.matchAll(/(\w+):'([^']+)'/g)) FORM[m[1]] = m[2];
const roles = {};
for (const r in sb.ROLE_SIG) roles[r] = { sig: sb.ROLE_SIG[r], form: FORM[r] || '?' };
process.stdout.write(JSON.stringify({ vocab: Object.keys(sb.VOCAB), roles }));
