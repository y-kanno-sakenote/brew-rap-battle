// PERSONA（人格＋相手別ディス/リスペクト）を読める docs/personas.md に書き出す
// 使い方: node docs/dump_personas.js   （index.html の PERSONA が正典。編集したら再実行）
const fs = require('fs');
const dir = __dirname + '/..';
const html = fs.readFileSync(dir + '/index.html', 'utf8');
const script = html.slice(html.indexOf('<script>') + 8, html.indexOf('// ---- 選択UI ----'));
const sb = {};
new Function('s', script + '\n;Object.assign(s,{FIGHTERS,PERSONA});')(sb);
const { FIGHTERS, PERSONA } = sb;

const esc = s => String(s).replace(/\|/g, '\\|');
let md = `# キャラクター・ペルソナ一覧\n\n`;
md += `各キャラの人格と、相手別の「ディス（攻め口）／リスペクト」。**正典は index.html の \`PERSONA\`**。ここは \`node docs/dump_personas.js\` で自動生成（手編集しない）。\n`;
md += `ディスとリスペクトの根拠は醸造の相互依存：麹→糖化→酵母が糖を食う／乳酸菌→pH低下で雑菌駆逐→酒母を守る／酵母は高アルコール高酸に弱い／杜氏は全工程を采配／酒米は全原料。\n\n`;

for (const id in FIGHTERS) {
  const f = FIGHTERS[id], p = PERSONA[id];
  if (!p) continue;
  md += `## ${f.emoji} ${f.name}\n`;
  md += `*${f.desc}*\n\n`;
  md += `- **一人称**: ${p.pronoun}\n`;
  md += `- **口調**: ${p.tone}\n`;
  md += `- **誇り**: ${p.pride}\n`;
  md += `- **弱点**: ${p.weakness}\n`;
  md += `- **口癖**: ${p.signature.join('・')}\n\n`;
  md += `| 相手 | ディス（攻め口） | リスペクト |\n|---|---|---|\n`;
  for (const oid in FIGHTERS) {
    if (oid === id) continue;
    const dis = (p.dis && p.dis[oid]) || '—';
    const resp = (p.respect && p.respect[oid]) || '—';
    md += `| ${FIGHTERS[oid].name} | ${esc(dis)} | ${esc(resp)} |\n`;
  }
  md += `\n`;
}

fs.writeFileSync(dir + '/docs/personas.md', md);
console.log('書き出し完了: docs/personas.md （', Object.keys(PERSONA).length, 'キャラ）');
