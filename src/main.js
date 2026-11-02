import './style.css';
import * as THREE from 'three';
const $=id=>document.getElementById(id);
const cast=[
{name:'SERA',ar:'سيرا',role:'نصل الصدى',color:0x78ddff,hp:120,speed:5.2,power:18},
{name:'KAEL',ar:'كايل',role:'حارس الشق',color:0xff785f,hp:165,speed:4.1,power:29},
{name:'LYRA',ar:'ليورا',role:'ناسجة الطاقة',color:0xb78cff,hp:105,speed:6.1,power:13}];
let pick=0,active=0,playing=false,paused=false,hp=120,attackT=0,skillT=0,invuln=0,parryT=0,enemyTimer=2,camYaw=0,camPitch=.2,drag=null,move={x:0,y:0},feedT=0;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x9bb8c9);scene.fog=new THREE.FogExp2(0x9bb8c9,.0095);
const camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.1,160);
const renderer=new THREE.WebGLRenderer({canvas:$('world'),antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.35));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.outputColorSpace=THREE.SRGBColorSpace;
const hemi=new THREE.HemisphereLight(0xe5f5ff,0x344b45,2.15);scene.add(hemi);const sun=new THREE.DirectionalLight(0xffe1b2,3.25);sun.position.set(-18,28,12);sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);sun.shadow.camera.left=-38;sun.shadow.camera.right=38;sun.shadow.camera.top=38;sun.shadow.camera.bottom=-38;sun.shadow.bias=-.00025;scene.add(sun);const fill=new THREE.DirectionalLight(0x78bfff,.85);fill.position.set(18,12,-20);scene.add(fill);const rim=new THREE.DirectionalLight(0x7bffe0,.55);rim.position.set(0,9,24);scene.add(rim);
const mat=(c,r=.7,m=.1,e=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m,emissive:e,emissiveIntensity:.8});
const grass=mat(0x527c64),stone=mat(0x8297a9),gold=mat(0xd6b46f,.35,.6),glow=mat(0x65dfff,.25,.4,0x168aff),dark=mat(0x202b40),leaf=mat(0x3f9876);
const groundGeo=new THREE.PlaneGeometry(130,130,64,64);const gp=groundGeo.attributes.position;for(let i=0;i<gp.count;i++){const x=gp.getX(i),y=gp.getY(i);gp.setZ(i,Math.sin(x*.12)*.16+Math.cos(y*.1)*.13);}groundGeo.computeVertexNormals();const ground=new THREE.Mesh(groundGeo,grass);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
const world=new THREE.Group();scene.add(world);
function cube(parent,x,y,z,w,h,d,m){let o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function tree(x,z){let g=new THREE.Group();g.position.set(x,0,z);world.add(g);let trunk=new THREE.Mesh(new THREE.CylinderGeometry(.15,.3,2,7),mat(0x634b3b));trunk.position.y=1;g.add(trunk);for(let i=0;i<3;i++){let c=new THREE.Mesh(new THREE.IcosahedronGeometry(1-i*.12,1),leaf);c.position.set((i-1)*.2,2.3+i*.45,0);c.castShadow=true;g.add(c);}}
function pillar(x,z,h){let g=new THREE.Group();g.position.set(x,0,z);world.add(g);let p=new THREE.Mesh(new THREE.CylinderGeometry(.7,.95,h,8),stone);p.position.y=h/2;p.castShadow=true;g.add(p);cube(g,0,h,0,1.8,.35,1.8,gold);}
for(let i=0;i<20;i++){let a=i/20*Math.PI*2;tree(Math.cos(a)*(20+i%3*2),Math.sin(a)*(20+i%3*2));}
for(let i=0;i<12;i++){let a=i/12*Math.PI*2;pillar(Math.cos(a)*13,Math.sin(a)*13,4+i%4);}
for(let i=0;i<20;i++){let x=(Math.random()-.5)*42,z=(Math.random()-.5)*42;if(Math.hypot(x,z)>8)cube(world,x,.25,z,1+Math.random(),.4,1+Math.random(),stone);}
let tower=new THREE.Group();tower.position.set(0,0,-32);world.add(tower);for(let i=0;i<5;i++){let p=new THREE.Mesh(new THREE.CylinderGeometry(4-i*.5,5-i*.5,5,8),i===4?gold:stone);p.position.y=2.5+i*5;tower.add(p);}let crystal=new THREE.Mesh(new THREE.OctahedronGeometry(2.6),glow);crystal.position.y=28;tower.add(crystal);
for(let i=0;i<4;i++){let island=new THREE.Mesh(new THREE.DodecahedronGeometry(3,0),stone);island.position.set(-24+i*16,13+i%2*3,-24-i*3);island.scale.y=.5;world.add(island);}

const pathMat=mat(0x9a9a88,.95),moss=mat(0x315b4b),flowerMats=[mat(0xe8d6a1),mat(0x9fd7d8),mat(0xd9a5b9)];
// Ancient stone path leading from the spawn point toward the crystal sanctuary.
for(let i=0;i<46;i++){const z=12-i*1.12,x=Math.sin(i*.19)*2.4;const s=new THREE.Mesh(new THREE.CylinderGeometry(.48+Math.random()*.25,.56,.13,7),pathMat);s.position.set(x,.04,z);s.rotation.y=Math.random()*Math.PI;s.receiveShadow=true;s.castShadow=true;world.add(s);}
function lantern(x,z){const g=new THREE.Group();g.position.set(x,0,z);world.add(g);const stem=new THREE.Mesh(new THREE.CylinderGeometry(.09,.15,2.1,7),dark);stem.position.y=1.05;g.add(stem);const orb=new THREE.Mesh(new THREE.IcosahedronGeometry(.28,1),glow);orb.position.y=2.25;g.add(orb);const light=new THREE.PointLight(0x65dfff,1.35,8,2);light.position.y=2.3;g.add(light);const cap=new THREE.Mesh(new THREE.ConeGeometry(.42,.3,6),gold);cap.position.y=2.58;g.add(cap);}
for(let z=9;z>-31;z-=10){lantern(-4.2+Math.sin(z*.1),z);lantern(4.2+Math.sin(z*.1),z);}
function ruinArch(x,z){const g=new THREE.Group();g.position.set(x,0,z);world.add(g);const col=stone;cube(g,-1.8,2,0,.65,4,.75,col);cube(g,1.8,2,0,.65,4,.75,col);const beam=cube(g,0,4.05,0,4.4,.7,.9,gold);beam.rotation.z=.04;for(let s of [-1,1]){const vine=new THREE.Mesh(new THREE.TorusGeometry(.55,.07,5,12),moss);vine.position.set(s*1.8,3.4,.45);g.add(vine);}}
ruinArch(-10,-13);ruinArch(10,-27);
for(let i=0;i<110;i++){const x=(Math.random()-.5)*74,z=(Math.random()-.5)*76;if(Math.hypot(x,z)<8)continue;const tuft=new THREE.Group();tuft.position.set(x,.03,z);world.add(tuft);for(let k=0;k<3;k++){const blade=new THREE.Mesh(new THREE.ConeGeometry(.08,.55+Math.random()*.35,4),moss);blade.position.set((k-1)*.12,.24,0);blade.rotation.z=(k-1)*.28;tuft.add(blade);}if(i%5===0){const f=new THREE.Mesh(new THREE.SphereGeometry(.12,7,6),flowerMats[i%3]);f.position.y=.52;tuft.add(f);}}
for(let i=0;i<9;i++){const x=(Math.random()-.5)*55,z=(Math.random()-.5)*55;if(Math.hypot(x,z)<10)continue;const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.8+Math.random()*1.4,0),i%2?stone:moss);rock.position.set(x,.35,z);rock.scale.y=.55;rock.rotation.set(Math.random(),Math.random(),Math.random());rock.castShadow=true;rock.receiveShadow=true;world.add(rock);}


