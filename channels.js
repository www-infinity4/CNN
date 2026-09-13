(function(){
  "use strict";

  const FALLBACK=[
    ["Hermit TV","Hermit-TV"],["Star Launcher","Star-Launcher"],["HBO","HBO"],["Cinemax","Cinemax"],["Showtime","Showtime"],["Starz","Starz"],["Encore","Encore"],
    ["Cartoon Network","Cartoon-Network"],["WGN","WGN"],["NBC","NBC"],["FOX","FOX"],["PBS","PBS"],["TNT","TNT"],["History Channel","History-Channel"],["Discovery","Discovery"],["Disney Vintage","Disney"],
    ["Chiller","Chiller"],["FX","FX"],["TBS","TBS"],["BET","BET"],["Nickelodeon","Nickelodeon"],["MTV","MTV"],["VH1","VH1"],["Ozzy TV","Ozzy-TV"],["FSN","FSN"],["Nintendo TV","Nintendo-TV"],["CNN","CNN"],
    ["Trump TV","Trump-TV"],["ShopLC","ShopLC"],["StarQuest","TV-Database"],["Astraflix","Astraflix"],["Syncord","Syncord"],["Vintech","Vintech"],["Abstractia","Abstractia-"],["Flix Blender","Flix-Blender"],["Animasync","Animasync"]
  ].map(([name,slug])=>({name,slug,url:`https://www-infinity4.github.io/${slug}/`}));

  function esc(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function activeSlug(){return (location.pathname.split("/").filter(Boolean)[0]||"").toLowerCase();}
  function normalize(data){
    if(!Array.isArray(data))return null;
    const out=data.map(item=>{
      if(typeof item==="string")return {name:item,slug:item,url:`https://www-infinity4.github.io/${item}/`};
      if(!item||typeof item!=="object")return null;
      const slug=item.slug||item.repo||item.path;
      const name=item.name||item.label||slug;
      if(!slug||!name)return null;
      return {name:String(name),slug:String(slug),url:item.url||`https://www-infinity4.github.io/${slug}/`};
    }).filter(Boolean);
    return out.length?out:null;
  }
  function render(channels){
    const active=activeSlug();
    const html=channels.map(ch=>`<a${ch.slug.toLowerCase()===active?' aria-current="page"':''} href="${esc(ch.url)}">${esc(ch.name)}</a>`).join("");
    document.querySelectorAll(".channel-menu nav,.channel-directory nav").forEach(nav=>nav.innerHTML=html);
  }
  async function load(){
    render(FALLBACK);
    const candidates=["/Omni-Control/channels.json","/Omni-control/channels.json"];
    for(const url of candidates){
      try{
        const response=await fetch(`${url}?v=${Date.now()}`,{cache:"no-store"});
        if(!response.ok)continue;
        const channels=normalize(await response.json());
        if(channels){render(channels);return;}
      }catch(_){}
    }
  }
  load();
})();
