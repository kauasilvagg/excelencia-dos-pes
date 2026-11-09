'use strict';
/* ---------- tela: agenda ---------- */
function vAgenda(){
  const c=cfg(),d=UI.dia,h=hoje(),dt=parseISO(d);
  const seg=addDays(d,-((dt.getDay()+6)%7));
  const semana=[...Array(7)].map((_,i)=>{const x=addDays(seg,i),n=S.agenda.filter(a=>a.data===x&&a.status!=='cancelado').length,xd=parseISO(x);
    return `<button class="wd${x===h?' today':''}" data-act="dia" data-d="${x}" aria-pressed="${x===d}"><span>${DIAS_C[xd.getDay()]}</span><b>${xd.getDate()}</b><i>${n?n+(n>1?' horários':' horário'):'livre'}</i></button>`}).join('');
  const ags=agDoDia(d),ativos=ags.filter(a=>a.status!=='cancelado');
  const ini=toMin(c.inicio),fim=toMin(c.fim),step=num(c.intervalo)||30;
  const mostrados=new Set();let corpo='';
  const antes=ags.filter(a=>toMin(a.hora)<ini);antes.forEach(a=>{corpo+=rowAg(a);mostrados.add(a.id)});
  for(let t=ini;t<fim;t+=step){
    const aqui=ags.filter(a=>{const m=toMin(a.hora);return m>=t&&m<t+step});
    aqui.forEach(a=>{corpo+=rowAg(a);mostrados.add(a.id)});
    if(!aqui.some(a=>a.status!=='cancelado')){
      const ocupado=ativos.some(a=>{const s=toMin(a.hora),e=s+(num(a.duracao)||step);return s<t&&e>t});
      if(!ocupado)corpo+=`<button class="slot" data-act="novoAg" data-d="${d}" data-h="${fromMin(t)}"><b>${fromMin(t)}</b><span>Horário livre</span></button>`;
    }
  }
  ags.filter(a=>!mostrados.has(a.id)).forEach(a=>corpo+=rowAg(a));
  const folga=!(c.dias||[]).map(Number).includes(dt.getDay());
  return `<header class="ph"><div><h1>Agenda</h1><p>${fmtLongo(d)}${d===h?' (hoje)':''}</p></div>
    <div class="row"><button class="btn icon" data-act="diaMove" data-n="-1" aria-label="Dia anterior">${IC.left}</button>
    <input type="date" id="diaPick" value="${d}" aria-label="Escolher data" style="width:auto">
    <button class="btn icon" data-act="diaMove" data-n="1" aria-label="Próximo dia">${IC.right}</button>
    ${d!==h?`<button class="btn" data-act="dia" data-d="${h}">Hoje</button>`:''}
    <button class="btn primary" data-act="novoAg" data-d="${d}">${IC.plus}Agendar</button></div></header>
    <div class="week">${semana}</div>
    ${folga?'<div class="notice">Este dia está fora dos dias de atendimento. Você ainda pode marcar horários se precisar.</div>':''}
    <div class="day">${corpo||'<p class="empty">Nenhum horário configurado para este dia.</p>'}</div>`;
}
function rowAg(a){
  const p=pac(a.pacienteId)||{};const s=a.status;let acts='';
  if(s==='agendado')acts=`<button class="btn sm" data-act="confirmarAg" data-id="${a.id}">${IC.check}Confirmar</button>${waBtn(p.telefone,msgConfirmacao(a),'Lembrar')}<button class="btn sm primary" data-act="concluirAg" data-id="${a.id}">Finalizar</button>`;
  else if(s==='confirmado')acts=`<button class="btn sm primary" data-act="concluirAg" data-id="${a.id}">Finalizar</button><button class="btn sm" data-act="faltouAg" data-id="${a.id}">Faltou</button>${waBtn(p.telefone,msgConfirmacao(a),'WhatsApp')}`;
  else if(s==='concluido'){const ev=S.evolucoes.find(e=>e.agendaId===a.id);
    acts=(ev?`<button class="btn sm" data-act="editEvol" data-id="${ev.id}">Ver evolução</button>`:`<button class="btn sm" data-act="evolAg" data-id="${a.id}">Registrar evolução</button>`)
      +(a.pagamento&&!a.pagamento.pago?`<button class="btn sm primary" data-act="receberAg" data-id="${a.id}">Receber</button>`:(a.pagamento?waBtn(p.telefone,msgRecibo(a),'Recibo'):''));}
  acts+=`<button class="btn sm ghost" data-act="editAg" data-id="${a.id}">${s==='faltou'||s==='cancelado'?'Reagendar':'Editar'}</button>`;
  const pag=s==='concluido'&&a.pagamento?` <span class="sm muted">${a.pagamento.pago?'pago com '+esc(a.pagamento.forma).toLowerCase():'pagamento pendente'}</span>`:'';
  return `<article class="ag st-${s}"><div class="ag-h"><strong>${a.hora}</strong><span>${num(a.duracao)} min</span></div>
    <div><div class="ag-top">${p.id?`<button class="link" data-act="abrirPac" data-id="${p.id}">${esc(p.nome)}</button>`:'<span>Paciente removido</span>'}${chip(s)}${flagsHtml(p)}</div>
    <div class="muted">${esc(servNomes(a))}, ${brl(a.valor)}${pag}</div>${a.obs?`<div class="sm" style="margin-top:4px">${esc(a.obs)}</div>`:''}</div>
    <div class="ag-acts">${acts}</div></article>`;
}