/* Living sanctuary: fountain, animated water and lightweight ambient motes. */
const poolMat=new THREE.MeshStandardMaterial({color:0x1c7895,roughness:.18,metalness:.35,transparent:true,opacity:.82,emissive:0x063b55,emissiveIntensity:.45});
const pool=new THREE.Mesh(new THREE.CylinderGeometry(4.8,4.8,.32,48),mat(0x526e82,.28,.5));pool.position.set(0,.12,-8);world.add(pool);
const water=new THREE.Mesh(new THREE.CircleGeometry(4.35,48),poolMat);water.rotation.x=-Math.PI/2;water.position.set(0,.31,-8);world.add(water);
const fountainBase=new THREE.Mesh(new THREE.CylinderGeometry(.72,.9,.45,12),gold);fountainBase.position.set(0,.48,-8);world.add(fountainBase);
const fountainCore=new THREE.Mesh(new THREE.CylinderGeometry(.12,.2,2.5,10),glow);fountainCore.position.set(0,1.8,-8);world.add(fountainCore);
const fountainOrb=new THREE.Mesh(new THREE.OctahedronGeometry(.5),glow);fountainOrb.position.set(0,3.2,-8);world.add(fountainOrb);
const fountainLight=new THREE.PointLight(0x55dfff,2.2,14);fountainLight.position.set(0,3,-8);world.add(fountainLight);
const rippleRings=[];for(let i=0;i<3;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(1.1+i*.75,.025,5,48),new THREE.MeshBasicMaterial({color:0x8deaff,transparent:true,opacity:.38}));ring.rotation.x=Math.PI/2;ring.position.set(0,.34+i*.002,-8);world.add(ring);rippleRings.push(ring);}
const moteCount=95,motePositions=new Float32Array(moteCount*3),moteSpeeds=new Float32Array(moteCount);
for(let i=0;i<moteCount;i++){motePositions[i*3]=(Math.random()-.5)*54;motePositions[i*3+1]=.5+Math.random()*8;motePositions[i*3+2]=(Math.random()-.5)*60;moteSpeeds[i]=.12+Math.random()*.32;}
const moteGeo=new THREE.BufferGeometry();moteGeo.setAttribute('position',new THREE.BufferAttribute(motePositions,3));
const motes=new THREE.Points(moteGeo,new THREE.PointsMaterial({color:0xa6eaff,size:.095,transparent:true,opacity:.72,depthWrite:false}));world.add(motes);


