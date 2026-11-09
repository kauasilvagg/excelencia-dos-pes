'use strict';
/* ---------- interface básica ---------- */
const NAV=[['inicio','Hoje'],['agenda','Agenda'],['pacientes','Pacientes'],['caixa','Caixa'],['estoque','Estoque'],['esterilizacao','Esterilização'],['servicos','Serviços'],['config','Configurações']];
const UI={view:'inicio',pacienteId:null,ptab:'ficha',dia:hoje(),mes:hoje().slice(0,7),busca:''};
let pendingConfirm=null;

function renderNav(){
  $('#navlist').innerHTML=NAV.map(([k,t])=>`<li><a href="#${k}" data-act="nav" data-v="${k}" ${UI.view===k?'aria-current="page"':''}>${IC[k]}<span>${t}</span></a></li>`).join('');
}
function renderSync(){
  const el=$('#sync');if(!el)return;
  let pill=$('#syncPill');
  if(!pill){pill=document.createElement('div');pill.id='syncPill';pill.className='sync-pill hidden';pill.setAttribute('role','status');document.body.appendChild(pill)}
  if(Store.mode==='nuvem'){
    const n=Store.pend.length,off=!navigator.onLine;
    el.innerHTML=`<b>${off?'Sem internet':n?'Enviando alterações…':'Salvo no banco'}</b>${esc(Store.user&&Store.user.email||'')}${n?`<br>${n} ${n>1?'alterações':'alteração'} na fila`:''}`;
    pill.textContent=off?(n?`Sem internet. ${n} ${n>1?'alterações serão enviadas':'alteração será enviada'} quando a conexão voltar.`:'Sem internet. Mostrando os dados salvos no aparelho.')
      :(n&&Store.erro?`Não foi possível enviar ${n} ${n>1?'alterações':'alteração'}. Tentando de novo…`:'');
    pill.classList.toggle('hidden',!pill.textContent);
  }else{
    el.innerHTML='<b>Dados salvos neste aparelho</b>Exporte um backup com frequência em Configurações.';
    pill.classList.add('hidden');
  }
}
function setView(v){UI.view=v;UI.pacienteId=null;if(location.hash!=='#'+v){try{history.replaceState(null,'','#'+v)}catch(e){location.hash=v}}render();window.scrollTo(0,0)}
function render(){
  renderNav();
  const views={inicio:vInicio,agenda:vAgenda,pacientes:vPacientes,caixa:vCaixa,estoque:vEstoque,esterilizacao:vEsterilizacao,servicos:vServicos,config:vConfig};
  $('#main').innerHTML=(UI.view==='pacientes'&&UI.pacienteId&&pac(UI.pacienteId))?vPaciente():(views[UI.view]||vInicio)();
  setupSig();
}
function toast(msg){let t=$('#toast');if(!t){t=document.createElement('div');t.id='toast';t.className='toast';t.setAttribute('role','status');document.body.appendChild(t)}t.textContent=msg;t.classList.remove('hidden');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.add('hidden'),3200)}
function openModal(html,{wide}={}){
  $('#modal-root').innerHTML=`<div class="overlay"><div class="modal${wide?' wide':''}" role="dialog" aria-modal="true">${html}</div></div>`;
  const f=$('#modal-root input:not([type=hidden]):not([type=checkbox]),#modal-root select,#modal-root textarea');if(f)setTimeout(()=>f.focus(),30);
}
function closeModal(){$('#modal-root').innerHTML='';pendingConfirm=null}
function confirmar(titulo,texto,ok,fn,danger=true){
  pendingConfirm=fn;
  openModal(`<h2>${titulo}</h2><p class="muted">${texto}</p><div class="form-acts"><button class="btn" data-act="fechar">Voltar</button><button class="btn ${danger?'danger':'primary'}" data-act="confirmOk">${ok}</button></div>`);
}

