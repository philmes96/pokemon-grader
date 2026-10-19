const fs=require('fs');const{PNG}=require('./node_modules/pngjs');
const p=PNG.sync.read(fs.readFileSync('./test-asc.png'));
const W=p.width,H=p.height;
const lum=(x,y)=>{const i=(y*W+x)*4;return 0.299*p.data[i]+0.587*p.data[i+1]+0.114*p.data[i+2];};
const rowF=[],colF=[];
for(let y=0;y<H;y++){let c=0;for(let x=0;x<W;x++)if(lum(x,y)>140)c++;rowF.push(c/W);}
for(let x=0;x<W;x++){let c=0;for(let y=0;y<H;y++)if(lum(x,y)>140)c++;colF.push(c/H);}
let t=0,b=H-1;while(t<H&&rowF[t]<0.5)t++;while(b>0&&rowF[b]<0.5)b--;
let l=0,r=W-1;while(l<W&&colF[l]<0.5)l++;while(r>0&&colF[r]<0.5)r--;
console.log('card box',l,t,r,b,'w',r-l+1,'h',b-t+1);
// ASCII of bottom border strip of card, left half
const ch=v=>v<60?'#':v<100?'+':v<160?'.':' ';
for(let y=Math.max(0,b-26);y<=b;y++){
  let s=String(y).padStart(3)+' ';
  for(let x=l;x<l+Math.round((r-l)*0.45);x+=2)s+=ch(lum(x,y));
  console.log(s);
}
