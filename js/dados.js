'use strict';
/* ---------- dados ---------- */
const COLS=['pacientes','agenda','evolucoes','servicos','caixa','estoque','esterilizacao','config'];
const S={};COLS.forEach(c=>S[c]=[]);
const LS_KEY='excelencia-dos-pes-v1';
const STATUS={agendado:{t:'Agendado',c:'info'},confirmado:{t:'Confirmado',c:'conf'},concluido:{t:'Atendido',c:'ok'},faltou:{t:'Faltou',c:'warn'},cancelado:{t:'Cancelado',c:'bad'}};
const FORMAS=['Pix','Dinheiro','Cartão de débito','Cartão de crédito','A receber'];
const CATS_SAIDA=['Material e insumos','Aluguel','Energia e água','Internet e telefone','Marketing','Impostos e taxas','Manutenção de equipamentos','Outros'];
const CONDICOES=['Unha encravada (onicocriptose)','Micose de unha (onicomicose)','Unha em telha (involuta)','Unha grossa (onicogrifose)','Calo (heloma)','Calosidade (hiperqueratose)','Verruga plantar','Rachadura (fissura)','Frieira (tinea pedis)','Ferida ou bolha','Dor ao toque','Outro'];
const SERV_PADRAO=[
  {nome:'Podoprofilaxia (limpeza completa)',preco:80,duracao:60,retornoDias:30},
  {nome:'Unha encravada (onicocriptose)',preco:100,duracao:45,retornoDias:7},
  {nome:'Órtese para unha (ortonixia)',preco:120,duracao:45,retornoDias:30},
  {nome:'Tratamento de micose de unha (sessão)',preco:90,duracao:40,retornoDias:15},
  {nome:'Laserterapia (sessão)',preco:70,duracao:30,retornoDias:7},
  {nome:'Remoção de calos e calosidades',preco:70,duracao:40,retornoDias:30},
  {nome:'Tratamento de verruga plantar',preco:90,duracao:40,retornoDias:15},
  {nome:'Tratamento de rachaduras (fissuras)',preco:70,duracao:40,retornoDias:15},
  {nome:'Avaliação do pé diabético',preco:80,duracao:50,retornoDias:60},
  {nome:'Avaliação podológica',preco:50,duracao:30,retornoDias:0},
  {nome:'Reflexologia podal',preco:70,duracao:40,retornoDias:0},
  {nome:'Curativo',preco:40,duracao:20,retornoDias:3},
];
const ESTOQUE_PADRAO=[
  ['Lâminas de bisturi nº 15','caixa',2],['Luvas de procedimento','caixa',3],['Máscaras descartáveis','caixa',1],['Gaze estéril','pacote',5],
  ['Algodão','pacote',2],['Álcool 70%','litro',2],['Clorexidina','frasco',1],['Envelopes para autoclave','caixa',1],
  ['Fita indicadora de autoclave','rolo',1],['Indicador biológico','unidade',2],['Fresas e brocas','unidade',4],['Material para órtese de unha','kit',2],
  ['Antifúngico tópico','frasco',2],['Creme hidratante para os pés','pote',2],['Lençol descartável','rolo',2],
];
const CFG_PADRAO={id:'clinica',nome:'Excelência dos Pés',profissional:'Maria Jucélia Alves',saudacao:'Maria Jucélia',registro:'',telefone:'99 3474 610',email:'mariajuceliaalves@gmail.com',
  endereco:'Atrás do Shopping Rio Anil, São Luís – MA',referencia:'Em frente à quadra do Sabará',
  inicio:'08:00',fim:'18:00',intervalo:30,dias:[1,2,3,4,5,6],
  msgConfirmacao:'Olá, {nome}! Aqui é da Excelência dos Pés. Passando para confirmar seu horário de {servico}: {data}, às {hora}. Estamos atrás do Shopping Rio Anil, em frente à quadra do Sabará. Posso confirmar?',
  msgRetorno:'Olá, {nome}! Tudo bem? Já está na hora do seu retorno na Excelência dos Pés. Quer que eu reserve um horário para você esta semana?',
  msgAniversario:'Feliz aniversário, {nome}! A equipe da Excelência dos Pés deseja um novo ano cheio de saúde e passos leves. 🎉'};
