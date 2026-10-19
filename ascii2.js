const fs=require('fs');const{PNG}=require('./node_modules/pngjs');
const p=PNG.sync.read(fs.readFileSync('./test-asc.png'));
const W=p.width;
const lum=(x,y)=>{const i=(y*W+x)*4;return 0.299*p.data[i]+0.587*p.data[i+1]+0.114*p.data[i+2];};
for(let y=738;y<796;y+=2){
  let s=String(y).padStart(3)+' ';
  for(let x=0;x<220;x+=2){const v=lum(x,y);s+=v<60?'#':v<100?'+':v<160?'.':' ';}
  console.log(s);
}
