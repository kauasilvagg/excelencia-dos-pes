'use strict';
/* =====================================================================
   Banco de dados
   - Com SUPABASE_URL e SUPABASE_ANON_KEY preenchidos em js/config.js,
     os dados ficam no banco da nuvem (Supabase/PostgreSQL) e aparecem
     em qualquer aparelho em que ela entrar com o mesmo e-mail e senha.
   - Uma cópia fica no aparelho para abrir rápido e funcionar sem
     internet. O que for alterado offline vai para uma fila e é enviado
     sozinho quando a internet voltar.
   - Sem config.js preenchido, o sistema funciona só no aparelho.
   ===================================================================== */
const K_PEND='excelencia-dos-pes-pendentes';
const K_DONO='excelencia-dos-pes-dono';
const K_SINC='excelencia-dos-pes-sincronizado';
const LOTE=200;

const Store={
  mode:'local',          // 'local' (só no aparelho) ou 'nuvem'
  sb:null,user:null,pend:[],enviando:false,erro:null,ultimaSinc:null,timers:{},retry:null,

  /* ---------- cópia local ---------- */
  loadLocal(){
    try{const raw=localStorage.getItem(LS_KEY);if(raw){const o=JSON.parse(raw);COLS.forEach(c=>S[c]=Array.isArray(o[c])?o[c]:[])}}catch(e){}
    try{this.pend=JSON.parse(localStorage.getItem(K_PEND)||'[]')}catch(e){this.pend=[]}
  },
  saveLocal(){try{localStorage.setItem(LS_KEY,JSON.stringify(S))}catch(e){}},
  savePend(){try{localStorage.setItem(K_PEND,JSON.stringify(this.pend))}catch(e){}},

  /* ---------- operações usadas pelas telas ---------- */
  put(col,rec,{lazy}={}){
    const arr=S[col],i=arr.findIndex(x=>x.id===rec.id);if(i>=0)arr[i]=rec;else arr.push(rec);
    this.saveLocal();
    if(this.mode!=='nuvem')return;
    if(lazy){clearTimeout(this.timers[col+rec.id]);this.timers[col+rec.id]=setTimeout(()=>this.enfileirar({t:'set',col,id:rec.id,rec}),700)}
    else this.enfileirar({t:'set',col,id:rec.id,rec});
  },
  del(col,id){
    S[col]=S[col].filter(x=>x.id!==id);this.saveLocal();
    if(this.mode==='nuvem')this.enfileirar({t:'del',col,id});
  },
  replaceAll(novo){
    const old={};COLS.forEach(c=>old[c]=S[c]);
    COLS.forEach(c=>S[c]=Array.isArray(novo[c])?novo[c].filter(r=>r&&typeof r==='object'&&r.id):[]);
    this.saveLocal();
    if(this.mode!=='nuvem')return;
    for(const c of COLS){
      const keep=new Set(S[c].map(r=>r.id));
      old[c].forEach(r=>{if(!keep.has(r.id))this.enfileirar({t:'del',col:c,id:r.id},false)});
      S[c].forEach(r=>this.enfileirar({t:'set',col:c,id:r.id,rec:r},false));
    }
    this.enviar();
  },

  /* ---------- fila de envio ---------- */
  enfileirar(op,enviarJa=true){
    if(op.rec)op.rec=JSON.parse(JSON.stringify(op.rec));
    // Só a última alteração de cada registro importa.
    this.pend=this.pend.filter(o=>!(o.col===op.col&&o.id===op.id));
    this.pend.push(op);this.savePend();
    if(enviarJa){renderSync();this.enviar()}
  },
  async enviar(){
    if(this.mode!=='nuvem'||this.enviando||!this.pend.length)return;
    if(!navigator.onLine){renderSync();return}
    this.enviando=true;clearTimeout(this.retry);
    try{
      while(this.pend.length){
        const primeiro=this.pend[0];
        const grupo=this.pend.filter(o=>o.col===primeiro.col&&o.t===primeiro.t).slice(0,LOTE);
        let r;
        if(primeiro.t==='set'){
          const agora=new Date().toISOString();
          r=await this.sb.from(primeiro.col).upsert(grupo.map(o=>({user_id:this.user.id,id:o.id,dados:o.rec,atualizado_em:agora})),{onConflict:'user_id,id'});
        }else{
          r=await this.sb.from(primeiro.col).delete().in('id',grupo.map(o=>o.id));
        }
        if(r.error)throw r.error;
        const enviados=new Set(grupo);
        this.pend=this.pend.filter(o=>!enviados.has(o));this.savePend();
      }
      this.erro=null;this.ultimaSinc=new Date();
    }catch(e){
      this.erro=e;console.warn('Falha ao enviar para o banco',e);
      this.retry=setTimeout(()=>this.enviar(),15000);
    }finally{this.enviando=false;renderSync()}
  },

  /* ---------- leitura do banco ---------- */
  async baixarColecao(c){
    const out=[];
    for(let de=0;;de+=1000){
      const {data,error}=await this.sb.from(c).select('dados').order('id').range(de,de+999);
      if(error)throw error;
      out.push(...data.map(r=>r.dados).filter(d=>d&&d.id));
      if(data.length<1000)break;
    }
    return out;
  },
  async baixar(primeiraVez=false){
    if(this.mode!=='nuvem'||!navigator.onLine)return;
    if(this.pend.length){await this.enviar();if(this.pend.length)return}  // não sobrescreve o que ainda não subiu
    try{
      const remoto={};let total=0;
      for(const c of COLS){remoto[c]=await this.baixarColecao(c);total+=remoto[c].length}
      const localTotal=COLS.reduce((a,c)=>a+S[c].length,0);
      if(primeiraVez&&total===0&&localTotal>0&&!localStorage.getItem(K_SINC)){
        // Primeiro acesso: leva para o banco o que já estava cadastrado neste aparelho.
        COLS.forEach(c=>S[c].forEach(r=>this.enfileirar({t:'set',col:c,id:r.id,rec:r},false)));
        toast('Enviando para o banco os dados que estavam neste aparelho…');
        await this.enviar();
      }else{
        const mudou=COLS.some(c=>JSON.stringify(remoto[c])!==JSON.stringify(S[c]));
        COLS.forEach(c=>S[c]=remoto[c]);this.saveLocal();
        if(mudou)redesenharSeLivre();
      }
      try{localStorage.setItem(K_SINC,'1')}catch(e){}
      this.erro=null;this.ultimaSinc=new Date();
    }catch(e){this.erro=e;console.warn('Falha ao ler o banco',e)}
    renderSync();
  },

  /* ---------- login ---------- */
  configurado(){return !!(window.SUPABASE_URL&&window.SUPABASE_ANON_KEY)},
  async iniciar(){
    this.loadLocal();
    if(!this.configurado()){this.mode='local';renderSync();render();return}
    if(!window.supabase||!window.supabase.createClient){
      // Sem internet na primeira abertura do dia: abre com a cópia local.
      this.mode='local';renderSync();render();
      toast('Sem conexão com o banco. Mostrando os dados salvos neste aparelho.');return;
    }
    this.sb=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
    this.sb.auth.onAuthStateChange((ev,sessao)=>{
      if(ev==='PASSWORD_RECOVERY')setTimeout(()=>modalNovaSenha(true),300);
      if(ev==='SIGNED_OUT'&&this.mode==='nuvem'){this.mode='local';this.user=null;mostrarLogin()}
      if(ev==='TOKEN_REFRESHED'&&sessao)this.user=sessao.user;
    });
    const {data}=await this.sb.auth.getSession();
    if(data&&data.session)await this.entrar(data.session.user);
    else mostrarLogin();
  },
  async entrar(user){
    let dono='';try{dono=localStorage.getItem(K_DONO)||''}catch(e){}
    if(dono&&dono!==user.id){
      // Outra conta neste aparelho: não mistura os dados.
      COLS.forEach(c=>S[c]=[]);this.pend=[];this.saveLocal();this.savePend();
      try{localStorage.removeItem(K_SINC)}catch(e){}
    }
    try{localStorage.setItem(K_DONO,user.id)}catch(e){}
    this.user=user;this.mode='nuvem';
    esconderLogin();renderSync();render();
    await this.baixar(true);
    this.enviar();
  },
  async sair(){
    if(this.pend.length&&!confirm(`Ainda há ${this.pend.length} alteração(ões) sem enviar ao banco. Se sair agora, elas serão perdidas. Sair mesmo assim?`))return;
    await this.sb.auth.signOut();
    // Por segurança, apaga a cópia local ao sair.
    COLS.forEach(c=>S[c]=[]);this.pend=[];this.saveLocal();this.savePend();
    try{localStorage.removeItem(K_SINC);localStorage.removeItem(K_DONO)}catch(e){}
    this.mode='local';this.user=null;mostrarLogin();
  }
};

