const fs=require('fs');const{PNG}=require('./node_modules/pngjs');
const p=PNG.sync.read(fs.readFileSync('./test-asc.png'));
const W=p.width,H=p.height;
const lum=(x,y)=>{const i=(y*W+x)*4;return 0.299*p.data[i]+0.587*p.data[i+1]+0.114*p.data[i+2];};
const y0=Math.round(H*0.80),y1=Math.round(H*0.99);
for(const t of [110,140]){
  const col=new Array(W).fill(0);
  for(let y=y0;y<y1;y++)for(let x=0;x<W;x++)if(lum(x,y)<t)col[x]++;
  const n=y1-y0;
  let s='t'+t+': ';
  for(let x=0;x<W;x+=8){s+=String(Math.round(col[x]/n*100)).padStart(3);}
  console.log(s);
}
// row profile in left half
const x0=0,x1=Math.round(W*0.5);
for(let y=y0;y<y1;y+=4){
  let c=0;for(let x=x0;x<x1;x++)if(lum(x,y)<140)c++;
  console.log(y, c, Math.round(c/(x1-x0)*100));
}
