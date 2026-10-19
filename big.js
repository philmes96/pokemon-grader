const fs=require('fs');const{PNG}=require('./node_modules/pngjs');
const p=PNG.sync.read(fs.readFileSync('./test-asc.png'));
const W=p.width;
const lum=(x,y)=>{const i=(y*W+x)*4;return 0.299*p.data[i]+0.587*p.data[i+1]+0.114*p.data[i+2];};
const ch=v=>v<70?'#':v<105?'+':v<135?'.':' ';
for(let y=738;y<796;y++){
  let s=String(y).padStart(3)+' ';
  for(let x=0;x<W;x+=4)s+=ch(lum(x,y));
  console.log(s);
}
