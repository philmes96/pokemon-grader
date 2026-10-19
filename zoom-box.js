const fs=require('fs'),{PNG}=require('pngjs');
const img=PNG.sync.read(fs.readFileSync('test-asc.png'));
const W=img.width;
const lum=(x,y)=>{const i=(y*W+x)*4;return 0.299*img.data[i]+0.587*img.data[i+1]+0.114*img.data[i+2];};
function ascii(x0,x1,y0,y1,step){
  for(let y=y0;y<=y1;y+=step){
    let row='';
    for(let x=x0;x<=x1;x+=step){
      const l=lum(x,y);
      row+= l>200?'W': l>140?'+': l>80?'-': '#';
    }
    console.log(y+' '+row);
  }
}
console.log('=== box region x24-132 y704-730 (1px) ===');
ascii(24,132,704,730,1);
console.log('=== right of box x126-300 y700-750 (2px) ===');
ascii(126,300,700,750,2);
