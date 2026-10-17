(() => {
"use strict";
const KEY="dream-room-studio-v1", $=id=>document.getElementById(id);
const defaults={palette:"lavender",wall:"#e8ddf8",floor:"wood",pattern:"plain",bed:"classic",bedding:"#f6b8d5",rug:"oval",name:"my little sanctuary ♡",toggles:{plant:true,beanbag:true,floorlamp:false,shelf:true,wallart:true,sparkles:true},stickers:[]};
let state=load(),toastTimer;
const copy=o=>JSON.parse(JSON.stringify(o));
function load(){try{let s=localStorage.getItem(KEY);if(!s)return copy(defaults);let p=JSON.parse(s);return {...copy(defaults),...p,toggles:{...defaults.toggles,...(p.toggles||{})},stickers:Array.isArray(p.stickers)?p.stickers:[]};}catch(e){return copy(defaults)}}
function toast(msg){let t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2400)}
function save(msg=false){try{localStorage.setItem(KEY,JSON.stringify(state));$("saveStatus").textContent="● Saved in this browser";if(msg)toast("Your dreamy room is saved ✨")}catch(e){toast("Browser storage unavailable. Export a backup instead.")}}
function active(selector,attr,val){document.querySelectorAll(selector).forEach(el=>el.classList.toggle("active",el.getAttribute(attr)===val))}
function visible(id,on){$(id).style.display=on?"": "none"}
function guess(c){if(["#ffe0ed","#f7e9f4"].includes(c.toLowerCase()))return"pink";if(c.toLowerCase()==="#dff0ff")return"blue";if(c.toLowerCase()==="#dff3e6")return"mint";return"lavender"}
function renderStickers(){const holder=$("stickers");holder.innerHTML="";state.stickers.forEach((s,i)=>{let el=document.createElement("button");el.type="button";el.className="sticker-room";el.textContent=s.emoji;el.title="Tap to remove sticker";el.setAttribute("aria-label","Remove sticker "+s.emoji);el.style.left=s.x+"%";el.style.top=s.y+"%";el.style.background="transparent";el.style.border="0";el.addEventListener("click",()=>{state.stickers.splice(i,1);apply();save();toast("Sticker removed.")});holder.appendChild(el)})}
function apply(){
$("room").style.setProperty("--wall",state.wall);$("room").style.setProperty("--bedding",state.bedding);
$("wallHex").textContent=state.wall.toUpperCase();$("customWall").value=state.wall;$("customBedding").value=state.bedding;
$("floor").className="floor"+(state.floor==="wood"?"":" "+state.floor);$("pattern").className="pattern"+(state.pattern==="plain"?"":" "+state.pattern);
$("bed").classList.remove("royal","minimal");if(state.bed!=="classic")$("bed").classList.add(state.bed);$("rug").className="rug "+state.rug;
$("roomname").textContent=state.name||"my little sanctuary ♡";$("nameInput").value=state.name||"";
for(const k of ["plant","beanbag","floorlamp","shelf","sparkles"])visible(k,state.toggles[k]);
visible("a1",state.toggles.wallart);visible("a2",state.toggles.wallart);
document.querySelectorAll("[data-toggle]").forEach(el=>el.checked=!!state.toggles[el.dataset.toggle]);
active("[data-palette]","data-palette",state.palette);active("#wallSwatches [data-color]","data-color",state.wall);active("#beddingSwatches [data-color]","data-color",state.bedding);
active("[data-floor]","data-floor",state.floor);active("[data-pattern]","data-pattern",state.pattern);active("[data-bed]","data-bed",state.bed);active("[data-rug]","data-rug",state.rug);
$("mood").textContent=({lavender:"Soft & dreamy",pink:"Sweet & rosy",blue:"Calm & cloudlike",mint:"Fresh & magical"})[state.palette]||"Your own vibe";
renderStickers();
}
function palette(name){const p={lavender:["#e8ddf8","#f6b8d5","wood"],pink:["#ffe0ed","#c9b6ef","light"],blue:["#dff0ff","#b6dff3","wood"],mint:["#dff3e6","#c6e4ce","light"]}[name];if(!p)return;[state.wall,state.bedding,state.floor]=p;state.palette=name;apply();save();toast("Palette changed. So pretty! ♡")}
function bind(){
document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll("[data-tab]").forEach(x=>x.classList.toggle("active",x===b));document.querySelectorAll(".panel").forEach(x=>x.classList.toggle("active",x.id===b.dataset.tab))}));
document.querySelectorAll("[data-palette]").forEach(b=>b.addEventListener("click",()=>palette(b.dataset.palette)));
function setWall(c){state.wall=c;state.palette=guess(c);apply();save()}
document.querySelectorAll("#wallSwatches [data-color]").forEach(b=>b.addEventListener("click",()=>setWall(b.dataset.color)));
$("customWall").addEventListener("input",e=>setWall(e.target.value));
document.querySelectorAll("#beddingSwatches [data-color]").forEach(b=>b.addEventListener("click",()=>{state.bedding=b.dataset.color;apply();save()}));
$("customBedding").addEventListener("input",e=>{state.bedding=e.target.value;apply();save()});
for(const [attr,key] of [["data-floor","floor"],["data-pattern","pattern"],["data-bed","bed"],["data-rug","rug"]])document.querySelectorAll("["+attr+"]").forEach(b=>b.addEventListener("click",()=>{state[key]=b.getAttribute(attr);apply();save()}));
document.querySelectorAll("[data-toggle]").forEach(b=>b.addEventListener("change",()=>{state.toggles[b.dataset.toggle]=b.checked;apply();save()}));
$("applyName").addEventListener("click",()=>{state.name=$("nameInput").value.trim().slice(0,34)||defaults.name;apply();save();toast("Your room has a name now ♡")});
$("nameInput").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();$("applyName").click()}});
document.querySelectorAll("[data-sticker]").forEach(b=>b.addEventListener("click",()=>{if(state.stickers.length>=16){toast("Room full of magic! Remove a sticker first.");return}let i=state.stickers.length;state.stickers.push({emoji:b.dataset.sticker,x:16+(i*17)%68,y:18+(i*23)%55});apply();save();toast("A little magic added ✨")}));
$("saveBtn").addEventListener("click",()=>save(true));
$("randomBtn").addEventListener("click",()=>{const pick=a=>a[Math.floor(Math.random()*a.length)];state.palette=pick(["lavender","pink","blue","mint"]);state.wall=pick(["#e8ddf8","#ffe0ed","#dff0ff","#dff3e6","#fff0d9","#f7e9f4"]);state.bedding=pick(["#f6b8d5","#c9b6ef","#b6dff3","#c6e4ce","#fff1d7"]);state.floor=pick(["wood","light","rose"]);state.pattern=pick(["plain","stars","dots","hearts"]);state.bed=pick(["classic","royal","minimal"]);state.rug=pick(["oval","round","rectangle","off"]);for(const k of Object.keys(state.toggles))state.toggles[k]=Math.random()>.3;apply();save();toast("A new dreamy look, just for you! ✧")});
$("clearBtn").addEventListener("click",()=>{state.stickers=[];for(const k of Object.keys(state.toggles))state.toggles[k]=false;apply();save();toast("Decor cleared. A fresh blank space ♡")});
$("resetBtn").addEventListener("click",()=>{if(confirm("Reset your room to the original design? Your current design will be replaced.")){state=copy(defaults);apply();save();toast("Your room is back to its original look.")}});
$("exportBtn").addEventListener("click",()=>{const blob=new Blob([JSON.stringify({app:"Dream Room Studio",version:1,exportedAt:new Date().toISOString(),design:state},null,2)],{type:"application/json"});const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="dream-room-design.json";document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);toast("Design exported as a JSON backup! ↓")});
$("importBtn").addEventListener("click",()=>$("importFile").click());
$("importFile").addEventListener("change",async e=>{const f=e.target.files&&e.target.files[0];if(!f)return;try{const p=JSON.parse(await f.text()),v=p.design||p;if(!v||typeof v.wall!=="string"||typeof v.bedding!=="string"||!/^#[0-9a-f]{6}$/i.test(v.wall)||!/^#[0-9a-f]{6}$/i.test(v.bedding))throw Error();const n={...copy(defaults),...v,toggles:{...defaults.toggles,...(v.toggles||{})},stickers:Array.isArray(v.stickers)?v.stickers.filter(s=>s&&typeof s.emoji==="string"&&Number.isFinite(s.x)&&Number.isFinite(s.y)).slice(0,16):[]};if(!["wood","light","rose"].includes(n.floor)||!["plain","stars","dots","hearts"].includes(n.pattern)||!["classic","royal","minimal"].includes(n.bed)||!["oval","round","rectangle","off"].includes(n.rug))throw Error();n.name=String(n.name||defaults.name).slice(0,34);state=n;apply();save();toast("Your saved room design is back! ✨")}catch(err){toast("That file doesn't look like a Dream Room design.")}e.target.value=""});
}
bind();apply();save();
})();