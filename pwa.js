(() => {
 const btn=document.getElementById("installAppButton"), dialog=document.getElementById("installHelp"), steps=document.getElementById("installHelpSteps"), msg=document.getElementById("installHelpText"); let promptEvent=null;
 const ios=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
 const standalone=matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
 const close=()=>dialog.hidden=true;
 function help(title,text,html){document.getElementById("installHelpTitle").textContent=title;msg.textContent=text;steps.innerHTML=html;dialog.hidden=false;}
 document.getElementById("closeInstallHelp").addEventListener("click",close);document.getElementById("installHelpDone").addEventListener("click",close);dialog.addEventListener("click",e=>{if(e.target===dialog)close();});
 if("serviceWorker" in navigator&&(location.protocol==="https:"||location.hostname==="localhost")){addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").then(r=>r.update().catch(()=>{})).catch(e=>console.warn("PWA setup:",e)));}
 if(standalone){btn.hidden=true;return;}
 addEventListener("beforeinstallprompt",e=>{e.preventDefault();promptEvent=e;btn.hidden=false;});
 addEventListener("appinstalled",()=>{promptEvent=null;btn.hidden=true;});
 if(ios)btn.hidden=false;else addEventListener("load",()=>{if(!promptEvent)btn.hidden=false;});
 btn.addEventListener("click",async()=>{
  if(promptEvent){promptEvent.prompt();await promptEvent.userChoice;promptEvent=null;btn.hidden=true;return;}
  if(ios){help("Add FareTrack to your Home Screen","On iPhone or iPad, use Safari's Share menu to install this website.","<ol><li>Open this website in <b>Safari</b>.</li><li>Tap the <b>Share</b> button.</li><li>Choose <b>Add to Home Screen</b>.</li><li>Tap <b>Add</b>.</li></ol>");return;}
  help("Install FareTrack","Your browser may not provide an automatic install prompt. Try its install option.","<ol><li>Open FareTrack from its secure HTTPS website.</li><li>Open your browser menu.</li><li>Choose <b>Install app</b> or <b>Add to Home screen</b>, if available.</li></ol><p class='install-note'>Availability depends on the browser and device.</p>");
 });
})();
