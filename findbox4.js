// v2: strip rows -> bright number box anchor -> dark set box left of it -> crops for OCR
const fs=require('fs'),{PNG}=require('pngjs');
function load(p){return PNG.sync.read(fs.readFileSync(p));}
const lum=(d,i)=>0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];
function sat(d,i){const mx=Math.max(d[i],d[i+1],d[i+2]),mn=Math.min(d[i],d[i+1],d[i+2]);return mx?(mx-mn)/mx:0;}

function detect(img){
  const W=img.width,H=img.height,d=img.data;
  const Y0=Math.round(H*0.80);
  const rows=[];
  for(let y=Y0;y<H;y++){
    let n=0,tot=0;
    for(let x=Math.round(W*0.06);x<Math.round(W*0.96);x+=2){const i=(y*W+x)*4;const l=lum(d,i);tot++;if(l>=95&&l<=170&&sat(d,i)<0.35)n++;}
    rows.push({y,f:n/tot});
  }
  // bottommost run of rows with f>0.45, gap<=2
  let last=-1;
  for(let k=rows.length-1;k>=0;k--){if(rows[k].f>0.45){last=k;break;}}
  if(last<0)return{err:'no strip rows',rows:rows.map(r=>r.y+':'+r.f.toFixed(2))};
  let sy=last,ey=last;
  for(let k=last;k>=0;k--){
    if(rows[k].f>0.45){sy=k;continue;}
    if(last-k<=2&&k>0)continue;
    break;
  }
  // careful: simple loop above buggy; redo properly
  let runEnd=last,runStart=last,gap=0;
  for(let k=last-1;k>=0;k--){
    if(rows[k].f>0.45){if(gap<=2)runStart=k;gap=0;}
    else{gap++;if(gap>2)break;}
  }
  sy=runStart;ey=runEnd;
  const sh=ey-sy+1;
  if(sh<6)return{err:'strip too thin',sy,ey};
  // per-column stats within strip
  const xEnd=Math.round(W*0.55);
  const colD=[],colB=[];
  for(let x=0;x<xEnd;x++){
    let dn=0,bn=0;
    for(let y=sy;y<=ey;y++){const i=(y*W+x)*4;const l=lum(d,i);if(l<100)dn++;if(l>175)bn++;}
    colD.push(dn/sh);colB.push(bn/sh);
  }
  // bright number box: contiguous cols brightFrac>0.5, width 2-18%W, pick widest
  let nb0=-1,nb1=-1,brun=-1,best=0;
  for(let x=0;x<=xEnd;x++){
    const ok=x<xEnd&&colB[x]>0.5;
    if(ok&&brun<0)brun=x;
    if((!ok||x===xEnd)&&brun>=0){
      const w=x-brun;
      if(w>=Math.round(W*0.02)&&w<=Math.round(W*0.18)&&w>best){best=w;nb0=brun;nb1=x-1;}
      brun=-1;
    }
  }
  if(nb0<0)return{err:'no number box',sy,ey,colB:colB.map(v=>v.toFixed(2)).join('')};
  // dark box left of number box (gap<=0.12W)
  const maxGap=Math.round(W*0.12);
  let gap2=0,bb0=-1,bb1=-1,run=-1;
  for(let x=nb0-1;x>=0;x--){
    if(colD[x]>0.6){if(run<0)run=x;bb0=x;gap2=0;}
    else{gap2++;if(gap2>maxGap){break;}}
  }
  if(run<0)return{err:'no dark box',nb0,nb1,sy,ey};
  bb1=run;
  if(bb1-bb0<Math.round(W*0.03))return{err:'dark box too narrow',bb0,bb1};
  // vertical extent of dark box: rows in [sy-4,ey+4] where darkFrac over [bb0,bb1]>0.55
  let ry0=-1,ry1=-1;
  for(let y=Math.max(0,sy-4);y<=Math.min(H-1,ey+6);y++){
    let n=0;for(let x=bb0;x<=bb1;x++){const i=(y*W+x)*4;if(lum(d,i)<100)n++;}
    if(n/(bb1-bb0+1)>0.55){if(ry0<0)ry0=y;ry1=y;}
  }
  if(ry0<0)return{err:'no box rows',bb0,bb1,sy,ey};
  return{box:{x:bb0,y:ry0,w:bb1-bb0+1,h:ry1-ry0+1},num:{x:nb0,y:sy,w:nb1-nb0+1,h:sh},sy,ey,W,H};
}

// crop region from png, scale s, save
function crop(img,x,y,w,h,s,out){
  const cv={w:Math.round(w*s),h:Math.round(h*s),d:new Uint8Array(Math.round(w*s)*Math.round(h*s)*4)};
  for(let yy=0;yy<cv.h;yy++)for(let xx=0;xx<cv.w;xx++){
    const sx0=x+Math.floor(xx/s),sy0=y+Math.floor(yy/s);
    const si=(Math.min(img.height-1,sy0)*img.width+Math.min(img.width-1,sx0))*4,di=(yy*cv.w+xx)*4;
    cv.d[di]=img.data[si];cv.d[di+1]=img.data[si+1];cv.d[di+2]=img.data[si+2];cv.d[di+3]=255;
  }
  const png=new PNG({width:cv.w,height:cv.h});
  png.data=Buffer.from(cv.d);
  fs.writeFileSync(out,PNG.sync.write(png));
  return cv;
}

const img=load(process.argv[2]);
const r=detect(img);
console.log(JSON.stringify(r,null,1));
if(r.box){
  crop(img,r.box.x,r.box.y,r.box.w,r.box.h,8,'crop_box.png');
  // number: from box right edge to +0.30W
  const nx=r.box.x+r.box.w, nw=Math.min(Math.round(img.width*0.28), img.width-nx-2);
  crop(img,nx,r.box.y-2,nw,r.box.h+4,8,'crop_num.png');
}