const cfg=()=>({...CFG_PADRAO,...(S.config.find(x=>x.id==='clinica')||{})});
const pac=id=>S.pacientes.find(p=>p.id===id);
const servOf=id=>S.servicos.find(s=>s.id===id);
const servNomes=a=>(a.servicoIds||[]).map(id=>servOf(id)?.nome).filter(Boolean).join(', ')||'Atendimento';
const agDoDia=d=>S.agenda.filter(a=>a.data===d).sort((a,b)=>a.hora.localeCompare(b.hora));

/* ---------- anamnese (modelo da ficha da clínica) ---------- */
const DOENCAS=['Diabetes','Hipertensão','Problemas circulatórios','Trombose','Alergias','Imunidade baixa','Câncer (em tratamento)','Problemas cardíacos','Artrite / Artrose','Reumatismo','Doenças da pele','Onicomicose (micose)'];
const QUEIXAS=['Corte das unhas','Calosidades','Calos','Unha encravada','Micose','Rachaduras','Dor','Prevenção'];
const ANTICOAG=/varfarin|marevan|coumadin|xarelto|rivaroxaban|apixaban|eliquis|dabigatran|pradaxa|clopidogrel|plavix|heparin|enoxaparin|clexane|anticoag/;
function anam(p){
  const a={...((p&&p.anamnese)||{})};
  if(!Array.isArray(a.doencas)){const d=[];if(a.diabetes&&a.diabetes!=='Não')d.push('Diabetes');if(a.hipertensao)d.push('Hipertensão');if(a.circulacao)d.push('Problemas circulatórios');if(a.alergias)d.push('Alergias');if(!a.doencasOutras&&typeof a.doencas==='string')a.doencasOutras=a.doencas;a.doencas=d}
  if(!Array.isArray(a.queixas)){a.queixas=[];if(a.queixa&&!a.queixaOutros)a.queixaOutros=a.queixa}
  if(!a.medicamento&&a.medicamentos)a.medicamento='Sim';
  if(!a.atividadeFisica&&a.atividade)a.atividadeFisica='Sim';
  if(a.observacoes==null&&a.obs)a.observacoes=a.obs;
  return a;
}
const queixaTexto=a=>[...(a.queixas||[]),a.queixaOutros].filter(Boolean).join(', ');
const sigOk=s=>typeof s==='string'&&s.startsWith('data:image/png;base64,')&&!/["'<> ]/.test(s);
let sigDirty=false;
function setupSig(){
  const cv=$('#sigCanvas');if(!cv||cv._ok)return;const r=cv.getBoundingClientRect();if(!r.width)return;
  cv._ok=true;sigDirty=false;const dpr=window.devicePixelRatio||1;cv.width=Math.round(r.width*dpr);cv.height=Math.round(r.height*dpr);
  const ctx=cv.getContext('2d');ctx.scale(dpr,dpr);ctx.lineWidth=2.2;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#2a1f2e';ctx.fillStyle='#2a1f2e';
  let drawing=false,last=null;const pos=e=>{const b=cv.getBoundingClientRect();return {x:e.clientX-b.left,y:e.clientY-b.top}};
  cv.addEventListener('pointerdown',e=>{drawing=true;last=pos(e);try{cv.setPointerCapture(e.pointerId)}catch(_){}ctx.beginPath();ctx.arc(last.x,last.y,1.1,0,Math.PI*2);ctx.fill();sigDirty=true;const h=$('#sigHint');if(h)h.classList.add('hidden');e.preventDefault()});
  cv.addEventListener('pointermove',e=>{if(!drawing)return;const p=pos(e);ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(p.x,p.y);ctx.stroke();last=p;e.preventDefault()});
  const fim=()=>{drawing=false};cv.addEventListener('pointerup',fim);cv.addEventListener('pointercancel',fim);
}
function sigPng(cv){const w=600,h=Math.round(cv.height/cv.width*w)||160;const t=document.createElement('canvas');t.width=w;t.height=h;t.getContext('2d').drawImage(cv,0,0,w,h);return t.toDataURL('image/png')}
function fichaAnamnese(p,a,c){
  const sn=(name,val)=>['Sim','Não'].map(o=>`<label class="pill"><input type="radio" name="${name}" value="${o}" ${val===o?'checked':''}>${o}</label>`).join('');
  const temAss=sigOk(a.assinatura);
  return `<form class="ficha" data-form="anamnese">
  <div class="ficha-top"><h2>Ficha de anamnese<span>Podologia</span></h2><p>${[c.profissional||c.nome,c.telefone,c.email].filter(Boolean).map(esc).join('<br>')}</p></div>
  <section class="fx"><div class="fx-t"><i>${IC.user}</i>Dados do paciente</div><div class="grid">
    ${fld('Nome',inp('nome',p.nome,'required'),'full')}
    ${fld('Data de nascimento',inp('nascimento',p.nascimento,'type="date" id="fxNasc"'))}${fld('Idade',`<input id="fxIdade" value="${p.nascimento?idade(p.nascimento)+' anos':''}" readonly tabindex="-1">`)}
    ${fld('Telefone',inp('telefone',p.telefone,'inputmode="tel"'))}${fld('E-mail',inp('email',p.email,'type="email"'))}
    ${fld('Endereço',inp('endereco',p.endereco),'full')}</div></section>
  <div class="fx-grid">
    <section class="fx"><div class="fx-t"><i>${IC.pulso}</i>Histórico de saúde</div>
      <p class="fx-q">Você possui alguma das doenças abaixo?</p>
      <div class="chks">${DOENCAS.map(d=>chk('doencas',a.doencas.includes(d),esc(d),d)).join('')}</div>
      <div class="grid" style="margin-top:10px">${fld('Outras',inp('doencasOutras',a.doencasOutras))}${fld('Alergias, quais?',inp('alergias',a.alergias,'placeholder="Ex.: látex, dipirona"'))}</div>
      <p class="fx-q">Está fazendo uso de algum medicamento?</p>
      <div class="sn">${sn('medicamento',a.medicamento)}${fld('Qual(is)?',inp('medicamentos',a.medicamentos))}</div>
    </section>
    <section class="fx"><div class="fx-t"><i>${IC.pe}</i>Queixas atuais</div>
      <p class="fx-q">O que te trouxe até a podologia?</p>
      <div class="chks one">${QUEIXAS.map(q=>chk('queixas',a.queixas.includes(q),esc(q),q)).join('')}</div>
      <div style="margin-top:10px">${fld('Outros',inp('queixaOutros',a.queixaOutros))}</div>
    </section>
  </div>
  <div class="fx-grid">
    <section class="fx"><div class="fx-t"><i>${IC.pes}</i>Pé e rotina</div>
      <p class="fx-q">Costuma usar calçados fechados por muito tempo?</p><div class="sn">${sn('calcadoFechado',a.calcadoFechado)}</div>
      <p class="fx-q">Pratica alguma atividade física?</p><div class="sn">${sn('atividadeFisica',a.atividadeFisica)}${fld('Qual?',inp('atividade',a.atividade))}</div>
      <p class="fx-q">Tem dificuldade para caminhar?</p><div class="sn">${sn('dificuldadeCaminhar',a.dificuldadeCaminhar)}</div>
      <p class="fx-q">Já realizou tratamento podológico antes?</p><div class="sn">${sn('tratamentoAnterior',a.tratamentoAnterior)}${fld('Quando?',inp('tratamentoQuando',a.tratamentoQuando))}</div>
    </section>
    <section class="fx"><div class="fx-t"><i>${IC.lista}</i>Observações</div>
      <p class="fx-q">Alguma informação importante que você gostaria de compartilhar?</p>${txa('observacoes',a.observacoes,'rows="9" aria-label="Observações"')}
    </section>
  </div>
  <section class="fx"><div class="fx-t"><i>${IC.esterilizacao}</i>Termo de consentimento</div>
    <p>Eu, <b>${esc(p.nome)}</b>, abaixo assinado(a), autorizo o atendimento podológico, concordando com as informações fornecidas nesta ficha.</p>
    <div class="termo"><div class="fld"><span>Assinatura</span>
      ${temAss?`<div id="sigView"><img class="sig-img" src="${a.assinatura}" alt="Assinatura do paciente"><div class="row" style="margin-top:8px"><button type="button" class="btn sm" data-act="reassinar">Assinar novamente</button></div></div>`:''}
      <div id="sigBox" class="${temAss?'hidden':''}"><div class="sig"><canvas id="sigCanvas" aria-label="Área para assinatura"></canvas><span class="sig-hint" id="sigHint">Assine aqui com o dedo ou o mouse</span></div><div class="row" style="margin-top:8px"><button type="button" class="btn sm" data-act="limparAss">Limpar assinatura</button></div></div>
    </div>${fld('Data',inp('termoData',a.termoData||hoje(),'type="date"'))}</div>
  </section>
  <div class="form-acts"><span class="sm muted left">${a.atualizada?'Ficha atualizada em '+fmtCurto(a.atualizada):'Ficha ainda não preenchida'}</span><button class="btn primary">Salvar ficha</button></div>
  </form>`;
}
