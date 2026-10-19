// Debug: dump bottom strip + column dark stats
const http=require('http');
function get(path){return new Promise((res,rej)=>http.get({host:'127.0.0.1',port:9222,path},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(JSON.parse(d)))}).on('error',rej));}
let ws,pending=new Map(),idc=0;
function send(method,params){const id=++idc;return new Promise((res,rej)=>{pending.set(id,{res,rej});ws.send(JSON.stringify({id,method,params}));});}
async function main(){
  const t=(await get('/json/list')).find(x=>x.type==='page');
  ws=new WebSocket(t.webSocketDebuggerUrl);
  await new Promise(r=>ws.onopen=r);
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.rej(new Error(JSON.stringify(m.error))):p.res(m.result);}};
  const ev=async expr=>{const r=await send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||'eval error');return r.result.value;};
  await send('Page.enable');
  await send('Page.navigate',{url:'http://localhost:8765/index.html'});
  await new Promise(r=>setTimeout(r,3000));
  const out=await ev(`
    (async()=>{
      const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.crossOrigin='anonymous';i.src='http://localhost:8765/test-asc.png';});
      const c=document.createElement('canvas');c.width=img.width;c.height=img.height;
      c.getContext('2d').drawImage(img,0,0);
      const sx=0,sy=Math.round(c.height*0.86),sw=Math.round(c.width*0.55),sh=Math.round(c.height*0.14);
      const strip=grayCanvas(c,sx,sy,sw,sh,2);
      const d=strip.getContext('2d',{willReadFrequently:true}).getImageData(0,0,strip.width,strip.height).data;
      const W=strip.width,H=strip.height;
      const dark=new Array(W).fill(0);
      for(let yy=0;yy<H;yy++)for(let xx=0;xx<W;xx++){const i=(yy*W+xx)*4;if(luma(d,i)<90)dark[xx]++;}
      // binarize strip for visual dump
      const bin=document.createElement('canvas');bin.width=W;bin.height=H;
      const bx=bin.getContext('2d');const bd=bx.createImageData(W,H);
      for(let i=0,j=0;i<d.length;i+=4,j+=4){const v=luma(d,i)<90?0:255;bd.data[j]=bd.data[j+1]=bd.data[j+2]=v;bd.data[j+3]=255;}
      bx.putImageData(bd,0,0);
      return {W,H,sy,sw,sh,dark:dark.join(','),binUrl:bin.toDataURL('image/png'),stripUrl:strip.toDataURL('image/png')};
    })()
  `);
  const fs=require('fs');
  fs.writeFileSync('strip_bin.png',Buffer.from(out.binUrl.split(',')[1],'base64'));
  fs.writeFileSync('strip_gray.png',Buffer.from(out.stripUrl.split(',')[1],'base64'));
  const dk=out.dark.split(',').map(Number);
  // print condensed: max, and columns with high dark
  console.log('W',out.W,'H',out.H,'sy',out.sy,'sw',out.sw,'sh',out.sh);
  console.log('maxDark',Math.max(...dk));
  // buckets of 20
  for(let b=0;b<dk.length;b+=20){console.log(b,dk.slice(b,b+20).join(','));}
  process.exit(0);
}
main().catch(e=>{console.error('FAIL',e);process.exit(1);});