/* Só redesenha se ela não estiver digitando em um formulário da tela. */
let redesenhoPendente=false;
function redesenharSeLivre(){
  const a=document.activeElement;
  const digitando=a&&a.closest&&a.closest('#main form')&&['INPUT','TEXTAREA','SELECT'].includes(a.tagName);
  if(digitando||$('#modal-root').innerHTML){redesenhoPendente=true;return}
  redesenhoPendente=false;render();
}
document.addEventListener('focusout',()=>{if(redesenhoPendente)setTimeout(redesenharSeLivre,400)});

/* Volta a internet: envia a fila. Volta para o app: busca o que mudou em outro aparelho. */
window.addEventListener('online',()=>{renderSync();Store.enviar().then(()=>Store.baixar())});
window.addEventListener('offline',()=>renderSync());
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')Store.baixar()});
setInterval(()=>{if(document.visibilityState==='visible')Store.baixar()},120000);

/* ---------- tela de login ---------- */
function mostrarLogin(){
  let el=$('#login');
  if(!el){el=document.createElement('div');el.id='login';el.className='login';document.body.appendChild(el)}
  const c=cfg();
  el.innerHTML=`<form class="login-card" data-form="login" novalidate>
    <div class="brand" style="padding:0;margin-bottom:18px">${$('.nav .brand svg').outerHTML}<div><b>${esc(c.nome)}</b><small>Podologia</small></div></div>
    <h1>Entrar</h1><p class="muted" style="margin:4px 0 16px">Use o e-mail e a senha da clínica.</p>
    ${fld('E-mail',inp('email','','type="email" autocomplete="username" required'))}
    <div style="height:10px"></div>
    ${fld('Senha',inp('senha','','type="password" autocomplete="current-password" required'))}
    <p class="login-erro" id="loginErro" role="alert"></p>
    <button class="btn primary" style="width:100%;margin-top:6px" id="loginBtn">Entrar</button>
    <button type="button" class="link sm" style="margin-top:14px" data-act="esqueciSenha">Esqueci minha senha</button>
  </form>`;
  el.classList.remove('hidden');document.body.classList.add('com-login');
  setTimeout(()=>{const i=el.querySelector('input');if(i)i.focus()},50);
}
function esconderLogin(){const el=$('#login');if(el)el.classList.add('hidden');document.body.classList.remove('com-login')}
async function fazerLogin(f){
  const email=f.email.value.trim(),senha=f.senha.value;const erro=$('#loginErro'),btn=$('#loginBtn');
  if(!email||!senha){erro.textContent='Preencha o e-mail e a senha.';return}
  btn.disabled=true;btn.textContent='Entrando…';erro.textContent='';
  try{
    const {data,error}=await Store.sb.auth.signInWithPassword({email,password:senha});
    if(error)throw error;
    await Store.entrar(data.user);
  }catch(e){
    erro.textContent=!navigator.onLine?'Sem internet. Conecte-se para entrar.':(e&&/invalid/i.test(e.message||'')?'E-mail ou senha incorretos.':'Não foi possível entrar. Tente de novo.');
  }finally{btn.disabled=false;btn.textContent='Entrar'}
}
async function esqueciSenha(){
  const f=$('#login form');const email=f?f.email.value.trim():'';
  if(!email){$('#loginErro').textContent='Digite seu e-mail acima e toque de novo em Esqueci minha senha.';return}
  const {error}=await Store.sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});
  $('#loginErro').textContent=error?'Não foi possível enviar o e-mail. Tente de novo.':'Enviamos um link para redefinir a senha. Confira seu e-mail.';
}
function modalNovaSenha(recuperacao=false){
  openModal(`<h2>${recuperacao?'Criar nova senha':'Trocar senha'}</h2><form data-form="novaSenha" class="grid">
    ${fld('Nova senha',inp('senha','','type="password" autocomplete="new-password" minlength="8" required'),'full')}
    ${fld('Repita a nova senha',inp('senha2','','type="password" autocomplete="new-password" minlength="8" required'),'full')}
    <p class="full sm muted">Use pelo menos 8 caracteres.</p>
    <div class="form-acts full"><button type="button" class="btn" data-act="fechar">Cancelar</button><button class="btn primary">Salvar senha</button></div></form>`);
}
async function salvarNovaSenha(f){
  if(f.senha.value.length<8){toast('A senha precisa ter pelo menos 8 caracteres.');return}
  if(f.senha.value!==f.senha2.value){toast('As senhas não são iguais.');return}
  const {data,error}=await Store.sb.auth.updateUser({password:f.senha.value});
  if(error){toast('Não foi possível trocar a senha. Tente de novo.');return}
  closeModal();toast('Senha alterada');
  if(Store.mode!=='nuvem'&&data&&data.user)Store.entrar(data.user);
}
