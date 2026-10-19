const fs=require('fs'),{PNG}=require('pngjs');
const img=PNG.sync.read(fs.readFileSync('C:/Users/phill/AppData/Roaming/Hermes/composer-images/image_28fdbd.png'));
const lum=(i)=>0.299*img.data[i]+0.587*img.data[i+1]+0.114*img.data[i+2];
const W=img.width,H=img.height;
const step=10;
for(let y=0;y<H;y+=step){let s='';
 for(let x=0;x<W;x+=step){let sum=0,n=0;
  for(let dy=0;dy<step;dy+=2)for(let dx=0;dx<step;dx+=2){sum+=lum(((y+dy)*W+x+dx)*4);n++;}
  const m=sum/n;s+=m<60?'#':m<130?'+':m<190?'.':' ';}
 console.log(String(y).padStart(4),s);}
