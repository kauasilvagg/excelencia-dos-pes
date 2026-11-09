'use strict';
/* ---------- tela: hoje ---------- */
function vInicio(){
  const c=cfg(),d=hoje(),now=new Date(),nm=now.getHours()*60+now.getMinutes();
  const saud=now.getHours()<12?'Bom dia':now.getHours()<18?'Boa tarde':'Boa noite';
  const nomeP=String(c.saudacao||'').trim()||primeiro(c.profissional);
  const ags=agDoDia(d).filter(a=>a.status!=='cancelado');
  const pendentes=ags.filter(a=>['agendado','confirmado'].includes(a.status));
  const futuro=pendentes.find(a=>toMin(a.hora)+(num(a.duracao)||30)>nm);
  const prox=futuro||pendentes[0];const atrasado=!futuro&&!!prox;
  const recHoje=somar(S.caixa.filter(x=>x.tipo==='entrada'&&x.data===d));
  const recMes=somar(S.caixa.filter(x=>x.tipo==='entrada'&&x.data.startsWith(d.slice(0,7))));
  const atend=ags.filter(a=>a.status==='concluido').length;
  let html=`<header class="ph"><div><h1>${saud}${nomeP?', '+esc(nomeP):''}</h1><p>${fmtLongo(d)}</p></div><button class="btn primary" data-act="novoAg" data-d="${d}">${IC.plus}Novo agendamento</button></header>`;

  if(!S.servicos.length&&!S.pacientes.length){
    html+=`<section class="panel welcome" style="margin-bottom:18px"><h2>Vamos deixar a clínica pronta</h2><ol>
      <li>Confira os serviços e valores da clínica. <button class="btn sm" data-act="servPadrao">Usar a lista de serviços de podologia</button></li>
      <li>Cadastre o primeiro paciente com a anamnese. <button class="btn sm" data-act="novoPac">Cadastrar paciente</button></li>
      <li>Quer só conhecer o sistema? <button class="btn sm" data-act="demo">Preencher com dados de exemplo</button></li></ol></section>`;
  }

  if(prox){const p=pac(prox.pacienteId)||{};
    html+=`<section class="hero"><p class="hero-k">${atrasado?`Horário já passou e o atendimento não foi finalizado${pendentes.length>1?` (mais ${pendentes.length-1} na mesma situação)`:''}`:'Próximo atendimento'}</p><div class="hero-row"><span class="hero-time">${prox.hora}</span><div>
      <h2>${p.id?`<button class="link" data-act="abrirPac" data-id="${p.id}">${esc(p.nome)}</button>`:'Paciente removido'}</h2>
      <p>${esc(servNomes(prox))}, ${num(prox.duracao)} min</p><div class="tags" style="margin-top:8px">${chip(prox.status)}${flagsHtml(p)}</div></div></div>
      <div class="row">${prox.status==='agendado'?`<button class="btn sm" data-act="confirmarAg" data-id="${prox.id}">${IC.check}Marcar confirmado</button>`:''}
      <button class="btn sm primary" data-act="concluirAg" data-id="${prox.id}">Finalizar atendimento</button>
      ${atrasado?`<button class="btn sm" data-act="faltouAg" data-id="${prox.id}">Paciente faltou</button>`:''}
      ${queixaTexto(anam(p))?`<span class="sm" style="opacity:.9">Queixa: ${esc(queixaTexto(anam(p)))}</span>`:''}</div></section>`;
  }else{
    html+=`<section class="hero vazio"><p class="hero-k">Agenda de hoje</p><h2>${ags.length?'Todos os atendimentos de hoje já foram registrados.':'Nenhum atendimento marcado para hoje.'}</h2><div class="row"><button class="btn sm primary" data-act="novoAg" data-d="${d}">Marcar horário</button><button class="btn sm" data-act="nav" data-v="agenda">Ver a agenda</button></div></section>`;
  }
  html+=`<div class="stats"><div class="stat"><span>Atendidos hoje</span><b>${atend} de ${ags.length}</b></div><div class="stat"><span>Recebido hoje</span><b>${brl(recHoje)}</b></div><div class="stat"><span>Recebido em ${MESES[now.getMonth()]}</span><b>${brl(recMes)}</b></div></div>`;

  const lista=ags.length?ags.map(a=>{const p=pac(a.pacienteId)||{};return `<div class="mini-i"><strong>${a.hora}</strong><div><button class="link" data-act="abrirPac" data-id="${p.id||''}">${esc(p.nome||'Paciente removido')}</button><div class="sm muted">${esc(servNomes(a))}</div></div>${chip(a.status)}</div>`}).join(''):`<p class="muted">Os horários marcados para hoje aparecem aqui.</p>`;

  /* atenção */
  const blocos=[];
  const amanha=addDays(d,1),naoConf=agDoDia(amanha).filter(a=>a.status==='agendado');
  if(naoConf.length)blocos.push(`<h3>Confirmar os horários de amanhã</h3>`+naoConf.map(a=>{const p=pac(a.pacienteId)||{};return `<div class="att-i"><p><b>${a.hora}</b> ${esc(p.nome||'')}<br><span class="sm muted">${esc(servNomes(a))}</span></p><div class="row">${waBtn(p.telefone,msgConfirmacao(a),'Enviar confirmação')}<button class="btn sm" data-act="confirmarAg" data-id="${a.id}">Confirmado</button></div></div>`}).join(''));
  const rets=retornos();
  if(rets.length)blocos.push(`<h3>Retornos para chamar</h3>`+rets.slice(0,8).map(({p,due})=>`<div class="att-i"><p><button class="link" data-act="abrirPac" data-id="${p.id}">${esc(p.nome)}</button><br><span class="sm muted">Retorno previsto para ${fmtCurto(due)}</span></p><div class="row">${waBtn(p.telefone,fill(c.msgRetorno,{nome:primeiro(p.nome)}),'Chamar')}<button class="btn sm" data-act="novoAg" data-p="${p.id}">Agendar</button></div></div>`).join(''));
  const receber=S.agenda.filter(a=>a.status==='concluido'&&a.pagamento&&!a.pagamento.pago);
  if(receber.length)blocos.push(`<h3>Pagamentos pendentes</h3>`+receber.map(a=>{const p=pac(a.pacienteId)||{};return `<div class="att-i"><p>${esc(p.nome||'')}<br><span class="sm muted">${fmtCurto(a.data)}, ${brl(a.valor)}</span></p><button class="btn sm" data-act="receberAg" data-id="${a.id}">Registrar pagamento</button></div>`}).join(''));
  const baixo=S.estoque.filter(i=>num(i.qtd)<=num(i.minimo));
  const vence=S.estoque.filter(i=>i.validade&&i.validade<=addDays(d,30));
  if(baixo.length||vence.length)blocos.push(`<h3>Estoque</h3>`+baixo.map(i=>`<div class="att-i"><p>${esc(i.nome)}<br><span class="sm muted">Restam ${num(i.qtd)} ${esc(i.unidade||'')}, mínimo ${num(i.minimo)}</span></p><span class="tag warn">Repor</span></div>`).join('')+vence.map(i=>`<div class="att-i"><p>${esc(i.nome)}<br><span class="sm muted">Validade ${fmtCurto(i.validade)}</span></p><span class="tag ${i.validade<d?'bad':'warn'}">${i.validade<d?'Vencido':'Vence em breve'}</span></div>`).join(''));
  const ciclos=[...S.esterilizacao].sort((a,b)=>(b.data+b.hora).localeCompare(a.data+a.hora));
  const ult=ciclos[0];
  if(ult&&(ult.indicadorQuimico==='Reprovado'||ult.indicadorBiologico==='Reprovado'))blocos.push(`<h3>Esterilização</h3><div class="att-i"><p>O último ciclo da autoclave (${fmtCurto(ult.data)}) teve indicador reprovado. Não use os materiais desse ciclo.</p><button class="btn sm" data-act="nav" data-v="esterilizacao">Ver registro</button></div>`);
  else if(S.esterilizacao.length&&ult&&ult.data<addDays(d,-7))blocos.push(`<h3>Esterilização</h3><div class="att-i"><p>O último ciclo da autoclave registrado foi em ${fmtCurto(ult.data)}.</p><button class="btn sm" data-act="novoCiclo">Registrar ciclo</button></div>`);
  let ultBk='';try{ultBk=localStorage.getItem('excelencia-dos-pes-ultimo-backup')||''}catch(e){}
  if(Store.mode==='local'&&S.pacientes.length&&(!ultBk||ultBk<addDays(d,-7)))blocos.push(`<h3>Backup</h3><div class="att-i"><p>Os dados ficam só neste aparelho. ${ultBk?'O último backup foi em '+fmtCurto(ultBk)+'.':'Ainda não foi feito nenhum backup.'}</p><button class="btn sm primary" data-act="exportar">Fazer backup agora</button></div>`);
  const aniv=aniversariantes(7);
  if(aniv.length)blocos.push(`<h3>Aniversariantes da semana</h3>`+aniv.map(({p,i})=>`<div class="att-i"><p>${esc(p.nome)}<br><span class="sm muted">${i===0?'Hoje':i===1?'Amanhã':fmtLongo(addDays(d,i))}, ${idade(p.nascimento)+(i===0?0:1)} anos</span></p>${waBtn(p.telefone,fill(c.msgAniversario,{nome:primeiro(p.nome)}),'Parabenizar')}</div>`).join(''));

  html+=`<div class="two"><section class="panel"><div class="panel-h"><h2>Agenda de hoje</h2><button class="btn sm" data-act="nav" data-v="agenda">Abrir agenda</button></div><div class="mini">${lista}</div></section>
  <section class="panel att"><div class="panel-h"><h2>Precisa da sua atenção</h2></div>${blocos.length?blocos.join(''):'<p class="muted">Tudo em dia. Confirmações, retornos, pagamentos e estoque aparecem aqui quando precisarem de você.</p>'}</section></div>`;
  return html;
}