/* EXPLORATION EXPANSION — waterfall ravine, crossing bridge, lost temple and hidden grotto. */
ground.geometry.dispose();
const expandedGroundGeo=new THREE.PlaneGeometry(220,220,96,96);
const egp=expandedGroundGeo.attributes.position;
for(let i=0;i<egp.count;i++){const x=egp.getX(i),y=egp.getY(i);egp.setZ(i,Math.sin(x*.12)*.16+Math.cos(y*.1)*.13+Math.sin(x*.035+y*.04)*.22);}
expandedGroundGeo.computeVertexNormals();ground.geometry=expandedGroundGeo;

// Carved ravine and waterfall basin on the eastern edge of the sanctuary.
const ravineRock=mat(0x536a78,.94),waterfallMat=new THREE.MeshStandardMaterial({color:0x68d9f2,transparent:true,opacity:.72,roughness:.16,metalness:.18,emissive:0x0a6d91,emissiveIntensity:.7,side:THREE.DoubleSide});
for(let i=0;i<7;i++){const cliff=new THREE.Mesh(new THREE.DodecahedronGeometry(3.2+i%3*.7,1),ravineRock);cliff.position.set(24+i%2*1.4,2.4+i%3*.8,-61-i*2.1);cliff.scale.set(1.2,1.15,1.5);cliff.castShadow=true;cliff.receiveShadow=true;world.add(cliff);}
const falls=new THREE.Mesh(new THREE.PlaneGeometry(10,12,1,1),waterfallMat);falls.position.set(17,6.3,-66);world.add(falls);
const fallsLip=new THREE.Mesh(new THREE.BoxGeometry(11,.55,2.2),stone);fallsLip.position.set(17,11.8,-65.2);fallsLip.castShadow=true;world.add(fallsLip);
const fallsPool=new THREE.Mesh(new THREE.CircleGeometry(6.2,40),new THREE.MeshStandardMaterial({color:0x176c88,roughness:.2,metalness:.25,transparent:true,opacity:.86,emissive:0x063a55,emissiveIntensity:.45}));fallsPool.rotation.x=-Math.PI/2;fallsPool.position.set(17,.13,-68);world.add(fallsPool);
const fallsMistGeo=new THREE.BufferGeometry(),fallsMistPos=new Float32Array(70*3);
for(let i=0;i<70;i++){fallsMistPos[i*3]=17+(Math.random()-.5)*11;fallsMistPos[i*3+1]=.3+Math.random()*5;fallsMistPos[i*3+2]=-67+(Math.random()-.5)*5;}
fallsMistGeo.setAttribute('position',new THREE.BufferAttribute(fallsMistPos,3));
const fallsMist=new THREE.Points(fallsMistGeo,new THREE.PointsMaterial({color:0xc8f5ff,size:.12,transparent:true,opacity:.55,depthWrite:false}));world.add(fallsMist);

