'use strict';
/* ---------- evolução ---------- */
function modalEvol(id,pre={}){
  let e;
  if(id)e={...S.evolucoes.find(x=>x.id===id)};
  else{const a=pre.agendaId?S.agenda.find(x=>x.id===pre.agendaId):null;const ss=(a?.servicoIds||[]).map(servOf).filter(Boolean);
    e={id:'',pacienteId:a?a.pacienteId:pre.pacienteId,agendaId:a?.id||'',data:a?.data||hoje(),procedimentos:ss.map(s=>s.nome),dor:'',descricao:'',conduta:'',orientacoes:'',retornoDias:ss.length?Math.max(...ss.map(s=>num(s.retornoDias))):''};
    if(e.retornoDias===0)e.retornoDias='';}
  const p=pac(e.pacienteId);if(!p)return;
  const nomes=[...new Set([...S.servicos.map(s=>s.nome),...(e.procedimentos||[])])];
  openModal(`<h2>${id?'Evolução do atendimento':'Registrar evolução'}</h2><p class="muted" style="margin:-8px 0 14px">${esc(p.nome)}</p>
  <form data-form="evol" data-id="${e.id}" data-p="${p.id}" data-a="${e.agendaId||''}" class="grid">
    ${fld('Data',inp('data',e.data,'type="date" required'))}${fld('Dor relatada (0 a 10)',sel('dor',[['','Não avaliada'],...[...Array(11)].map((_,i)=>[String(i),String(i)])],e.dor))}
    <div class="fld full"><span>Procedimentos realizados</span><div class="chks">${nomes.map(n=>chk('procedimentos',(e.procedimentos||[]).includes(n),esc(n),n)).join('')}</div></div>
    ${fld('O que foi feito e o que você observou',txa('descricao',e.descricao,'rows="4" placeholder="Ex.: espiculectomia na borda lateral do hálux direito, sem sinais de infecção"'),'full')}
    ${fld('Materiais e produtos usados',txa('conduta',e.conduta,'rows="2"'),'full')}
    ${fld('Orientações para o paciente',txa('orientacoes',e.orientacoes,'rows="3" placeholder="Ex.: manter o curativo seco por 24 horas, usar calçado aberto"'),'full')}
    ${fld('Retorno em (dias)',inp('retornoDias',e.retornoDias,'type="number" min="0" inputmode="numeric"'))}
    <div class="fld" style="justify-content:flex-end">${!id?chk('agendarRetorno',false,'Já marcar o retorno na agenda'):''}</div>
    <div class="form-acts full">${id?`<button type="button" class="btn danger left" data-act="delEvol" data-id="${e.id}">Excluir</button>`:''}<button type="button" class="btn" data-act="fechar">Cancelar</button><button class="btn primary">Salvar evolução</button></div></form>`,{wide:true});
}
function salvarEvol(f){
  const o=formObj(f),id=f.dataset.id,p=pac(f.dataset.p);
  const old=id?S.evolucoes.find(x=>x.id===id):null;
  const e={...(old||{id:uid(),mapa:JSON.parse(JSON.stringify(p.mapa||{}))}),pacienteId:p.id,agendaId:f.dataset.a||'',data:o.data,procedimentos:o.procedimentos||[],dor:o.dor,descricao:o.descricao,conduta:o.conduta,orientacoes:o.orientacoes,retornoDias:num(o.retornoDias)};
  Store.put('evolucoes',e);closeModal();toast('Evolução salva');render();
  if(o.agendarRetorno&&e.retornoDias>0){const a=e.agendaId&&S.agenda.find(x=>x.id===e.agendaId);modalAg(null,{p:p.id,d:addDays(e.data,e.retornoDias),h:a?.hora||''})}
}

