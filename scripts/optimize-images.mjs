#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const dir = 'public/images';
const files = fs.readdirSync(dir).filter((f) =>
  /\.(jpe?g|png)$/i.test(f),
);

async function run() {
  for (const f of files) {
    const p = path.join(dir, f);
    const ext = path.extname(f).toLowerCase();
    const stats = fs.statSync(p);
    if (stats.size < 180 * 1024) continue;
    try {
      if (ext === '.jpg' || ext === '.jpeg') {
        await sharp(p)
          .jpeg({ quality: 82, mozjpeg: true })
          .toFile(p + '.tmp');
      } else if (ext === '.png') {
        await sharp(p).png({ quality: 90 }).toFile(p + '.tmp');
      } else {
        continue;
      }
      const tmp = fs.statSync(p + '.tmp');
      if (tmp.size < stats.size) {
        fs.renameSync(p + '.tmp', p);
        console.log('reduced', f, stats.size, '->', tmp.size);
      } else {
        fs.unlinkSync(p + '.tmp');
      }
    } catch (e) {
      console.warn('skip', f, e);
    }
  }
}

run();