// A stone-and-timber bridge crosses the stream toward the waterfall overlook.
const bridge=new THREE.Group();bridge.position.set(17,0,-52);world.add(bridge);
cube(bridge,0,.12,0,13,.34,3.2,pathMat);
for(let i=0;i<13;i++){const plank=cube(bridge,-5.8+i*.97,.34,0,.84,.16,3.05,i%2?pathMat:stone);plank.rotation.y=(i%3-1)*.012;}
for(const side of [-1,1]){cube(bridge,0,1.15,side*1.48,13,.22,.22,gold);for(let i=0;i<7;i++){cube(bridge,-5.8+i*1.93,.78,side*1.48,.22,1.15,.22,stone);}}
for(const x of [-5.1,5.1]){const arch=new THREE.Mesh(new THREE.TorusGeometry(1.4,.18,7,16,Math.PI),stone);arch.position.set(x,-.15,0);arch.rotation.z=Math.PI;bridge.add(arch);}

// The lost temple: broken columns, broad steps and a luminous central altar.
const temple=new THREE.Group();temple.position.set(-27,0,-61);world.add(temple);
cube(temple,0,.25,0,17,.5,13,stone);cube(temple,0,.65,0,14,.35,10,pathMat);
for(let i=0;i<5;i++){cube(temple,-5+i*2.5,.55+i*.06,5.4,.22,.18,1.4,gold);}
for(let i=0;i<6;i++){const x=-6+i*2.4;const col=new THREE.Mesh(new THREE.CylinderGeometry(.42,.62,5.7,9),stone);col.position.set(x,3.45,-3.7);col.castShadow=true;temple.add(col);const cap=new THREE.Mesh(new THREE.CylinderGeometry(.62,.52,.35,9),gold);cap.position.set(x,6.35,-3.7);temple.add(cap);}
cube(temple,0,6.65,-3.7,15,.55,1.2,stone);
const templeRoof=new THREE.Mesh(new THREE.ConeGeometry(8.8,3.4,3),mat(0x536d82,.8,.25));templeRoof.rotation.y=Math.PI/2;templeRoof.position.set(0,8.3,-3.7);temple.add(templeRoof);
const altar=cube(temple,0,1.15,-1.1,2.2,1.4,2.2,gold);
const templeCrystal=new THREE.Mesh(new THREE.OctahedronGeometry(1.05),glow);templeCrystal.position.set(0,3.1,-1.1);temple.add(templeCrystal);
const templeLight=new THREE.PointLight(0x58dfff,2.5,18);templeLight.position.set(0,3.2,-1.1);temple.add(templeLight);
for(let i=0;i<4;i++){const shard=new THREE.Mesh(new THREE.OctahedronGeometry(.45+i*.08),glow);shard.position.set(-3+i*2,1.1,-.3);shard.rotation.z=.3*i;temple.add(shard);}