/* ---------- tela: pacientes ---------- */
function ultimoAt(pid){return S.agenda.filter(a=>a.pacienteId===pid&&a.status==='concluido').sort((a,b)=>b.data.localeCompare(a.data))[0]}
function vPacientes(){
  return `<header class="ph"><div><h1>Pacientes</h1><p>${S.pacientes.length} ${S.pacientes.length===1?'paciente cadastrado':'pacientes cadastrados'}</p></div>
    <div class="row"><label class="search">${IC.search}<input id="busca" type="search" placeholder="Buscar por nome ou telefone" value="${esc(UI.busca)}" aria-label="Buscar paciente"></label><button class="btn primary" data-act="novoPac">${IC.plus}Novo paciente</button></div></header>
    <section class="panel" id="pacList">${listaPacientes()}</section>`;
}
function listaPacientes(){
  const q=semAcento(UI.busca),qd=digits(UI.busca);
  const ps=[...S.pacientes].filter(p=>!q||semAcento(p.nome).includes(q)||(qd&&digits(p.telefone).includes(qd))).sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));
  if(!S.pacientes.length)return `<div class="empty"><p>Cadastre o primeiro paciente para montar a ficha, a anamnese e o mapa dos pés.</p><button class="btn primary" data-act="novoPac">Cadastrar paciente</button></div>`;
  if(!ps.length)return `<div class="empty">Nenhum paciente encontrado para essa busca.</div>`;
  return `<div class="list"><div class="li li-h"><span>Nome</span><span>Telefone</span><span>Último atendimento</span><span></span></div>`+ps.map(p=>{const u=ultimoAt(p.id);
    return `<div class="li"><div><button class="link" data-act="abrirPac" data-id="${p.id}">${esc(p.nome)}</button><div class="tags" style="margin-top:3px">${p.nascimento?`<span class="sm muted">${idade(p.nascimento)} anos</span>`:''}${flagsHtml(p)}</div></div>
    <span class="hide-m">${esc(p.telefone||'')}</span><span class="hide-m muted">${u?fmtCurto(u.data):'Ainda não atendido'}</span>
    <div class="row">${p.telefone?`<a class="btn sm wa icon" href="${waLink(p.telefone,`Olá, ${primeiro(p.nome)}!`)}" target="_blank" rel="noopener" aria-label="WhatsApp de ${esc(p.nome)}">${IC.wa}</a>`:''}<button class="btn sm" data-act="novoAg" data-p="${p.id}">Agendar</button></div></div>`}).join('')+'</div>';
}
function modalPac(id){
  const p=id?pac(id):{nome:'',telefone:'',nascimento:'',cpf:'',sexo:'',profissao:'',endereco:'',indicacao:'',obs:''};
  openModal(`<h2>${id?'Editar dados do paciente':'Novo paciente'}</h2><form data-form="pac" data-id="${id||''}" class="grid">
    ${fld('Nome completo',inp('nome',p.nome,'required autocomplete="off"'),'full')}
    ${fld('Telefone (WhatsApp)',inp('telefone',p.telefone,'inputmode="tel" placeholder="(98) 9 0000-0000"'))}${fld('Data de nascimento',inp('nascimento',p.nascimento,'type="date"'))}
    ${fld('E-mail',inp('email',p.email,'type="email"'),'full')}
    ${fld('CPF',inp('cpf',p.cpf,'inputmode="numeric"'))}${fld('Sexo',sel('sexo',['','Feminino','Masculino','Outro'],p.sexo))}
    ${fld('Profissão',inp('profissao',p.profissao,'placeholder="Ajuda a entender o tempo em pé e o calçado"'))}${fld('Como conheceu a clínica',sel('indicacao',['','Indicação de paciente','Instagram','WhatsApp','Passou na frente','Indicação médica','Outro'],p.indicacao))}
    ${fld('Endereço',inp('endereco',p.endereco),'full')}${fld('Observações',txa('obs',p.obs),'full')}
    <div class="form-acts full">${id?`<button type="button" class="btn danger left" data-act="delPac" data-id="${id}">Excluir paciente</button>`:''}<button type="button" class="btn" data-act="fechar">Cancelar</button><button class="btn primary">${id?'Salvar alterações':'Cadastrar e abrir ficha'}</button></div></form>`,{wide:true});
}
function salvarPac(f){
  const o=formObj(f),id=f.dataset.id;
  const p={...(id?pac(id):{id:uid(),criadoEm:hoje(),anamnese:{},avaliacao:{},mapa:{}}),...o};
  Store.put('pacientes',p);closeModal();
  if(!id){UI.view='pacientes';UI.pacienteId=p.id;UI.ptab='anamnese';toast('Paciente cadastrado. Agora preencha a anamnese.')}else toast('Dados atualizados');
  render();
}

