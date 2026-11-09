'use strict';
/* ---------- tela: serviços ---------- */
function vServicos(){
  const ss=[...S.servicos].sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));
  return `<header class="ph"><div><h1>Serviços</h1><p>Valores, duração e prazo de retorno de cada procedimento</p></div><button class="btn primary" data-act="serv">${IC.plus}Novo serviço</button></header>
  <section class="panel">${ss.length?`<div class="table-wrap"><table><thead><tr><th>Serviço</th><th>Duração</th><th>Valor</th><th>Retorno sugerido</th><th></th></tr></thead><tbody>${ss.map(s=>`<tr style="${s.ativo===false?'opacity:.55':''}"><td><b>${esc(s.nome)}</b>${s.ativo===false?' <span class="tag warn">Pausado</span>':''}</td><td>${num(s.duracao)} min</td><td>${brl(s.preco)}</td><td>${num(s.retornoDias)?num(s.retornoDias)+' dias':'<span class="muted">Sem retorno</span>'}</td><td><button class="btn sm ghost" data-act="serv" data-id="${s.id}">Editar</button></td></tr>`).join('')}</tbody></table></div><p class="sm muted" style="margin-top:12px">O retorno sugerido preenche a evolução e faz o paciente aparecer em Retornos para chamar, na tela Hoje.</p>`
    :`<div class="empty"><p>Comece com os procedimentos mais comuns em podologia e ajuste os valores da clínica.</p><button class="btn primary" data-act="servPadrao">Usar a lista de serviços de podologia</button></div>`}</section>`;
}
function modalServ(id){
  const s=id?servOf(id):{nome:'',preco:'',duracao:30,retornoDias:'',ativo:true};
  openModal(`<h2>${id?'Editar serviço':'Novo serviço'}</h2><form data-form="serv" data-id="${id||''}" class="grid">
    ${fld('Nome do serviço',inp('nome',s.nome,'required'),'full')}${fld('Valor (R$)',inp('preco',s.preco,'inputmode="decimal" required'))}${fld('Duração (min)',inp('duracao',s.duracao,'type="number" min="5" step="5" inputmode="numeric"'))}
    ${fld('Retorno sugerido (dias)',inp('retornoDias',s.retornoDias,'type="number" min="0" inputmode="numeric"'))}<div class="fld" style="justify-content:flex-end">${chk('ativo',s.ativo!==false,'Disponível para agendar')}</div>
    <div class="form-acts full">${id?`<button type="button" class="btn danger left" data-act="delServ" data-id="${id}">Excluir</button>`:''}<button type="button" class="btn" data-act="fechar">Cancelar</button><button class="btn primary">Salvar</button></div></form>`);
}
