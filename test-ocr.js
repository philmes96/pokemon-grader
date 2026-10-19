// Node end-to-end test: detect box, crop, OCR with tesseract.js
const fs=require('fs'),{PNG}=require('pngjs');
const lum=(d,i)=>0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];
function load(p){return PNG.sync.read(fs.readFileSync(p));}
function cropPNG(img,x,y,w,h){
  const out=new PNG({width:w,height:h});
  PNG.bitblt(img,out,x,y,w,h,0,0);
  return out;
}
function detect(img){
  const W=img.width,H=img.height,d=img.data;
  const y0=Math.round(H*0.82);
  const rowFrac=[];
  for(let y=y0;y<=H-1;y++){
    let n=0,tot=0;
    for(let x=Math.round(W*0.08);x<Math.round(W*0.95);x+=2){const i=(y*W+x)*4;const l=lum(d,i);tot++;if(l>=95&&l<=165)n++;}
    rowFrac.push(n/tot);
  }
  let ys=-1,ye=-1,gap=0;
  for(let k=rowFrac.length-1;k>=0;k--){
    if(rowFrac[k]>0.45){if(ye<0)ye=k;ys=k;gap=0;}
    else if(ye>=0){gap++;if(gap>4)break;}
  }
  if(ye<0||ys-ye<3)return{err:'no strip'};
  const sy=y0+ys,ey=y0+ye,sh=ey-sy+1;
  const xEnd=Math.round(W*0.5);
  const colF=[];
  for(let x=0;x<xEnd;x++){let n=0;for(let y=sy;y<=ey;y++){const i=(y*W+x)*4;if(lum(d,i)<115)n++;}colF.push(n/sh);}
  const minW=Math.round(W*0.02),maxW=Math.round(W*0.28);
  let bx=-1,be=-1,run=-1;
  for(let x=0;x<=xEnd;x++){
    const ok=x<xEnd&&colF[x]>0.72;
    if(ok&&run<0)run=x;
    if((!ok||x===xEnd)&&run>=0){
      const w=x-run;
      if(w>=minW&&w<=maxW){bx=run;be=x-1;break;}
      run=-1;
    }
  }
  if(bx<0)return{err:'no box run',sy,ey};
  let ry0=1e9,ry1=-1;
  for(let y=sy;y<=ey;y++){
    let n=0;for(let x=bx;x<=be;x++){const i=(y*W+x)*4;if(lum(d,i)<115)n++;}
    if(n/(be-bx+1)>0.55){if(y<ry0)ry0=y;if(y>ry1)ry1=y;}
  }
  if(ry1<ry0)return{err:'no rows',bx,be,sy,ey};
  return{box:{x:bx,y:ry0,w:be-bx+1,h:ry1-ry0+1},sy,ey,W,H};
}
(async()=>{
  const img=load('test-asc.png');
  const r=detect(img);
  console.log('detect:',JSON.stringify(r));
  if(r.err)process.exit(1);
  const{box:b,W,H}=r;
  // tight crop: drop 2px border
  const bx=b.x+2,by=b.y+2,bw=b.w-4,bh=b.h-4;
  const c=cropPNG(img,bx,by,bw,bh);
  fs.writeFileSync('crop_asc.png',PNG.sync.write(c));
  // number crop
  const nx=Math.min(W-2,b.x+b.w+1),nw=Math.min(Math.round(W*0.30),W-nx-1);
  const n=cropPNG(img,nx,Math.max(0,b.y-2),nw,b.h+4);
  fs.writeFileSync('crop_num.png',PNG.sync.write(n));
  console.log('box',JSON.stringify(b),'numcrop',nx,b.y,nw,b.h+4);
  const Tesseract=require('tesseract.js');
  const worker=await Tesseract.createWorker('eng');
  const t1=await worker.recognize('crop_asc.png');
  console.log('ASC raw:',JSON.stringify(t1.data.text));
  const t2=await worker.recognize('crop_num.png');
  console.log('NUM raw:',JSON.stringify(t2.data.text));
  await worker.terminate();
})().catch(e=>{console.error(e.message);process.exit(1);});
