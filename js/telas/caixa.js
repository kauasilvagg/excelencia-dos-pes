'use strict';
/* ---------- tela: caixa ---------- */
function vCaixa(){
  const mes=UI.mes,[y,m]=mes.split('-').map(Number);
  const itens=S.caixa.filter(x=>x.data&&x.data.startsWith(mes)).sort((a,b)=>b.data.localeCompare(a.data));
  const ent=itens.filter(x=>x.tipo==='entrada'),sai=itens.filter(x=>x.tipo==='saida');
  const tE=somar(ent),tS=somar(sai);
  const receber=S.agenda.filter(a=>a.status==='concluido'&&a.pagamento&&!a.pagamento.pago);
  const porForma={};ent.forEach(x=>porForma[x.forma||'Outro']=(porForma[x.forma||'Outro']||0)+num(x.valor));
  const porCat={};sai.forEach(x=>porCat[x.categoria||'Outros']=(porCat[x.categoria||'Outros']||0)+num(x.valor));
  const nd=new Date(y,m,0).getDate();const porDia=[...Array(nd)].map((_,i)=>somar(ent.filter(x=>Number(x.data.slice(8))===i+1)));const mx=Math.max(...porDia,1);
  const ticks=[1,5,10,15,20,25,nd];
  return `<header class="ph"><div><h1>Caixa</h1><p>${MESES[m-1]} de ${y}</p></div><div class="row">
    <button class="btn icon" data-act="mesMove" data-n="-1" aria-label="Mês anterior">${IC.left}</button><button class="btn icon" data-act="mesMove" data-n="1" aria-label="Próximo mês">${IC.right}</button>
    <button class="btn" data-act="lanc" data-t="saida">Registrar despesa</button><button class="btn primary" data-act="lanc" data-t="entrada">${IC.plus}Registrar entrada</button></div></header>
    <div class="stats"><div class="stat"><span>Entradas</span><b style="color:var(--ok)">${brl(tE)}</b></div><div class="stat"><span>Despesas</span><b style="color:var(--bad)">${brl(tS)}</b></div><div class="stat"><span>Saldo do mês</span><b>${brl(tE-tS)}</b></div></div>
    <div class="two"><section class="panel"><h2 style="margin-bottom:6px">Entradas por dia</h2>
      <div class="bars" role="img" aria-label="Entradas por dia no mês">${porDia.map((v,i)=>`<div class="bar${v?'':' zero'}" style="height:${v?Math.max(4,v/mx*100):2}%" title="Dia ${i+1}: ${brl(v)}"></div>`).join('')}</div>
      <div class="bar-l">${ticks.map(t=>`<span>${t}</span>`).join('')}</div>
      <h3 style="margin:18px 0 8px">Lançamentos do mês</h3>
      ${itens.length?`<div class="table-wrap"><table><thead><tr><th>Data</th><th>Descrição</th><th>Forma</th><th>Valor</th><th></th></tr></thead><tbody>${itens.map(x=>`<tr><td>${fmtCurto(x.data).slice(0,5)}</td><td>${esc(x.descricao)}${x.tipo==='saida'?`<div class="sm muted">${esc(x.categoria||'')}</div>`:''}</td><td>${esc(x.forma||'')}</td><td class="${x.tipo==='entrada'?'money-in':'money-out'}">${x.tipo==='entrada'?'+':'−'} ${brl(x.valor)}</td><td><button class="btn sm ghost" data-act="delLanc" data-id="${x.id}" aria-label="Excluir lançamento">Excluir</button></td></tr>`).join('')}</tbody></table></div>`:'<p class="muted">Nenhum lançamento neste mês. Os atendimentos finalizados entram aqui sozinhos.</p>'}</section>
    <div class="stack"><section class="panel"><h2 style="margin-bottom:10px">Recebido por forma</h2>${Object.keys(porForma).length?`<dl class="dl">${Object.entries(porForma).map(([k,v])=>`<dt>${esc(k)}</dt><dd><b>${brl(v)}</b></dd>`).join('')}</dl>`:'<p class="muted">Sem entradas ainda.</p>'}</section>
    <section class="panel"><h2 style="margin-bottom:10px">Despesas por categoria</h2>${Object.keys(porCat).length?`<dl class="dl">${Object.entries(porCat).map(([k,v])=>`<dt>${esc(k)}</dt><dd><b>${brl(v)}</b></dd>`).join('')}</dl>`:'<p class="muted">Sem despesas registradas.</p>'}</section>
    <section class="panel att"><h2 style="margin-bottom:6px">A receber</h2>${receber.length?receber.map(a=>{const p=pac(a.pacienteId)||{};return `<div class="att-i"><p>${esc(p.nome||'')}<br><span class="sm muted">${fmtCurto(a.data)}, ${brl(a.valor)}</span></p><button class="btn sm" data-act="receberAg" data-id="${a.id}">Receber</button></div>`}).join(''):'<p class="muted">Nenhum pagamento pendente.</p>'}</section></div></div>`;
}
function modalLanc(tipo){
  openModal(`<h2>${tipo==='entrada'?'Registrar entrada':'Registrar despesa'}</h2><form data-form="lanc" data-t="${tipo}" class="grid">
    ${fld('Descrição',inp('descricao','',`required placeholder="${tipo==='entrada'?'Ex.: venda de hidratante':'Ex.: compra de lâminas'}"`),'full')}
    ${fld('Data',inp('data',hoje(),'type="date" required'))}${fld('Valor (R$)',inp('valor','','inputmode="decimal" required'))}
    ${tipo==='saida'?fld('Categoria',sel('categoria',CATS_SAIDA,'Material e insumos')):''}${fld('Forma de pagamento',sel('forma',FORMAS.filter(x=>x!=='A receber'),'Pix'))}
    <div class="form-acts full"><button type="button" class="btn" data-act="fechar">Cancelar</button><button class="btn primary">Salvar</button></div></form>`);
}
