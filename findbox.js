const fs=require('fs');const{PNG}=require('./node_modules/pngjs');
const p=PNG.sync.read(fs.readFileSync('./test-asc.png'));
const W=p.width,H=p.height;
const lum=(x,y)=>{const i=(y*W+x)*4;return 0.299*p.data[i]+0.587*p.data[i+1]+0.114*p.data[i+2];};
const dark=new Uint8Array(W*H);
for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(lum(x,y)<90)dark[y*W+x]=1;
const seen=new Uint8Array(W*H);const q=new Int32Array(W*H);const cands=[];
for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const s=y*W+x;
  if(!dark[s]||seen[s])continue;
  let head=0,tail=0;q[tail++]=s;seen[s]=1;
  let minX=x,maxX=x,minY=y,maxY=y,cnt=0;
  while(head<tail){
    const c=q[head++];const cx=c%W,cy=(c-cx)/W;cnt++;
    if(cx<minX)minX=cx;if(cx>maxX)maxX=cx;if(cy<minY)minY=cy;if(cy>maxY)maxY=cy;
    const nb=[c-1,c+1,c-W,c+W];
    for(const n of nb){if(n<0||n>=W*H)continue;const nx=n%W;if(Math.abs(nx-cx)>1)continue;
      if(dark[n]&&!seen[n]){seen[n]=1;q[tail++]=n;}}
  }
  const bw=maxX-minX+1,bh=maxY-minY+1;
  if(bw>=W*0.05&&bw<=W*0.5&&bh>=H*0.01&&bh<=H*0.12&&cnt/(bw*bh)>0.65&&maxY>H*0.7){
    let bright=0;
    for(let yy=minY;yy<=maxY;yy++)for(let xx=minX;xx<=maxX;xx++)if(lum(xx,yy)>170)bright++;
    cands.push({x:minX,y:minY,w:bw,h:bh,fill:+(cnt/(bw*bh)).toFixed(2),bright});
  }
}
cands.sort((a,b)=>(b.w*b.h)-(a.w*a.h));
console.log('size',W,H);console.log(JSON.stringify(cands.slice(0,10)));
