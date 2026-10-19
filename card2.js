const fs=require('fs');const{PNG}=require('./node_modules/pngjs');
const p=PNG.sync.read(fs.readFileSync('./test-asc.png'));
const W=p.width,H=p.height;
const lum=(x,y)=>{const i=(y*W+x)*4;return 0.299*p.data[i]+0.587*p.data[i+1]+0.114*p.data[i+2];};
for(const T of [110,115,120,125]){
  const rowF=[];for(let y=0;y<H;y++){let c=0;for(let x=0;x<W;x++)if(lum(x,y)>T)c++;rowF.push(c/W);}
  let t=0,b=H-1;while(t<H&&rowF[t]<0.6)t++;while(b>0&&rowF[b]<0.6)b--;
  console.log('T',T,'top',t,'bot',b);
}
// ascii bottom with threshold map relative
const ch=v=>v<60?'#':v<95?'+':v<125?'.':' ';
for(let y=755;y<796;y++){
  let s=String(y).padStart(3)+' ';
  for(let x=0;x<300;x+=2)s+=ch(lum(x,y));
  console.log(s);
}
