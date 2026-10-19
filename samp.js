const fs=require('fs');const{PNG}=require('./node_modules/pngjs');
const p=PNG.sync.read(fs.readFileSync('./test-asc.png'));
const W=p.width,H=p.height;
const lum=(x,y)=>{const i=(y*W+x)*4;return 0.299*p.data[i]+0.587*p.data[i+1]+0.114*p.data[i+2];};
for(const y of [640,680,700,720,740,760,780,790]){
  let s='y'+y+': ';
  for(let x=20;x<W;x+=25)s+=String(Math.round(lum(x,y))).padStart(4);
  console.log(s);
}
