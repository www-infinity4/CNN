(function(){
  "use strict";

  const CNN_CHANNEL_ID="UCupvZG-5ko_eiXAupbDfxWw";
  const CNN_UPLOADS="UU"+CNN_CHANNEL_ID.slice(2);
  const BOURDAIN_IDS=[
    "R0hH_XR433A", // Tokyo sushi
    "4suFoLPdv-o", // Okinawa
    "ysYGCtGYGdc", // Iran
    "DYOiQPhkUFs", // Cuba
    "RrSULRKOUdU", // Myanmar
    "D3E6U4tjjOw", // Season 7 archive
    "od09-RQo5Kw", // Season 4 archive
    "nEZgFxeffX0"  // Season 2 archive
  ];

  const GUIDE=[
    {id:"overnight",start:0,end:5,title:"CNN Overnight World Desk",detail:"Rolling current CNN reports"},
    {id:"rolling",start:5,end:20,title:"CNN World News — Rolling Top Stories",detail:"Newest official CNN uploads"},
    {id:"bourdain",start:20,end:22,title:"Anthony Bourdain / Parts Unknown Archive",detail:"Official CNN archive videos"},
    {id:"prime",start:22,end:24,title:"CNN Prime — Originals, Interviews & Current Reporting",detail:"Current CNN reporting queue"}
  ];

  const $=id=>document.getElementById(id);
  const els={
    clock:$("stationClock"),mode:$("modeLabel"),refresh:$("refreshStatus"),block:$("blockLabel"),title:$("nowTitle"),
    blockTime:$("blockTime"),enter:$("enterButton"),newest:$("newestButton"),next:$("nextButton"),share:$("shareButton"),
    wallet:$("walletButton"),shareStatus:$("shareStatus"),guide:$("guideRows"),guideDate:$("guideDate")
  };

  let player=null;
  let ready=false;
  let entered=false;
  let loadedBlock="";
  let manualOverride=false;
  let manualOverrideBlock="";
  let lastVideoId="";
  let lastTitle="";

  function localHour(){return new Date().getHours();}
  function currentBlock(){const h=localHour();return GUIDE.find(item=>h>=item.start&&h<item.end)||GUIDE[1];}
  function fmtHour(hour){
    const h=hour%24, suffix=h>=12?"PM":"AM", display=h%12||12;
    return `${display}:00 ${suffix}`;
  }
  function blockRange(item){return `${fmtHour(item.start)}–${fmtHour(item.end)}`;}
  function dateSeed(){
    const d=new Date();
    return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();
  }
  function archiveIndex(){return Math.abs(dateSeed()+Math.floor(Date.now()/3600000))%BOURDAIN_IDS.length;}

  function renderGuide(){
    const now=currentBlock();
    els.guideDate.textContent=new Intl.DateTimeFormat("en-US",{weekday:"long",month:"long",day:"numeric"}).format(new Date());
    els.guide.innerHTML=GUIDE.map(item=>`<article class="guide-row${item.id===now.id?" current":""}" data-guide="${item.id}"><time>${fmtHour(item.start)}</time><strong>${item.title}</strong><span>${item.detail}</span></article>`).join("");
  }

  function updateClock(){
    els.clock.textContent=new Intl.DateTimeFormat("en-US",{hour:"numeric",minute:"2-digit",second:"2-digit"}).format(new Date());
  }

  function blockLabels(block){
    if(manualOverride){
      els.mode.textContent="LATEST CNN · MANUAL REFRESH";
      els.block.textContent="BREAKING / CURRENT";
      els.blockTime.textContent="Newest available";
      return;
    }
    if(block.id==="bourdain"){
      els.mode.textContent="CNN ARCHIVE";
      els.block.textContent="PARTS UNKNOWN";
    }else if(block.id==="prime"){
      els.mode.textContent="CNN PRIME";
      els.block.textContent="ORIGINALS / INTERVIEWS / CURRENT";
    }else{
      els.mode.textContent="LIVE CNN FEED";
      els.block.textContent=block.id==="overnight"?"OVERNIGHT WORLD DESK":"WORLD DESK";
    }
    els.blockTime.textContent=blockRange(block);
  }

  function loadRolling(force){
    if(!ready)return;
    const block=currentBlock();
    manualOverride=!!force;
    manualOverrideBlock=manualOverride?block.id:"";
    loadedBlock=manualOverride?"manual-latest":block.id;
    els.refresh.textContent="Official CNN uploads · newest first";
    blockLabels(block);
    player.loadPlaylist({listType:"playlist",list:CNN_UPLOADS,index:0,startSeconds:0});
  }

  function loadBourdain(){
    if(!ready)return;
    manualOverride=false;
    manualOverrideBlock="";
    loadedBlock="bourdain";
    els.refresh.textContent="Official CNN Parts Unknown archive queue";
    blockLabels(currentBlock());
    player.loadPlaylist(BOURDAIN_IDS,archiveIndex(),0);
  }

  function loadBlock(block){
    if(!ready||!entered)return;
    manualOverride=false;
    manualOverrideBlock="";
    loadedBlock=block.id;
    if(block.id==="bourdain") loadBourdain();
    else loadRolling(false);
  }

  function updateVideoTitle(){
    if(!ready||!player)return;
    let data={};
    try{data=player.getVideoData()||{};}catch(_){return;}
    if(data.video_id&&data.video_id!==lastVideoId){lastVideoId=data.video_id;lastTitle="";}
    const title=(data.title||"").trim();
    if(title&&title!==lastTitle){
      lastTitle=title;
      els.title.textContent=title;
      document.title=`${title} — CNN World News`;
    }
  }

  function tick(){
    updateClock();
    const block=currentBlock();
    if(manualOverride&&manualOverrideBlock!==block.id){
      manualOverride=false;
      manualOverrideBlock="";
      loadedBlock="";
    }
    document.querySelectorAll(".guide-row").forEach(row=>row.classList.toggle("current",row.dataset.guide===block.id));
    if(!manualOverride) blockLabels(block);
    if(entered&&ready&&!manualOverride&&loadedBlock!==block.id) loadBlock(block);
    updateVideoTitle();
  }

  function loadYouTube(){
    if(window.YT&&window.YT.Player)return createPlayer();
    if(document.querySelector('script[src="https://www.youtube.com/iframe_api"]'))return;
    const tag=document.createElement("script");
    tag.src="https://www.youtube.com/iframe_api";
    tag.referrerPolicy="strict-origin-when-cross-origin";
    document.head.appendChild(tag);
  }

  function createPlayer(){
    if(player)return;
    player=new YT.Player("player",{
      width:"100%",height:"100%",
      playerVars:{playsinline:1,controls:1,enablejsapi:1,origin:location.origin,widget_referrer:location.href,rel:0},
      events:{
        onReady:()=>{ready=true;if(entered)loadBlock(currentBlock());tick();},
        onStateChange:event=>{
          if(event.data===YT.PlayerState.PLAYING)updateVideoTitle();
          if(event.data===YT.PlayerState.ENDED){try{player.nextVideo();}catch(_){} }
        },
        onError:()=>{els.refresh.textContent="Source skipped · advancing to the next available CNN video";try{player.nextVideo();}catch(_){} }
      }
    });
  }

  window.onYouTubeIframeAPIReady=createPlayer;

  function enter(){
    entered=true;
    els.enter.hidden=true;
    loadYouTube();
    if(ready)loadBlock(currentBlock());
  }

  function next(){
    if(!entered)return enter();
    if(!ready)return;
    try{player.nextVideo();}catch(_){}
  }

  function profileStore(){
    try{
      const session=JSON.parse(localStorage.getItem("starquest_session")||"null");
      const users=JSON.parse(localStorage.getItem("starquest_users")||"{}");
      if(session&&session.key&&users[session.key]){
        return {profile:users[session.key],save:p=>{users[session.key]=p;localStorage.setItem("starquest_users",JSON.stringify(users));}};
      }
    }catch(_){}
    let profile={};
    try{profile=JSON.parse(localStorage.getItem("starquest_guest_profile_v1")||"{}");}catch(_){}
    return {profile,save:p=>{try{localStorage.setItem("starquest_guest_profile_v1",JSON.stringify(p));}catch(_){}}};
  }

  function walletSnapshot(){
    const store=profileStore(),p=store.profile||{};
    const tokens=Math.max(0,Number(p.tokens)||0),pending=Math.max(0,Number(p.pendingShareCredits)||0);
    return {tokens,pending,total:tokens+pending/10};
  }

  function refreshWallet(){
    const w=walletSnapshot();
    els.wallet.textContent=`Wallet ⭐ ${w.total.toFixed(1)}`;
    els.wallet.title=`${w.tokens} completed StarCoins · ${w.pending}/10 toward the next coin`;
  }

  function creditShare(){
    const store=profileStore(),p=store.profile||{};
    p.shareCount=Math.max(0,Number(p.shareCount)||0)+1;
    p.pendingShareCredits=Math.max(0,Number(p.pendingShareCredits)||0)+1;
    let awarded=false;
    if(p.pendingShareCredits>=10){
      p.pendingShareCredits-=10;
      p.tokens=Math.max(0,Number(p.tokens)||0)+1;
      awarded=true;
    }
    store.save(p);refreshWallet();
    return {awarded,pending:p.pendingShareCredits||0};
  }

  async function share(){
    const title=lastTitle||"CNN World News";
    const payload={title:`${title} · CNN World News`,text:`Watch ${title} on CNN World News.`,url:location.href};
    try{
      if(navigator.share){
        await navigator.share(payload);
        const reward=creditShare();
        els.shareStatus.textContent=reward.awarded?"Shared · 1 StarCoin completed!":`Shared · ${reward.pending}/10 toward next StarCoin`;
      }else{
        await navigator.clipboard.writeText(location.href);
        els.shareStatus.textContent="CNN channel link copied.";
      }
    }catch(error){if(!error||error.name!=="AbortError")els.shareStatus.textContent="Share did not complete.";}
  }

  els.enter.addEventListener("click",enter);
  els.newest.addEventListener("click",()=>{if(!entered)enter();else if(ready)loadRolling(true);});
  els.next.addEventListener("click",next);
  els.share.addEventListener("click",share);
  els.wallet.addEventListener("click",()=>{const w=walletSnapshot();els.shareStatus.textContent=`Wallet: ${w.tokens} completed StarCoins · ${w.pending}/10 toward the next coin.`;});

  renderGuide();
  refreshWallet();
  tick();
  setInterval(tick,1000);
  setInterval(renderGuide,60000);
})();
