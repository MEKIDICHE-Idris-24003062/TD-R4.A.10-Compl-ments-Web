class Tabs{
  constructor(tablistEl){
    this.tablistEl=tablistEl;
    this.tabs=Array.from(tablistEl.querySelectorAll('[role="tab"]'));
    this.panels=this.tabs.map(t=>document.getElementById(t.getAttribute('aria-controls'))).filter(Boolean);
  }
  init(){
    this.tablistEl.addEventListener('click',e=>{
      const tab=e.target.closest('[role="tab"]');
      if(!tab) return;
      this.activate(tab.id);
    });
    this.tablistEl.addEventListener('keydown',e=>{
      const i=this.tabs.findIndex(t=>t.getAttribute('aria-selected')==='true');
      let n=i;
      if(e.key==='ArrowRight') n=(i+1)%this.tabs.length;
      if(e.key==='ArrowLeft') n=(i-1+this.tabs.length)%this.tabs.length;
      if(n!==i){
        e.preventDefault();
        this.activate(this.tabs[n].id);
        this.tabs[n].focus();
      }
    });
    if(this.tabs.length) this.activate(this.tabs[0].id);
  }
  activate(tabId){
    this.tabs.forEach(t=>{
      const sel=t.id===tabId;
      t.setAttribute('aria-selected',sel?'true':'false');
      t.setAttribute('tabindex',sel?'0':'-1');
    });
    this.panels.forEach(p=>{p.hidden=p.getAttribute('aria-labelledby')!==tabId;});
  }
}

class Router{
  constructor(contentEl){this.contentEl=contentEl;}
  init(){
    document.addEventListener('click',e=>{
      const a=e.target.closest('a[data-page]');
      if(!a) return;
      e.preventDefault();
      this.go(a.getAttribute('data-page'));
    });
    window.addEventListener('popstate',event=>{
      if(event.state&&event.state.page){
        this.render(event.state.page,event.state.data||null,false);
      }
    });
    this.render('home',null,false);
  }
  async go(page){
    if(page==='home'){this.render('home',null,true);return;}
    if(page==='account'){
      const r=await fetch('data/mon-compte.json',{headers:{'Accept':'application/json'}});
      const data=await r.json();
      this.render('account',data,true);
    }
  }
  render(page,data,push){
    if(page==='home'){
      this.contentEl.innerHTML='<p class="small">Accueil</p>';
      if(push) history.pushState({page:'home'},'', '#/');
      return;
    }
    if(page==='account'){
      this.contentEl.innerHTML=`<h2>Mon compte</h2><p><strong>Nom :</strong> ${data?.nom??''}</p><p><strong>Email :</strong> ${data?.email??''}</p><h3>Préférences</h3><ul><li>Unité : ${data?.preferences?.uniteTemperature??'°C'}</li><li>Seuil froid : ${data?.preferences?.seuilAlerteFroid??0} °C</li><li>Seuil chaud : ${data?.preferences?.seuilAlerteChaud??30} °C</li></ul>`;
      if(push) history.pushState({page:'account',data},'', '#/mon-compte');
    }
  }
}

class ThermoUI{
  constructor(){
    this.tempZone=document.getElementById('temp-zone');
    this.msgZone=document.getElementById('msg-zone');
    this.histoLive=document.getElementById('historique-liste');
    this.histoJson=document.getElementById('historique-body');
    this.status=document.getElementById('status');
  }
  setStatus(text){if(this.status) this.status.textContent=text;}
  classeCouleur(v){
    if(v<=0) return 'bordure-bleue';
    if(v<=20) return 'bordure-verte';
    if(v<=30) return 'bordure-orange';
    return 'bordure-rouge';
  }
  showValue(v,nom=''){
    const prefix=nom?(nom+' : '):'';
    this.tempZone.textContent=prefix+v.toFixed(1)+'°C';
    this.tempZone.className='';
    const c=this.classeCouleur(v);
    this.tempZone.classList.add(c);

    this.msgZone.textContent='';
    this.msgZone.classList.add('hidden');
    this.msgZone.classList.remove('alert--danger');

    if(v<0){
      this.msgZone.textContent='Brrrrrrr, un peu froid ce matin, mets ta cagoule !';
      this.msgZone.classList.remove('hidden');
      this.msgZone.classList.add('alert--danger');
    }else if(v>30){
      this.msgZone.textContent='Caliente ! Vamos a la playa, ho hoho hoho !!';
      this.msgZone.classList.remove('hidden');
    }

    const li=document.createElement('li');
    li.textContent=prefix+v.toFixed(1)+'°C';
    li.classList.add(c);
    this.histoLive.appendChild(li);
  }
  setHistoryFromJson(rows,unit='°C'){
    if(!this.histoJson) return;
    this.histoJson.innerHTML='';
    rows.forEach(r=>{
      const tr=document.createElement('tr');
      tr.innerHTML=`<td>${new Date(r.date).toLocaleString()}</td><td>${Number(r.temperature).toFixed(1)} ${unit}</td>`;
      this.histoJson.appendChild(tr);
    });
  }
}

class ThermoService{
  async fetchCapteurs(){
    const r=await fetch('https://api.hothothot.dog/api/capteurs',{headers:{'Accept':'application/json'}});
    if(!r.ok) throw new Error('HTTP '+r.status);
    return r.json();
  }
  async fetchHistory(){
    const r=await fetch('data/historique.json',{headers:{'Accept':'application/json'}});
    if(!r.ok) throw new Error('HTTP '+r.status);
    return r.json();
  }
}

class App{
  constructor(){
    this.ui=new ThermoUI();
    this.service=new ThermoService();
  }
  async init(){
    new Tabs(document.getElementById('tabs')).init();
    new Router(document.getElementById('ajax-content')).init();

    try{
      const hist=await this.service.fetchHistory();
      this.ui.setHistoryFromJson(hist.valeurs||[],hist.unite||'°C');
    }catch(e){
      this.ui.setStatus('Historique JSON indisponible');
    }

    await this.refresh();
    setInterval(()=>this.refresh(),2000);
  }
  async refresh(){
    this.ui.setStatus('Mise à jour...');
    try{
      const data=await this.service.fetchCapteurs();
      if(data&&Array.isArray(data.capteurs)&&data.capteurs.length){
        const inside=data.capteurs.find(c=>String(c.Nom).toLowerCase().includes('inter'));
        const chosen=inside||data.capteurs[0];
        const nom=String(chosen.Nom||'Capteur');
        const v=Number(chosen.Valeur);
        if(!Number.isFinite(v)) throw new Error('Valeur invalide');
        this.ui.showValue(v,nom);
        this.ui.setStatus('OK');
        return;
      }
      throw new Error('Format');
    }catch(e){
      this.ui.setStatus('API indisponible');
    }
  }
}

window.addEventListener('DOMContentLoaded',()=>{new App().init();});