/* ---------- campos ---------- */
const fld=(label,input,cls='')=>`<label class="fld ${cls}"><span>${label}</span>${input}</label>`;
const inp=(name,val,attrs='')=>`<input name="${name}" value="${esc(val??'')}" ${attrs}>`;
const txa=(name,val,attrs='')=>`<textarea name="${name}" ${attrs}>${esc(val??'')}</textarea>`;
const sel=(name,opts,val,attrs='')=>`<select name="${name}" ${attrs}>${opts.map(o=>{const [v,t]=Array.isArray(o)?o:[o,o];return `<option value="${esc(v)}" ${String(v)===String(val??'')?'selected':''}>${esc(t)}</option>`}).join('')}</select>`;
const chk=(name,checked,label,value)=>`<label class="chk"><input type="checkbox" name="${name}" ${value!==undefined?`value="${esc(value)}" data-multi`:''} ${checked?'checked':''}><span>${label}</span></label>`;
function formObj(f){const o={};for(const el of f.elements){if(!el.name)continue;if(el.type==='checkbox'){if('multi' in el.dataset){o[el.name]=o[el.name]||[];if(el.checked)o[el.name].push(el.value)}else o[el.name]=el.checked}else if(el.type==='radio'){if(el.checked)o[el.name]=el.value}else o[el.name]=el.value.trim()}return o}
const chip=s=>`<span class="chip ${STATUS[s]?.c||'info'}">${STATUS[s]?.t||s}</span>`;
function flags(p){const a=anam(p),d=a.doencas,f=[];
  if(d.includes('Diabetes'))f.push(['Diabetes','bad','Diabetes'+(a.diabetes&&a.diabetes!=='Não'?': '+a.diabetes:'')]);
  if(a.anticoagulante||ANTICOAG.test(semAcento(a.medicamentos)))f.push(['Anticoagulante','bad','Medicamentos: '+(a.medicamentos||'anticoagulante')]);
  if(d.includes('Trombose'))f.push(['Trombose','bad','Histórico de trombose']);
  if(d.includes('Alergias'))f.push(['Alergia','warn','Alergias: '+(a.alergias||'não informadas')]);
  if(d.includes('Problemas circulatórios'))f.push(['Circulação','warn','Problemas circulatórios']);
  if(d.includes('Problemas cardíacos'))f.push(['Cardíaco','warn','Problemas cardíacos']);
  if(d.includes('Imunidade baixa'))f.push(['Imunidade baixa','warn','Imunidade baixa']);
  if(d.includes('Câncer (em tratamento)'))f.push(['Câncer','warn','Câncer em tratamento']);
  if(a.marcapasso)f.push(['Marcapasso','warn','Usa marcapasso']);
  if(a.gestante)f.push(['Gestante','info','Gestante']);
  if(a.dificuldadeCaminhar==='Sim')f.push(['Mobilidade reduzida','info','Tem dificuldade para caminhar']);
  return f}
const flagsHtml=p=>flags(p).map(([t,c,title])=>`<span class="tag ${c}" title="${esc(title)}">${t}</span>`).join('');
function waBtn(tel,msg,label='WhatsApp'){const l=waLink(tel,msg);return l?`<a class="btn sm wa" href="${l}" target="_blank" rel="noopener">${IC.wa}${label}</a>`:`<span class="muted sm">Sem telefone</span>`}
function dataFala(d){const h=hoje();const dt=parseISO(d);const curto=`${z2(dt.getDate())}/${z2(dt.getMonth()+1)}`;if(d===h)return `hoje (${curto})`;if(d===addDays(h,1))return `amanhã, ${DIAS[dt.getDay()]} (${curto})`;return `${DIAS[dt.getDay()]}, ${curto}`}
function msgConfirmacao(a){const p=pac(a.pacienteId)||{};return fill(cfg().msgConfirmacao,{nome:primeiro(p.nome),data:dataFala(a.data),hora:a.hora,servico:servNomes(a).toLowerCase()})}
function msgRecibo(a){const p=pac(a.pacienteId)||{},c=cfg();
  return `Recibo, ${c.nome}\n\nPaciente: ${p.nome||''}\nData: ${fmtCurto(a.data)}\nServiços: ${servNomes(a)}\nValor: ${brl(a.valor)}\nPagamento: ${a.pagamento?.forma||''}${c.profissional?`\n\nProfissional: ${c.profissional}${c.registro?' ('+c.registro+')':''}`:''}\n${c.endereco}${c.referencia?'. '+c.referencia:''}\n\nObrigada pela confiança!`}

