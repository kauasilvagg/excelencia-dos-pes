'use strict';
/* ---------- tela: esterilização ---------- */
function vEsterilizacao(){
  const d=hoje(),mes=d.slice(0,7);const cs=[...S.esterilizacao].sort((a,b)=>(b.data+(b.hora||'')).localeCompare(a.data+(a.hora||'')));
  const noMes=cs.filter(x=>x.data.startsWith(mes));const falhas=noMes.filter(x=>x.indicadorQuimico==='Reprovado'||x.indicadorBiologico==='Reprovado').length;
  return `<header class="ph"><div><h1>Esterilização</h1><p>Registro dos ciclos da autoclave para a vigilância sanitária</p></div><button class="btn primary" data-act="novoCiclo">${IC.plus}Registrar ciclo</button></header>
  <div class="stats"><div class="stat"><span>Ciclos este mês</span><b>${noMes.length}</b></div><div class="stat"><span>Último ciclo</span><b>${cs[0]?fmtCurto(cs[0].data).slice(0,5):'Nenhum'}</b></div><div class="stat"><span>Indicadores reprovados no mês</span><b style="color:${falhas?'var(--bad)':'inherit'}">${falhas}</b></div></div>
  <section class="panel">${cs.length?`<div class="table-wrap"><table><thead><tr><th>Ciclo</th><th>Data</th><th>Temperatura e tempo</th><th>Indicador químico</th><th>Indicador biológico</th><th>Materiais</th><th></th></tr></thead><tbody>${cs.map(x=>`<tr><td><b>nº ${esc(x.ciclo)}</b></td><td>${fmtCurto(x.data)} ${esc(x.hora||'')}</td><td>${x.temperatura?esc(x.temperatura)+' °C':''}${x.tempo?', '+esc(x.tempo)+' min':''}</td><td>${tagInd(x.indicadorQuimico)}</td><td>${tagInd(x.indicadorBiologico)}</td><td class="sm">${esc(x.materiais||'')}${x.responsavel?`<div class="muted">${esc(x.responsavel)}</div>`:''}</td><td><button class="btn sm ghost" data-act="delCiclo" data-id="${x.id}">Excluir</button></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Registre cada ciclo da autoclave com os indicadores. Esse histórico fica pronto para mostrar em uma fiscalização.</div>'}</section>`;
}
const tagInd=v=>v==='Aprovado'?'<span class="tag ok">Aprovado</span>':v==='Reprovado'?'<span class="tag bad">Reprovado</span>':'<span class="muted sm">Não usado</span>';
function modalCiclo(){
  const ult=S.esterilizacao.reduce((m,x)=>Math.max(m,num(x.ciclo)),0);const now=new Date();
  openModal(`<h2>Registrar ciclo da autoclave</h2><form data-form="ciclo" class="grid">
    ${fld('Número do ciclo',inp('ciclo',ult+1,'type="number" min="1" inputmode="numeric" required'))}${fld('Data',inp('data',hoje(),'type="date" required'))}
    ${fld('Hora',inp('hora',fromMin(now.getHours()*60+now.getMinutes()),'type="time"'))}${fld('Temperatura (°C)',inp('temperatura','','inputmode="decimal" placeholder="Conforme o manual da autoclave"'))}
    ${fld('Tempo de esterilização (min)',inp('tempo','','inputmode="numeric"'))}${fld('Responsável',inp('responsavel',cfg().profissional))}
    ${fld('Indicador químico',sel('indicadorQuimico',['Aprovado','Reprovado','Não usado'],'Aprovado'))}${fld('Indicador biológico',sel('indicadorBiologico',['Não usado','Aprovado','Reprovado'],'Não usado'))}
    ${fld('Materiais no ciclo',inp('materiais','','placeholder="Ex.: 6 kits de alicates, 2 espátulas"'),'full')}${fld('Observações',txa('obs',''),'full')}
    <div class="form-acts full"><button type="button" class="btn" data-act="fechar">Cancelar</button><button class="btn primary">Salvar ciclo</button></div></form>`,{wide:true});
}
