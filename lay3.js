const fs=require('fs'),{PNG}=require('pngjs');
const img=PNG.sync.read(fs.readFileSync('test-asc.png'));
const lum=(x,y)=>{const i=(y*img.width+x)*4,d=img.data;return 0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];};
// per column stats in y 700-770
console.log('col: black<40 frac | white>210 frac');
let rows=[];
for(let x=0;x<300;x++){
  let b=0,w=0,n=0;
  for(let y=700;y<770;y++){const v=lum(x,y);n++;if(v<40)b++;if(v>210)w++;}
  rows.push(String(x).padStart(4)+':'+b.toString().padStart(3)+' '+w.toString().padStart(3));
}
fs.writeFileSync('colstat.txt',rows.join('\n'));
// print compact: columns where black>40
let s='';
for(let x=0;x<300;x++){const b=Math.round(rows? (x,0):0);}
