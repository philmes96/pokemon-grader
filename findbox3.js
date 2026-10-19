// New set-box detector: locate bottom border strip, then dark box within it.
const fs=require('fs'),{PNG}=require('pngjs');
function load(p){return PNG.sync.read(fs.readFileSync(p));}
const lum=(d,i)=>0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];

function detect(img){
  const W=img.width,H=img.height,d=img.data;
  const y0=Math.round(H*0.82), yEnd=H-1;
  // 1) rows of the bottom border strip: high fraction of mid-gray (95..165) in center band
  const rowFrac=[];
  for(let y=y0;y<=yEnd;y++){
    let n=0,tot=0;
    for(let x=Math.round(W*0.08);x<Math.round(W*0.95);x+=2){const i=(y*W+x)*4;const l=lum(d,i);tot++;if(l>=95&&l<=165)n++;}
    rowFrac.push(n/tot);
  }
  // bottommost contiguous run with frac>0.45, allowing small gaps
  let ys=-1,ye=-1,gap=0;
  for(let k=rowFrac.length-1;k>=0;k--){
    if(rowFrac[k]>0.45){if(ye<0)ye=k;ys=k;gap=0;}
    else if(ye>=0){gap++;if(gap>4)break;}
  }
  if(ye<0||ys-ye<3)return{err:'no strip',rowFrac};
  const sy=y0+ys, ey=y0+ye, sh=ey-sy+1;
  // 2) column dark-fraction inside strip
  const xEnd=Math.round(W*0.5);
  const colF=[];
  for(let x=0;x<xEnd;x++){
    let n=0;
    for(let y=sy;y<=ey;y++){const i=(y*W+x)*4;if(lum(d,i)<115)n++;}
    colF.push(n/sh);
  }
  // leftmost run with colF>0.72, width 2..28% of W
  let bx=-1,be=-1,run=-1;
  const minW=Math.round(W*0.02),maxW=Math.round(W*0.28);
  for(let x=0;x<=xEnd;x++){
    const ok=x<xEnd&&colF[x]>0.72;
    if(ok&&run<0)run=x;
    if((!ok||x===xEnd)&&run>=0){
      const w=x-run;
      if(w>=minW&&w<=maxW){bx=run;be=x-1;break;}
      run=-1;
    }
  }
  if(bx<0)return{err:'no box run',sy,ey,colF};
  // 3) vertical extent: rows where run is >55% dark
  let ry0=sy,ry1=sy;
  for(let y=sy;y<=ey;y++){
    let n=0;for(let x=bx;x<=be;x++){const i=(y*W+x)*4;if(lum(d,i)<115)n++;}
    if(n/(be-bx+1)>0.55){if(ry0===sy&&n/(be-bx+1)>0.55&&ry1===sy&&y!==sy)ry0=y;ry1=y;if(y<ry0)ry0=y;}
  }
  // recompute properly
  ry0=1e9;ry1=-1;
  for(let y=sy;y<=ey;y++){
    let n=0;for(let x=bx;x<=be;x++){const i=(y*W+x)*4;if(lum(d,i)<115)n++;}
    if(n/(be-bx+1)>0.55){if(y<ry0)ry0=y;if(y>ry1)ry1=y;}
  }
  if(ry1<ry0)return{err:'no rows',bx,be,sy,ey};
  return{box:{x:bx,y:ry0,w:be-bx+1,h:ry1-ry0+1},sy,ey,W,H};
}

const img=load(process.argv[2]);
console.log(JSON.stringify(detect(img)));
