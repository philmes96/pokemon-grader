const fs=require('fs'),{PNG}=require('pngjs');
const img=PNG.sync.read(fs.readFileSync('test-asc.png'));
const lum=(x,y)=>{const i=(y*img.width+x)*4,d=img.data;return 0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];};
const out=[];
for(let y=695;y<=775;y++){
  let s=String(y).padStart(4)+' ';
  for(let x=0;x<300;x+=2){const v=lum(x,y);s+=v<45?'#':v<90?'+':v<150?'.':v<200?':':'*';}
  out.push(s);
}
fs.writeFileSync('layout2.txt',out.join('\n'));
console.log(out.join('\n'));