function vPaciente(){
  const p=pac(UI.pacienteId),c=cfg();const a=anam(p);
  const tabs=[['ficha','Ficha'],['anamnese','Anamnese'],['mapa','Mapa dos pés'],['evolucoes','Evoluções'],['financeiro','Atendimentos']];
  let corpo='';
  if(UI.ptab==='ficha'){
    const ats=S.agenda.filter(x=>x.pacienteId===p.id);const feitos=ats.filter(x=>x.status==='concluido');
    const prox=ats.filter(x=>x.data>=hoje()&&['agendado','confirmado'].includes(x.status)).sort((x,y)=>(x.data+x.hora).localeCompare(y.data+y.hora))[0];
    const pago=feitos.filter(x=>x.pagamento?.pago).reduce((s,x)=>s+num(x.valor),0),pend=feitos.filter(x=>x.pagamento&&!x.pagamento.pago).reduce((s,x)=>s+num(x.valor),0);
    const u=ultimoAt(p.id);
    const dados=[['Telefone',p.telefone],['E-mail',p.email],['Nascimento',p.nascimento?`${fmtCurto(p.nascimento)} (${idade(p.nascimento)} anos)`:''],['CPF',p.cpf],['Sexo',p.sexo],['Profissão',p.profissao],['Endereço',p.endereco],['Como conheceu',p.indicacao],['Observações',p.obs],['Cadastro',fmtCurto(p.criadoEm)]].filter(x=>x[1]);
    corpo=`<div class="two"><section class="panel"><div class="panel-h"><h2>Dados pessoais</h2><button class="btn sm" data-act="editPac" data-id="${p.id}">Editar</button></div><dl class="dl">${dados.map(([k,v])=>`<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl></section>
    <section class="panel"><h2 style="margin-bottom:12px">Resumo</h2><div class="kv"><div><span>Atendimentos</span><b>${feitos.length}</b></div><div><span>Último atendimento</span><b>${u?fmtCurto(u.data):'Nenhum'}</b></div>
    <div><span>Próximo horário</span><b>${prox?`${fmtCurto(prox.data)}, ${prox.hora}`:'Nenhum'}</b></div><div><span>Total pago</span><b>${brl(pago)}</b></div>${pend?`<div><span>A receber</span><b style="color:var(--warn)">${brl(pend)}</b></div>`:''}</div>
    ${queixaTexto(a)?`<p style="margin-top:14px"><b>Queixas atuais:</b> ${esc(queixaTexto(a))}</p>`:`<p class="muted" style="margin-top:14px">A anamnese ainda não foi preenchida. <button class="link" data-act="ptab" data-t="anamnese">Preencher agora</button></p>`}</section></div>`;
  }else if(UI.ptab==='anamnese'){
    corpo=fichaAnamnese(p,a,c);
  }else if(UI.ptab==='mapa'){
    const av=p.avaliacao||{};const marc=Object.entries(p.mapa||{}).filter(([k,m])=>(m.c||[]).length||m.n);
    corpo=`<div class="mapa"><section class="panel"><div class="panel-h"><h2>Mapa dos pés</h2>${marc.length?'<button class="btn sm" data-act="limparMapa">Limpar mapa</button>':''}</div>
      <p class="muted sm">Toque em um dedo ou em uma região da planta para marcar o que encontrou.</p>
      <div class="pes"><figure>${svgPe(p,'E')}<figcaption>Esquerdo</figcaption></figure><figure>${svgPe(p,'D')}<figcaption>Direito</figcaption></figure></div>
      <div class="legenda">${marc.length?marc.map(([k,m])=>`<div><b>${esc(regiaoNome(k))}</b>${esc((m.c||[]).join(', '))}${m.n?`<div class="sm muted">${esc(m.n)}</div>`:''}</div>`).join(''):'<p class="muted sm">Nenhuma região marcada.</p>'}</div></section>
      <form class="panel grid" data-form="avaliacao"><h2 class="full">Avaliação podológica</h2>
        ${fld('Formato do pé',sel('tipoPe',['','Egípcio (dedão maior)','Grego (2º dedo maior)','Romano (dedos alinhados)'],av.tipoPe))}${fld('Arco plantar',sel('arco',['','Normal','Plano (pé chato)','Cavo (arco alto)'],av.arco))}
        ${fld('Pisada',sel('pisada',['','Neutra','Pronada (para dentro)','Supinada (para fora)'],av.pisada))}${fld('Pele',sel('pele',['','Normal','Ressecada','Muito ressecada (anidrose)','Suor excessivo (hiperidrose)'],av.pele))}
        ${fld('Sensibilidade (monofilamento)',sel('sensibilidade',['','Preservada','Diminuída','Ausente'],av.sensibilidade))}${fld('Pulsos pediosos',sel('pulsos',['','Presentes','Diminuídos','Ausentes'],av.pulsos))}
        ${fld('Temperatura',sel('temperatura',['','Normal','Fria','Quente'],av.temperatura))}${fld('Odor',sel('odor',['','Normal','Forte (bromidrose)'],av.odor))}
        ${fld('Edema (inchaço)',sel('edema',['','Ausente','Presente'],av.edema))}${fld('Coloração',sel('cor',['','Normal','Avermelhada','Arroxeada','Pálida'],av.cor))}
        ${fld('Observações da avaliação',txa('obs',av.obs),'full')}
        <div class="form-acts full"><button class="btn primary">Salvar avaliação</button></div></form></div>`;
  }else if(UI.ptab==='evolucoes'){
    const evs=S.evolucoes.filter(e=>e.pacienteId===p.id).sort((x,y)=>y.data.localeCompare(x.data));
    corpo=`<section class="panel"><div class="panel-h"><h2>Evoluções</h2><button class="btn sm primary" data-act="novaEvol" data-p="${p.id}">${IC.plus}Nova evolução</button></div>
    ${evs.length?evs.map(e=>{const regs=Object.entries(e.mapa||{}).filter(([k,m])=>(m.c||[]).length).map(([k,m])=>`${regiaoNome(k)}: ${(m.c||[]).join(', ')}`);
      return `<article class="ev"><div class="ev-h"><div><b>${fmtLongo(e.data)}</b> <span class="muted sm">${fmtCurto(e.data)}</span></div><div class="row">${e.orientacoes&&p.telefone?waBtn(p.telefone,`Olá, ${primeiro(p.nome)}! Seguem as orientações do seu atendimento na ${c.nome}:\n\n${e.orientacoes}`,'Enviar orientações'):''}<button class="btn sm" data-act="editEvol" data-id="${e.id}">Editar</button></div></div>
      <div class="tags">${(e.procedimentos||[]).map(n=>`<span class="tag info">${esc(n)}</span>`).join('')}${e.dor!==''&&e.dor!=null?`<span class="tag ${num(e.dor)>=7?'bad':num(e.dor)>=4?'warn':'ok'}">Dor ${esc(e.dor)}/10</span>`:''}</div>
      <dl>${e.descricao?`<dt>Atendimento</dt><dd>${esc(e.descricao)}</dd>`:''}${e.conduta?`<dt>Materiais</dt><dd>${esc(e.conduta)}</dd>`:''}${e.orientacoes?`<dt>Orientações</dt><dd>${esc(e.orientacoes)}</dd>`:''}${e.retornoDias?`<dt>Retorno</dt><dd>em ${e.retornoDias} dias (${fmtCurto(addDays(e.data,e.retornoDias))})</dd>`:''}${regs.length?`<dt>Mapa na data</dt><dd>${esc(regs.join('\n'))}</dd>`:''}</dl></article>`}).join(''):'<div class="empty">Nenhuma evolução registrada. Ao finalizar um atendimento, você pode registrar a evolução na hora.</div>'}</section>`;
  }else{
    const ats=S.agenda.filter(x=>x.pacienteId===p.id).sort((x,y)=>(y.data+y.hora).localeCompare(x.data+x.hora));
    corpo=`<section class="panel"><div class="panel-h"><h2>Atendimentos e pagamentos</h2><button class="btn sm primary" data-act="novoAg" data-p="${p.id}">${IC.plus}Agendar</button></div>
    ${ats.length?`<div class="table-wrap"><table><thead><tr><th>Data</th><th>Serviços</th><th>Situação</th><th>Valor</th><th>Pagamento</th><th></th></tr></thead><tbody>${ats.map(x=>`<tr><td>${fmtCurto(x.data)} ${x.hora}</td><td>${esc(servNomes(x))}</td><td>${chip(x.status)}</td><td>${brl(x.valor)}</td><td>${x.status==='concluido'&&x.pagamento?(x.pagamento.pago?esc(x.pagamento.forma):`<button class="btn sm" data-act="receberAg" data-id="${x.id}">Receber</button>`):'<span class="muted">-</span>'}</td><td><button class="btn sm ghost" data-act="editAg" data-id="${x.id}">Abrir</button></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Nenhum atendimento ainda.</div>'}</section>`;
  }
  return `<button class="btn ghost sm" data-act="voltarPacs">${IC.back}Pacientes</button>
  <header class="pac-h"><div><h1>${esc(p.nome)}</h1><div class="tags"><span class="muted">${[p.nascimento?idade(p.nascimento)+' anos':'',p.telefone].filter(Boolean).map(esc).join(', ')}</span>${flagsHtml(p)}</div>
  ${a.alergias?`<p class="sm" style="margin-top:6px;color:var(--warn)"><b>Alergias:</b> ${esc(a.alergias)}</p>`:''}</div>
  <div class="row">${p.telefone?`<a class="btn wa" href="${waLink(p.telefone,`Olá, ${primeiro(p.nome)}!`)}" target="_blank" rel="noopener">${IC.wa}WhatsApp</a>`:''}<button class="btn" data-act="novaEvol" data-p="${p.id}">Registrar evolução</button><button class="btn primary" data-act="novoAg" data-p="${p.id}">${IC.plus}Agendar</button></div></header>
  <div class="tabs" role="tablist">${tabs.map(([k,t])=>`<button role="tab" aria-selected="${UI.ptab===k}" data-act="ptab" data-t="${k}">${t}</button>`).join('')}</div>${corpo}`;
}
function modalRegiao(key){
  const p=pac(UI.pacienteId);const m=(p.mapa||{})[key]||{c:[],n:''};
  openModal(`<h2>${esc(regiaoNome(key))}</h2><form data-form="regiao" data-k="${key}"><div class="chks">${CONDICOES.map(c=>chk('c',(m.c||[]).includes(c),esc(c),c)).join('')}</div>
    <div style="margin-top:12px">${fld('Anotação',txa('n',m.n,'rows="2" placeholder="Ex.: borda lateral inflamada, sem secreção"'))}</div>
    <div class="form-acts">${(m.c||[]).length||m.n?`<button type="button" class="btn danger left" data-act="limparRegiao" data-k="${key}">Limpar região</button>`:''}<button type="button" class="btn" data-act="fechar">Cancelar</button><button class="btn primary">Salvar</button></div></form>`,{wide:true});
}
