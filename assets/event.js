let unity, entering=false, motionEnabled=false, yawZero=null, currentHeading=0;
const el=id=>document.getElementById(id);
if(new URLSearchParams(location.search).has('scanned'))el('arrival').textContent='POSTER RECOGNIZED · WELCOME';
function send(method,value){unity?.SendMessage('Player',method,value)}
async function enableMotion(){
 try{
  if(typeof DeviceOrientationEvent==='undefined')throw Error('Motion sensors are unavailable. Drag to look instead.');
  if(typeof DeviceOrientationEvent.requestPermission==='function'){
   const granted=await DeviceOrientationEvent.requestPermission();
   if(granted!=='granted')throw Error('Motion permission was not granted. Drag to look instead.');
  }
  motionEnabled=true;yawZero=null;el('motion').textContent='Motion enabled';
  el('hint').textContent='Turn your phone to look · Joystick to move';
 }catch(e){el('hint').textContent=e.message;motionEnabled=false;}
}
function multiply(a,b){return [a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]]}
window.addEventListener('deviceorientation',e=>{
 if(!motionEnabled||!unity||e.alpha===null||e.beta===null||e.gamma===null)return;
 const r=Math.PI/180, x=e.beta*r/2,y=e.alpha*r/2,z=-e.gamma*r/2;
 const c1=Math.cos(x),c2=Math.cos(y),c3=Math.cos(z),s1=Math.sin(x),s2=Math.sin(y),s3=Math.sin(z);
 let q=[s1*c2*c3+c1*s2*s3,c1*s2*c3-s1*c2*s3,c1*c2*s3-s1*s2*c3,c1*c2*c3+s1*s2*s3];
 q=multiply(q,[-Math.SQRT1_2,0,0,Math.SQRT1_2]);
 const angle=-(screen.orientation?.angle ?? window.orientation ?? 0)*r/2;
 q=multiply(q,[0,0,Math.sin(angle),Math.cos(angle)]);
 const [qx,qy,qz,qw]=q;
 const fx=-2*(qx*qz+qw*qy),fy=-2*(qy*qz-qw*qx),fz=-(1-2*(qx*qx+qy*qy));
 currentHeading=Math.atan2(fx,-fz)/r;
 if(yawZero===null)yawZero=currentHeading;
 const yaw=((currentHeading-yawZero+540)%360)-180;
 const pitch=-Math.asin(Math.max(-1,Math.min(1,fy)))/r;
 send('SetBrowserHeading',`${yaw},${pitch}`);
});
el('motion').onclick=enableMotion;
el('recenter').onclick=()=>{yawZero=currentHeading;send('SetBrowserHeading','0,0')};
el('audio').onclick=()=>{
 try{if(unity?.Module?.WEBAudio?.audioContext)unity.Module.WEBAudio.audioContext.resume();}catch{}
 // Unity also resumes its WebAudio context from the document input event.
 el('audio').textContent='Audio enabled';el('unity-canvas').focus();
};
el('visit').onclick=async()=>{
 if(entering)return;entering=true;
 // iOS requests sensor permission from this tap, not from asynchronous loading.
 if(typeof DeviceOrientationEvent!=='undefined')enableMotion();
 el('welcome').hidden=true;el('tour').hidden=false;
 try{
  const response=await fetch('tour/build.json');if(!response.ok)throw Error('The event build is not available. Please try again shortly.');
  const config=await response.json();
  await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=config.loaderUrl;s.onload=resolve;s.onerror=()=>reject(Error('Could not download the Unity loader.'));document.head.appendChild(s)});
  unity=await createUnityInstance(el('unity-canvas'),{
   ...config,devicePixelRatio:Math.min(window.devicePixelRatio||1,1.5),
   showBanner:(message,type)=>{if(type==='error')console.error(message)}
  },progress=>{el('progress').value=progress;el('load-status').textContent=`Loading event — ${Math.round(progress*100)}%`});
  window.eventUnity=unity;el('loading').hidden=true;el('unity-canvas').focus();
 }catch(error){el('loading').hidden=true;el('error').hidden=false;el('error-text').textContent=error.message||String(error)}
};
let joyPointer=null;
function joystick(e){const b=el('joystick').getBoundingClientRect();let x=(e.clientX-b.left-b.width/2)/40,y=(e.clientY-b.top-b.height/2)/40;const n=Math.max(1,Math.hypot(x,y));x/=n;y/=n;el('knob').style.transform=`translate(${x*35}px,${y*35}px)`;send('SetBrowserMove',`${x},${-y}`)}
function stopMove(){joyPointer=null;el('knob').style.transform='';send('SetBrowserMove','0,0')}
el('joystick').onpointerdown=e=>{e.preventDefault();joyPointer=e.pointerId;el('joystick').setPointerCapture(e.pointerId);joystick(e)};
el('joystick').onpointermove=e=>{if(e.pointerId===joyPointer)joystick(e)};
el('joystick').onpointerup=stopMove;el('joystick').onpointercancel=stopMove;el('joystick').onlostpointercapture=stopMove;
let drag=null;
el('unity-canvas').onpointerdown=e=>{drag={id:e.pointerId,x:e.clientX,y:e.clientY};el('unity-canvas').setPointerCapture(e.pointerId)};
el('unity-canvas').onpointermove=e=>{if(!drag||drag.id!==e.pointerId)return;if(motionEnabled){motionEnabled=false;el('motion').textContent='Enable motion'}send('BrowserLookDelta',`${(e.clientX-drag.x)*0.18},${(e.clientY-drag.y)*0.18}`);drag.x=e.clientX;drag.y=e.clientY};
el('unity-canvas').onpointerup=()=>{drag=null};el('unity-canvas').onpointercancel=()=>{drag=null};
window.addEventListener('blur',stopMove);document.addEventListener('visibilitychange',()=>{if(document.hidden)stopMove()});