function modalAg(id,pre={}){
  const a=id?{...S.agenda.find(x=>x.id===id)}:{id:'',pacienteId:pre.p||'',data:pre.d||(UI.view==='agenda'?UI.dia:hoje()),hora:pre.h||'',duracao:'',servicoIds:[],valor:'',status:'agendado',obs:''};
  const pacs=[...S.pacientes].sort((x,y)=>x.nome.localeCompare(y.nome,'pt-BR'));
  const servs=S.servicos.filter(s=>s.ativo!==false||(a.servicoIds||[]).includes(s.id));
  openModal(`<h2>${id?'Editar agendamento':'Novo agendamento'}</h2><form data-form="ag" data-id="${a.id}" class="grid">
    ${fld('Paciente',`<select name="pacienteId" id="pacSel" required><option value="">Escolha o paciente</option>${pacs.map(p=>`<option value="${p.id}" ${p.id===a.pacienteId?'selected':''}>${esc(p.nome)}</option>`).join('')}<option value="__novo">Cadastrar paciente novo</option></select>`,'full')}
    <div class="full grid hidden" id="novoPacBox" style="padding:12px;border-radius:12px;background:var(--surface-2)">${fld('Nome do paciente',inp('novoNome',''))}${fld('Telefone (WhatsApp)',inp('novoTel','','inputmode="tel" placeholder="(98) 9 0000-0000"'))}<p class="full sm muted">Depois você completa a ficha e a anamnese.</p></div>
    ${fld('Data',inp('data',a.data,'type="date" required'))}${fld('Horário',inp('hora',a.hora,'type="time" step="300" required'))}
    <div class="fld full"><span>Serviços</span><div class="chks">${servs.length?servs.map(s=>chk('servicoIds',(a.servicoIds||[]).includes(s.id),`<span class="serv-opt"><span>${esc(s.nome)}</span><small>${brl(s.preco)}</small></span>`,s.id)).join(''):'<p class="muted sm">Cadastre os serviços em Serviços para escolher aqui.</p>'}</div></div>
    ${fld('Duração (min)',inp('duracao',a.duracao,'type="number" min="5" step="5" inputmode="numeric"'))}${fld('Valor (R$)',inp('valor',a.valor,'inputmode="decimal"'))}
    ${id?fld('Situação',sel('status',Object.entries(STATUS).map(([k,v])=>[k,v.t]),a.status)):''}
    ${fld('Observação',txa('obs',a.obs,'placeholder="Ex.: paciente prefere ser atendida na poltrona baixa"'),'full')}
    <div class="full" id="agWarn"></div>
    <div class="form-acts full">${id?`<button type="button" class="btn danger left" data-act="delAg" data-id="${a.id}">Excluir</button>`:''}<button type="button" class="btn" data-act="fechar">Cancelar</button><button class="btn primary" id="agSave">Salvar agendamento</button></div></form>`,{wide:true});
  if(!id&&!a.pacienteId&&!pacs.length){$('#pacSel').value='__novo';$('#novoPacBox').classList.remove('hidden')}
}
function recalcAg(f){const ids=[...f.querySelectorAll('input[name=servicoIds]:checked')].map(i=>i.value);const ss=ids.map(servOf).filter(Boolean);f.duracao.value=ss.reduce((x,s)=>x+num(s.duracao),0)||'';f.valor.value=ss.reduce((x,s)=>x+num(s.preco),0)||''}

