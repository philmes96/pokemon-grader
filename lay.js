const fs=require('fs'),{PNG}=require('pngjs');
const img=PNG.sync.read(fs.readFileSync('test-asc.png'));
console.log('dims',img.width,img.height);
const lum=(x,y)=>{const i=(y*img.width+x)*4,d=img.data;return 0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];};
// card bbox: rows/cols that are mostly "card-like" (bright or gray, not <40 very dark bg)
// print coarse map every 8px
const out=[];
for(let y=0;y<img.height;y+=8){
  let s=String(y).padStart(4)+' ';
  for(let x=0;x<img.width;x+=8){const v=lum(x,y);s+=v<45?'#':v<90?'+':v<150?'.':v<200?':':'*';}
  out.push(s);
}
fs.writeFileSync('layout.txt',out.join('\n'));
console.log(out.join('\n'));
