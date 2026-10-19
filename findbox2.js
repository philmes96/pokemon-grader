const fs=require('fs');const{PNG}=require('./node_modules/pngjs');
function cands(file,thr){
  const p=PNG.sync.read(fs.readFileSync(file));
  const W=p.width,H=p.height;
  const lum=(x,y)=>{const i=(y*W+x)*4;return 0.299*p.data[i]+0.587*p.data[i+1]+0.114*p.data[i+2];};
  const dark=new Uint8Array(W*H);
  for(let y=Math.round(H*0.70);y<H;y++)for(let x=0;x<W;x++)if(lum(x,y)<thr)dark[y*W+x]=1;
  const seen=new Uint8Array(W*H);const q=new Int32Array(W*H);const out=[];
  for(let y=Math.round(H*0.70);y<H;y++)for(let x=0;x<W;x++){
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
    if(bw>=W*0.03&&bw<=W*0.25&&bh>=H*0.008&&bh<=H*0.05&&cnt/(bw*bh)>0.6){
      let bright=0;
      for(let yy=minY;yy<=maxY;yy++)for(let xx=minX;xx<=maxX;xx++)if(lum(xx,yy)>180)bright++;
      out.push({x:minX,y:minY,w:bw,h:bh,fill:+(cnt/(bw*bh)).toFixed(2),bright,brightFrac:+(bright/(bw*bh)).toFixed(3)});
    }
  }
  out.sort((a,b)=>(b.w*b.h)-(a.w*a.h));
  return {W,H,out:out.slice(0,6)};
}
console.log(JSON.stringify(cands('./test-asc.png',100)));