// Hidden grotto entrance, tucked behind the eastern rock wall.
const grotto=new THREE.Group();grotto.position.set(34,0,-72);world.add(grotto);
cube(grotto,-2,2,0,.8,4.2,1.1,ravineRock);cube(grotto,2,2,0,.8,4.2,1.1,ravineRock);cube(grotto,0,4.15,0,4.8,.8,1.2,ravineRock);
const caveDark=new THREE.Mesh(new THREE.CircleGeometry(1.75,24),new THREE.MeshBasicMaterial({color:0x071a35}));caveDark.position.set(0,2, -.59);grotto.add(caveDark);
for(let i=0;i<5;i++){const crystalShard=new THREE.Mesh(new THREE.OctahedronGeometry(.55+i%2*.18),glow);crystalShard.position.set(-2.7+i*1.35,.8+(i%3)*.5,-1.6);crystalShard.rotation.z=i*.5;grotto.add(crystalShard);}
const caveLight=new THREE.PointLight(0x4e9fff,2.8,15);caveLight.position.set(0,2.5,-2);grotto.add(caveLight);
const hiddenChest=new THREE.Group();hiddenChest.position.set(0,.3,-5.2);grotto.add(hiddenChest);
cube(hiddenChest,0,.45,0,1.6,.85,1.1,gold);const chestLid=new THREE.Mesh(new THREE.BoxGeometry(1.7,.5,1.15),mat(0x29445e,.3,.6));chestLid.position.y=1.1;hiddenChest.add(chestLid);
const chestGlow=new THREE.PointLight(0x8bdfff,1.5,8);chestGlow.position.set(0,1.3,0);hiddenChest.add(chestGlow);

// New paths and lanterns make the extended landmarks readable from the central hub.
for(let i=0;i<28;i++){const z=-31-i*1.55;const x=9+Math.sin(i*.16)*1.2;const slab=new THREE.Mesh(new THREE.BoxGeometry(1.35,.16,1.5),i%2?pathMat:stone);slab.position.set(x,.09,z);slab.rotation.y=(i%3-1)*.08;world.add(slab);}
for(let z=-39;z>-70;z-=10){lantern(10,z);lantern(24,z);}
const discoveryZones=[
 {id:'falls',x:17,z:-62,r:11,name:'اكتشفت شلالات الوادي الأزرق'},
 {id:'temple',x:-27,z:-61,r:12,name:'اكتشفت معبد النور القديم'},
 {id:'grotto',x:34,z:-72,r:9,name:'اكتشفت المغارة البلورية السرية'}
];
const discoveredZones=new Set();

