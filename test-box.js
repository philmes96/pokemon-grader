// Test set-code box detection on a real card photo via CDP
const http=require('http');
function get(path){return new Promise((res,rej)=>http.get({host:'127.0.0.1',port:9222,path},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(JSON.parse(d)))}).on('error',rej));}
async function getTarget(){
  try{const t=await get('/json/list');return t.find(x=>x.type==='page');}catch(e){throw new Error('Chrome not running on 9222: '+e.message);}
}
let ws,pending=new Map(),idc=0;
function send(method,params,sessionId){
  const id=++idc;
  return new Promise((res,rej)=>{
    pending.set(id,{res,rej});
    ws.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));
  });
}
async function main(){
  const target=await getTarget();
  ws=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r=>ws.onopen=r);
  ws.onmessage=e=>{
    const m=JSON.parse(e.data);
    if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.rej(new Error(JSON.stringify(m.error))):p.res(m.result);}
  };
  await send('Page.enable');
  await send('Page.navigate',{url:'http://localhost:8765/index.html'});
  await new Promise(r=>setTimeout(r,3000));
  const ev=async expr=>{
    const r=await send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true});
    if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||'eval error');
    return r.result.value;
  };
  const img='http://localhost:8765/test-asc.png';
  const out={};
  // build card canvas from image, run detection
  out.res=await ev(`
    (async()=>{
      const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.crossOrigin='anonymous';i.src='${img}'});
      const c=document.createElement('canvas');c.width=img.width;c.height=img.height;
      c.getContext('2d').drawImage(img,0,0);
      const sb=findSetBox(c);
      const res={imgW:img.width,imgH:img.height,box:sb};
      if(sb){
        res.letters=await ocrSetLetters(c,sb);
        res.num=await ocrCardNumber(c,sb);
      }
      return res;
    })()
  `);
  console.log(JSON.stringify(out,null,2));
  process.exit(0);
}
main().catch(e=>{console.error('FAIL',e.message);process.exit(1);});
