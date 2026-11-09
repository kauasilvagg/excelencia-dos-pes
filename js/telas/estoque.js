'use strict';
/* ---------- tela: estoque ---------- */
function vEstoque(){
  const d=hoje();const itens=[...S.estoque].sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));
  const baixo=itens.filter(i=>num(i.qtd)<=num(i.minimo)).length;
  return `<header class="ph"><div><h1>Estoque</h1><p>${itens.length} itens${baixo?`, ${baixo} para repor`:''}</p></div><button class="btn primary" data-act="item">${IC.plus}Novo item</button></header>
  <section class="panel">${itens.length?`<div class="table-wrap"><table><thead><tr><th>Material</th><th>Quantidade</th><th>Mínimo</th><th>Validade</th><th>Situação</th><th></th></tr></thead><tbody>${itens.map(i=>{
    const st=num(i.qtd)<=num(i.minimo)?'<span class="tag warn">Repor</span>':(i.validade&&i.validade<d?'<span class="tag bad">Vencido</span>':(i.validade&&i.validade<=addDays(d,30)?'<span class="tag warn">Vence em breve</span>':'<span class="tag ok">Ok</span>'));
    return `<tr><td><b>${esc(i.nome)}</b><div class="sm muted">${esc(i.unidade||'')}</div></td><td><span class="qty"><button class="btn sm icon" data-act="estMenos" data-id="${i.id}" aria-label="Diminuir">−</button><b>${num(i.qtd)}</b><button class="btn sm icon" data-act="estMais" data-id="${i.id}" aria-label="Aumentar">+</button></span></td><td>${num(i.minimo)}</td><td>${i.validade?fmtCurto(i.validade):'<span class="muted">-</span>'}</td><td>${st}</td><td><button class="btn sm ghost" data-act="item" data-id="${i.id}">Editar</button></td></tr>`}).join('')}</tbody></table></div>`
    :`<div class="empty"><p>Controle lâminas, luvas, gaze e tudo o que é usado nos atendimentos. O sistema avisa quando algo estiver acabando ou perto de vencer.</p><button class="btn primary" data-act="estPadrao">Adicionar a lista básica de materiais</button></div>`}</section>`;
}
function modalItem(id){
  const i=id?S.estoque.find(x=>x.id===id):{nome:'',unidade:'unidade',qtd:0,minimo:1,validade:'',custo:''};
  openModal(`<h2>${id?'Editar item':'Novo item do estoque'}</h2><form data-form="item" data-id="${id||''}" class="grid">
    ${fld('Material',inp('nome',i.nome,'required'),'full')}${fld('Unidade',inp('unidade',i.unidade,'placeholder="caixa, pacote, frasco"'))}${fld('Custo por unidade (R$)',inp('custo',i.custo,'inputmode="decimal"'))}
    ${fld('Quantidade atual',inp('qtd',i.qtd,'type="number" min="0" step="1" inputmode="numeric"'))}${fld('Avisar quando chegar a',inp('minimo',i.minimo,'type="number" min="0" step="1" inputmode="numeric"'))}
    ${fld('Validade',inp('validade',i.validade,'type="date"'))}
    <div class="form-acts full">${id?`<button type="button" class="btn danger left" data-act="delItem" data-id="${id}">Excluir</button>`:''}<button type="button" class="btn" data-act="fechar">Cancelar</button><button class="btn primary">Salvar</button></div></form>`);
}
