import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const size=name=>{const b=readFileSync(new URL('./wallet-assets/'+name,import.meta.url));assert.equal(b.toString('ascii',1,4),'PNG');return [b.readUInt32BE(16),b.readUInt32BE(20)];};
test('wallet artwork is bundled with the expected sizes',()=>{
 assert.deepEqual(size('google-logo.png'),[660,660]);
 assert.deepEqual(size('google-wide-logo.png'),[1280,400]);
 assert.deepEqual(size('hero-base.png'),[1032,336]);
 assert.deepEqual(size('hero-nophoto.png'),[1032,336]);
 for(const [s,k] of [['',1],['@2x',2],['@3x',3]]){assert.deepEqual(size('apple-icon'+s+'.png'),[29*k,29*k]);const [w,h]=size('apple-logo'+s+'.png');assert.ok(w<=160*k&&h===50*k);}
});