function salvarAg(f){
  const o=formObj(f);const id=f.dataset.id;let pacienteId=o.pacienteId;
  if(pacienteId==='__novo'){if(!o.novoNome){toast('Informe o nome do paciente novo.');f.novoNome.focus();return}
    const p={id:uid(),nome:o.novoNome,telefone:o.novoTel,criadoEm:hoje(),anamnese:{},avaliacao:{},mapa:{}};Store.put('pacientes',p);pacienteId=p.id}
  if(!pacienteId){toast('Escolha o paciente.');return}
  const old=id?S.agenda.find(x=>x.id===id):null;
  const a={...(old||{id:uid(),criadoEm:hoje(),status:'agendado'}),pacienteId,data:o.data,hora:o.hora,duracao:num(o.duracao)||num(cfg().intervalo)||30,servicoIds:o.servicoIds||[],valor:num(o.valor),obs:o.obs};
  if(o.status)a.status=o.status;
  const ini=toMin(a.hora),fim=ini+a.duracao;
  const conflito=S.agenda.filter(x=>x.id!==a.id&&x.data===a.data&&x.status!=='cancelado'&&a.status!=='cancelado').find(x=>{const s=toMin(x.hora),e=s+(num(x.duracao)||30);return s<fim&&e>ini});
  if(conflito&&!f.dataset.force){f.dataset.force='1';const cp=pac(conflito.pacienteId);$('#agWarn').innerHTML=`<div class="warnbox">Esse horário encosta no atendimento de ${esc(cp?.nome||'outro paciente')} às ${conflito.hora}. Salve de novo para marcar mesmo assim.</div>`;$('#agSave').textContent='Salvar mesmo assim';return}
  if(old&&old.status==='concluido'&&a.status!=='concluido'){S.caixa.filter(x=>x.agendaId===a.id).forEach(x=>Store.del('caixa',x.id));delete a.pagamento}
  Store.put('agenda',a);closeModal();
  toast(id?'Agendamento atualizado':`Horário marcado para ${dataFala(a.data)}, às ${a.hora}`);
  if(UI.view==='agenda')UI.dia=a.data;render();
}

function modalConcluir(id){
  const a=S.agenda.find(x=>x.id===id);if(!a)return;const p=pac(a.pacienteId)||{};
  openModal(`<h2>Finalizar atendimento</h2><p class="muted" style="margin:-8px 0 14px">${esc(p.nome||'')}, ${esc(servNomes(a))}</p>
  <form data-form="concluir" data-id="${a.id}" class="grid">
    ${fld('Valor cobrado (R$)',inp('valor',a.valor,'inputmode="decimal" required'))}${fld('Forma de pagamento',sel('forma',FORMAS,a.pagamento?.forma||'Pix'))}
    <div class="full">${chk('evol',!S.evolucoes.some(e=>e.agendaId===a.id),'Registrar a evolução do atendimento agora')}</div>
    <div class="form-acts full"><button type="button" class="btn" data-act="fechar">Cancelar</button><button class="btn primary">Finalizar</button></div></form>`);
}
function salvarConcluir(f){
  const o=formObj(f),a={...S.agenda.find(x=>x.id===f.dataset.id)};const p=pac(a.pacienteId)||{};
  a.status='concluido';a.valor=num(o.valor);const pago=o.forma!=='A receber';
  a.pagamento={forma:o.forma,pago,data:hoje()};
  S.caixa.filter(x=>x.agendaId===a.id).forEach(x=>Store.del('caixa',x.id));
  if(pago&&a.valor>0)Store.put('caixa',{id:uid(),tipo:'entrada',data:hoje(),descricao:`Atendimento: ${p.nome||''}`,valor:a.valor,forma:o.forma,categoria:'Atendimento',agendaId:a.id});
  Store.put('agenda',a);closeModal();toast('Atendimento finalizado');render();
  if(o.evol)modalEvol(null,{agendaId:a.id});
}
function modalReceber(id){
  const a=S.agenda.find(x=>x.id===id);if(!a)return;const p=pac(a.pacienteId)||{};
  openModal(`<h2>Registrar pagamento</h2><p class="muted" style="margin:-8px 0 14px">${esc(p.nome||'')}, atendimento de ${fmtCurto(a.data)}</p><form data-form="receber" data-id="${a.id}" class="grid">
    ${fld('Valor recebido (R$)',inp('valor',a.valor,'inputmode="decimal" required'))}${fld('Forma de pagamento',sel('forma',FORMAS.filter(x=>x!=='A receber'),'Pix'))}
    <div class="form-acts full"><button type="button" class="btn" data-act="fechar">Cancelar</button><button class="btn primary">Registrar pagamento</button></div></form>`);
}
function salvarReceber(f){
  const o=formObj(f),a={...S.agenda.find(x=>x.id===f.dataset.id)};const p=pac(a.pacienteId)||{};
  a.pagamento={forma:o.forma,pago:true,data:hoje()};a.valor=num(o.valor);
  Store.put('caixa',{id:uid(),tipo:'entrada',data:hoje(),descricao:`Atendimento: ${p.nome||''} (${fmtCurto(a.data)})`,valor:a.valor,forma:o.forma,categoria:'Atendimento',agendaId:a.id});
  Store.put('agenda',a);closeModal();toast('Pagamento registrado');render();
}