function hero(i){let d=cast[i],g=new THREE.Group(),body=mat(i===0?0xe3edf6:i===1?0x252c3c:0x3d2b59,.5,.3),skin=mat(0xe8cfc6),hair=mat(i===0?0xdceafa:i===1?0x121b2b:0x6e48ad),accent=mat(d.color,.25,.5,d.color);let torso=new THREE.Mesh(new THREE.CapsuleGeometry(.43,.85,4,8),body);torso.position.y=1.5;g.add(torso);let head=new THREE.Mesh(new THREE.SphereGeometry(.34,14,10),skin);head.position.y=2.4;g.add(head);let h=new THREE.Mesh(new THREE.SphereGeometry(.4,12,8),hair);h.scale.set(1,.7,1);h.position.y=2.65;g.add(h);for(let s of [-1,1]){let arm=new THREE.Mesh(new THREE.CapsuleGeometry(.13,.6,3,6),body);arm.position.set(s*.57,1.55,0);g.add(arm);let leg=new THREE.Mesh(new THREE.CapsuleGeometry(.17,.7,3,6),body);leg.position.set(s*.2,.55,0);g.add(leg);}let cape=new THREE.Mesh(new THREE.ConeGeometry(.55,1.4,5),accent);cape.position.set(0,1.4,.38);cape.rotation.x=-.2;g.add(cape);let weapon=cube(g,.7,1.3,0,i===1?.2:.12,i===1?1.8:1.35,.16,accent);weapon.rotation.z=-.16;g.userData={weapon,legs:[g.children[5],g.children[6]],arms:[g.children[3],g.children[4]]};return g;}
const heroes=cast.map((_,i)=>hero(i));heroes.forEach((h,i)=>{h.visible=i===0;scene.add(h);});
function enemy(x,z,boss=false){let g=new THREE.Group();g.position.set(x,0,z);let m=mat(boss?0x4a1c32:0x332d45,.5,.35,0x450d21);let torso=new THREE.Mesh(new THREE.CapsuleGeometry(boss?.8:.45,boss?1.3:.8,4,8),m);torso.position.y=boss?1.8:1.3;g.add(torso);let head=new THREE.Mesh(new THREE.IcosahedronGeometry(boss?.5:.3,1),mat(0x92334d,.3,.2,0x8d1736));head.position.y=boss?3:2.1;g.add(head);let sword=cube(g,.65,1.3,0,.15,boss?2.3:1.4,.2,gold);scene.add(g);return {g,hp:boss?480:160,max:boss?480:160,boss,alive:true};}
const foes=[enemy(6,-9),enemy(-7,-16),enemy(8,-22),enemy(0,-40,true)];
function picker(){let el=$('picker');el.innerHTML='';cast.forEach((d,i)=>{let b=document.createElement('button');b.className='card '+(i===pick?'selected':'');b.innerHTML='<b style="color:'+new THREE.Color(d.color).getStyle()+'">'+d.ar+'</b><small>'+d.name+'</small><em>'+d.role+'</em>';b.onclick=()=>{pick=i;picker();};el.appendChild(b);});}
picker();
function say(s){$('feed').textContent=s;feedT=1.8;}
let partyKey='';function update(){let d=cast[active];$('hero-name').textContent=d.name;$('hp').style.width=Math.max(0,hp/d.hp*100)+'%';$('hptext').textContent=Math.ceil(hp)+' / '+d.hp+' HP';const key=active+'|'+cast.map(c=>c.ar).join(',');if(key!==partyKey){partyKey=key;$('party').innerHTML=cast.map((c,i)=>'<button data-i="'+i+'" class="'+(active===i?'on':'')+'"><span class="party-gem" style="--hero:'+new THREE.Color(c.color).getStyle()+'"></span>'+c.ar+'</button>').join('');$('party').querySelectorAll('button').forEach(b=>b.onclick=()=>swap(+b.dataset.i));}}
function swap(i){if(i===active)return;heroes[active].visible=false;active=i;heroes[active].visible=true;hp=Math.min(cast[i].hp,hp/cast[pick].hp*cast[i].hp);say(cast[i].name+' دخل المعركة');update();}
function target(){return foes.filter(e=>e.alive).sort((a,b)=>a.g.position.distanceTo(heroes[active].position)-b.g.position.distanceTo(heroes[active].position))[0];}
function hit(n){let e=target();if(!e)return;if(e.g.position.distanceTo(heroes[active].position)>6){say('اقترب أكثر من العدو');return;}e.hp=Math.max(0,e.hp-n);say((e.boss?'الزعيم':'العدو')+' −'+n);if(!e.hp){e.alive=false;e.g.visible=false;say(e.boss?'انتصرت على حارس الصدع!':'تم إسقاط العدو');}}
function start(){active=pick;hp=cast[active].hp;heroes.forEach((h,i)=>h.visible=i===active);playing=true;$('menu').classList.add('hidden');$('hud').classList.remove('hidden');update();say('مرحباً بك في أوراليس');}
$('start').onclick=start;$('settings').onclick=()=>$('settings-panel').classList.remove('hidden');$('close-settings').onclick=()=>$('settings-panel').classList.add('hidden');$('pause').onclick=()=>{paused=true;$('pause-panel').classList.remove('hidden');};$('resume').onclick=()=>{paused=false;$('pause-panel').classList.add('hidden');};$('home').onclick=()=>{paused=false;playing=false;$('pause-panel').classList.add('hidden');$('hud').classList.add('hidden');$('menu').classList.remove('hidden');};$('swap').onclick=()=>swap((active+1)%3);$('attack').onclick=()=>{if(playing&&!paused&&attackT<=0){attackT=.35;hit(cast[active].power);}};$('skill').onclick=()=>{if(playing&&!paused&&skillT<=0){skillT=5;hit(cast[active].power*(active===1?3.5:2.8));say(cast[active].role+' ✦');}};$('dodge').onclick=()=>{invuln=.7;heroes[active].position.x+=Math.sin(camYaw)*-2;heroes[active].position.z+=Math.cos(camYaw)*-2;say('مراوغة!');};$('counter').onclick=()=>{if(parryT>0){parryT=0;hit(cast[active].power*3);say('COUNTER ناجح!');}else say('استعد لتوقيت الصدّ');};
const joy=$('joystick'),stick=$('stick');let joyId=null;function joyMove(e){let r=joy.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,l=Math.max(1,Math.hypot(dx,dy)),k=Math.min(1,44/l);move={x:dx/l*k,y:dy/l*k};stick.style.transform='translate('+move.x*40+'px,'+move.y*40+'px)';}joy.onpointerdown=e=>{joyId=e.pointerId;joy.setPointerCapture(joyId);joyMove(e);};joy.onpointermove=e=>{if(e.pointerId===joyId)joyMove(e);};function joyEnd(e){if(e.pointerId===joyId){joyId=null;move={x:0,y:0};stick.style.transform='translate(0,0)';}}joy.onpointerup=joyEnd;joy.onpointercancel=joyEnd;
$('world').onpointerdown=e=>{if(!playing||paused)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};$('world').setPointerCapture(e.pointerId);};$('world').onpointermove=e=>{if(drag&&drag.id===e.pointerId){camYaw-=(e.clientX-drag.x)*.006;camPitch=THREE.MathUtils.clamp(camPitch+(e.clientY-drag.y)*.003,-.05,.7);drag.x=e.clientX;drag.y=e.clientY;}};['pointerup','pointercancel'].forEach(ev=>$('world').addEventListener(ev,()=>drag=null));
$('quality').onchange=e=>{let v=e.target.value;renderer.setPixelRatio(Math.min(devicePixelRatio,v==='high'?1.7:v==='medium'?1.3:1));renderer.shadowMap.enabled=v!=='low';renderer.setSize(innerWidth,innerHeight);};
window.onkeydown=e=>{if(e.key===' ')$('attack').click();if(e.key==='e')$('skill').click();if(e.key==='r')$('counter').click();if(e.key==='Shift')$('dodge').click();if(e.key==='q')$('swap').click();};
const clock=new THREE.Clock();function frame(t){requestAnimationFrame(frame);let dt=Math.min(.04,clock.getDelta()),time=t*.001;crystal.rotation.y+=dt*.5;crystal.position.y=28+Math.sin(time*1.4)*.45;
  falls.rotation.z=Math.sin(time*1.8)*.012;falls.material.opacity=.66+Math.sin(time*2.4)*.08;
  templeCrystal.rotation.y+=dt*.9;templeCrystal.position.y=3.1+Math.sin(time*1.8)*.16;
  const fm=fallsMistGeo.attributes.position;for(let i=0;i<70;i++){let y=fm.getY(i)+dt*(.25+(i%5)*.07);if(y>6)y=.25;fm.setY(i,y);}fm.needsUpdate=true;
  // Slow daylight-to-dusk cycle, tuned for mobile performance.
  const cycle=(Math.sin(time*.035)+1)*.5;
  sun.intensity=1.45+cycle*1.9;hemi.intensity=1.05+cycle*.95;fill.intensity=.35+cycle*.55;
  const skyDay=new THREE.Color(0x9bb8c9),skyDusk=new THREE.Color(0x283b67),skyNight=new THREE.Color(0x101b38);
  const dusk=1-Math.abs(cycle-.52)*1.9;const sky=skyNight.clone().lerp(skyDay,cycle).lerp(skyDusk,THREE.MathUtils.clamp(dusk,0,.48));
  scene.background.copy(sky);scene.fog.color.copy(sky);sun.color.setHSL(.09+cycle*.04,.48,.58+cycle*.12);
  const phase=$('world-phase');if(phase)phase.textContent=cycle>.68?'SANCTUARY · DAYLIGHT':cycle>.36?'SANCTUARY · GOLDEN HOUR':'SANCTUARY · BLUE HOUR';
  fountainOrb.rotation.y+=dt*.8;fountainOrb.position.y=3.2+Math.sin(time*2.1)*.12;water.material.opacity=.68+Math.sin(time*1.7)*.1;
  rippleRings.forEach((ring,i)=>{const s=1+((time*.22+i*.34)%1)*.55;ring.scale.setScalar(s);ring.material.opacity=.32*(1-((time*.22+i*.34)%1));});
  const mp=moteGeo.attributes.position;for(let i=0;i<moteCount;i++){let y=mp.getY(i)+moteSpeeds[i]*dt;if(y>9)y=.4;mp.setY(i,y);}mp.needsUpdate=true;const h=heroes[active];heroes.forEach((g,i)=>{if(!g.visible)return;let moving=Math.hypot(move.x,move.y)>.08;g.position.y=Math.sin(time*7)*.035*(moving?1:.2);g.rotation.y=camYaw+Math.PI+(moving?Math.atan2(move.x,-move.y):0);g.userData.legs.forEach((l,j)=>l.rotation.x=moving?Math.sin(time*10+j*Math.PI)*.5:0);g.userData.arms.forEach(a=>a.rotation.x=attackT>0?-.8:0);});if(playing&&!paused){attackT=Math.max(0,attackT-dt);skillT=Math.max(0,skillT-dt);invuln=Math.max(0,invuln-dt);parryT=Math.max(0,parryT-dt);enemyTimer-=dt;if(enemyTimer<0){let e=target();if(e&&e.g.position.distanceTo(h.position)<12){parryT=.62;enemyTimer=2.8;say('⚠ هجوم قادم — اضغط صدّ الآن!');}else enemyTimer=1;}foes.forEach(e=>{if(!e.alive)return;let d=h.position.clone().sub(e.g.position);if(d.length()>2.3&&d.length()<18){d.normalize();e.g.position.addScaledVector(d,dt*(e.boss?1.25:.85));}e.g.lookAt(h.position.x,0,h.position.z);if(d.length()<2.8&&invuln<=0)hp=Math.max(0,hp-(e.boss?9:5)*dt);});let f=new THREE.Vector3(Math.sin(camYaw),0,Math.cos(camYaw)),r=new THREE.Vector3(f.z,0,-f.x),v=r.multiplyScalar(move.x).add(f.multiplyScalar(-move.y));if(v.lengthSq()>1)v.normalize();h.position.addScaledVector(v,dt*cast[active].speed);h.position.x=THREE.MathUtils.clamp(h.position.x,-38,38);h.position.z=THREE.MathUtils.clamp(h.position.z,-92,30);h.position.x=THREE.MathUtils.clamp(h.position.x,-82,82);
  for(const zone of discoveryZones){if(!discoveredZones.has(zone.id)&&Math.hypot(h.position.x-zone.x,h.position.z-zone.z)<zone.r){discoveredZones.add(zone.id);say(zone.name+' ✦');}}
  if(hp<=0){hp=cast[active].hp;h.position.set(0,0,4);say('استعدت توازنك');}update();if(feedT>0){feedT-=dt;if(feedT<=0)$('feed').textContent='';}}let p=h.position;let dist=13;camera.position.set(p.x+Math.sin(camYaw)*Math.cos(camPitch)*dist,p.y+6+Math.sin(camPitch)*dist,p.z+Math.cos(camYaw)*Math.cos(camPitch)*dist);camera.lookAt(p.x,1.2,p.z);renderer.render(scene,camera);}
camera.position.set(0,9,15);frame(0);window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,1.35));renderer.setSize(innerWidth,innerHeight);});