/* ---------- pés ---------- */
const FOOT='M60 246C38 246 26 228 28 200C30 175 22 140 18 110C15 88 22 70 40 64C60 56 85 52 100 58C112 60 118 75 114 95C110 120 96 140 94 165C92 190 100 215 92 232C86 242 74 246 60 246Z';
const TOES=[{k:'halux',cx:98,cy:37,rx:13,ry:18,t:'Hálux (dedão)'},{k:'dedo2',cx:75,cy:35,rx:9.5,ry:13,t:'2º dedo'},{k:'dedo3',cx:57,cy:39,rx:8.5,ry:11.5,t:'3º dedo'},{k:'dedo4',cx:41,cy:46,rx:7.5,ry:10,t:'4º dedo'},{k:'dedo5',cx:28,cy:56,rx:6.8,ry:8.5,t:'5º dedo (mínimo)'}];
const ZONAS=[{k:'antepe',cx:66,cy:90,rx:40,ry:20,t:'Antepé (planta, perto dos dedos)'},{k:'mediope',cx:58,cy:152,rx:26,ry:32,t:'Mediopé (arco)'},{k:'calcanhar',cx:62,cy:214,rx:26,ry:22,t:'Calcanhar'}];
function regiaoNome(key){const [l,k]=key.split('-');const r=[...TOES,...ZONAS].find(x=>x.k===k);return `${r?r.t:k}, pé ${l==='E'?'esquerdo':'direito'}`}
function svgPe(p,lado){
  const mapa=p.mapa||{};
  const reg=(k,shape,t)=>{const key=`${lado}-${k}`,m=mapa[key],on=m&&((m.c||[]).length||m.n);const lab=`${t}, pé ${lado==='E'?'esquerdo':'direito'}`;
    return `<g class="rg${on?' on':''}" data-act="regiao" data-k="${key}" role="button" tabindex="0" aria-label="${esc(lab)}${on?', com marcação':''}"><title>${esc(lab)}${on?': '+esc((m.c||[]).join(', ')):''}</title>${shape}</g>`};
  return `<svg class="pe" viewBox="0 0 130 252" role="group" aria-label="Pé ${lado==='E'?'esquerdo':'direito'}"><g ${lado==='D'?'transform="translate(130 0) scale(-1 1)"':''}>
    <path class="sola" d="${FOOT}"/>
    ${ZONAS.map(z=>reg(z.k,`<ellipse class="zona" cx="${z.cx}" cy="${z.cy}" rx="${z.rx}" ry="${z.ry}"/>`,z.t)).join('')}
    ${TOES.map(t=>reg(t.k,`<ellipse class="dedo" cx="${t.cx}" cy="${t.cy}" rx="${t.rx}" ry="${t.ry}"/><ellipse class="unha" cx="${t.cx}" cy="${(t.cy-t.ry*.42).toFixed(1)}" rx="${(t.rx*.58).toFixed(1)}" ry="${(t.ry*.34).toFixed(1)}"/>`,t.t)).join('')}
  </g></svg>`;
}

/* ---------- retornos e alertas ---------- */
function retornos(){
  const d=hoje(),lim=addDays(d,3),out=[];
  for(const p of S.pacientes){
    const evs=S.evolucoes.filter(e=>e.pacienteId===p.id&&num(e.retornoDias)>0).sort((a,b)=>b.data.localeCompare(a.data));
    if(!evs.length)continue;const e=evs[0];const due=addDays(e.data,num(e.retornoDias));
    if(due>lim)continue;
    const voltou=S.agenda.some(a=>a.pacienteId===p.id&&a.data>e.data&&!['cancelado','faltou'].includes(a.status));
    if(!voltou)out.push({p,due});
  }
  return out.sort((a,b)=>a.due.localeCompare(b.due));
}
function aniversariantes(dias=7){const d=hoje(),out=[];for(let i=0;i<=dias;i++){const md=addDays(d,i).slice(5);S.pacientes.filter(p=>p.nascimento&&p.nascimento.slice(5)===md).forEach(p=>out.push({p,i}))}return out}
