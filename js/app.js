'use strict';
/* ---------- ações ---------- */
const ACT={
  nav:d=>setView(d.v),
  fechar:()=>closeModal(),
  confirmOk:()=>{const f=pendingConfirm;closeModal();if(f)f()},
  novoAg:d=>modalAg(null,{d:d.d,h:d.h,p:d.p}),
  editAg:d=>modalAg(d.id),
  delAg:d=>{const a=S.agenda.find(x=>x.id===d.id);confirmar('Excluir agendamento?','O horário some da agenda. Os lançamentos do caixa ligados a ele também são removidos.','Excluir',()=>{S.caixa.filter(x=>x.agendaId===a.id).forEach(x=>Store.del('caixa',x.id));Store.del('agenda',a.id);toast('Agendamento excluído');render()})},
  confirmarAg:d=>{const a={...S.agenda.find(x=>x.id===d.id),status:'confirmado'};Store.put('agenda',a);toast('Horário confirmado');render()},
  faltouAg:d=>{const a={...S.agenda.find(x=>x.id===d.id),status:'faltou'};Store.put('agenda',a);toast('Falta registrada. Use Reagendar para marcar outro horário.');render()},
  concluirAg:d=>modalConcluir(d.id),
  receberAg:d=>modalReceber(d.id),
  evolAg:d=>modalEvol(null,{agendaId:d.id}),
  novaEvol:d=>modalEvol(null,{pacienteId:d.p}),
  editEvol:d=>modalEvol(d.id),
  delEvol:d=>confirmar('Excluir evolução?','Esse registro do prontuário será apagado.','Excluir',()=>{Store.del('evolucoes',d.id);toast('Evolução excluída');render()}),
  dia:d=>{UI.dia=d.d;render()},
  diaMove:d=>{UI.dia=addDays(UI.dia,Number(d.n));render()},
  abrirPac:d=>{if(!d.id||!pac(d.id))return;UI.view='pacientes';UI.pacienteId=d.id;UI.ptab='ficha';try{history.replaceState(null,'','#pacientes')}catch(e){}render();window.scrollTo(0,0)},
  voltarPacs:()=>{UI.pacienteId=null;render()},
  ptab:d=>{UI.ptab=d.t;render()},
  novoPac:()=>modalPac(null),
  editPac:d=>modalPac(d.id),
  delPac:d=>{const p=pac(d.id);confirmar(`Excluir ${esc(p.nome)}?`,'A ficha, a anamnese, as evoluções e os agendamentos desse paciente serão apagados. Os lançamentos do caixa continuam.','Excluir paciente',()=>{S.agenda.filter(a=>a.pacienteId===p.id).forEach(a=>Store.del('agenda',a.id));S.evolucoes.filter(e=>e.pacienteId===p.id).forEach(e=>Store.del('evolucoes',e.id));Store.del('pacientes',p.id);UI.pacienteId=null;toast('Paciente excluído');render()})},
  regiao:d=>modalRegiao(d.k),
  limparRegiao:d=>{const p={...pac(UI.pacienteId)};p.mapa={...(p.mapa||{})};delete p.mapa[d.k];Store.put('pacientes',p);closeModal();render()},
  limparMapa:()=>confirmar('Limpar o mapa dos pés?','Todas as marcações atuais serão removidas. As evoluções antigas guardam o mapa da data em que foram registradas.','Limpar',()=>{const p={...pac(UI.pacienteId),mapa:{}};Store.put('pacientes',p);render()}),
  mesMove:d=>{const [y,m]=UI.mes.split('-').map(Number);const dt=new Date(y,m-1+Number(d.n),1);UI.mes=`${dt.getFullYear()}-${z2(dt.getMonth()+1)}`;render()},
  lanc:d=>modalLanc(d.t),
  delLanc:d=>confirmar('Excluir lançamento?','O valor sai do caixa do mês.','Excluir',()=>{const x=S.caixa.find(c=>c.id===d.id);if(x&&x.agendaId){const a=S.agenda.find(y=>y.id===x.agendaId);if(a&&a.pagamento){Store.put('agenda',{...a,pagamento:{...a.pagamento,pago:false,forma:'A receber'}})}}Store.del('caixa',d.id);toast('Lançamento excluído');render()}),
  item:d=>modalItem(d.id),
  delItem:d=>confirmar('Excluir item do estoque?','O material sai da lista.','Excluir',()=>{Store.del('estoque',d.id);render()}),
  estMais:d=>{const i={...S.estoque.find(x=>x.id===d.id)};i.qtd=num(i.qtd)+1;Store.put('estoque',i,{lazy:true});render()},
  estMenos:d=>{const i={...S.estoque.find(x=>x.id===d.id)};i.qtd=Math.max(0,num(i.qtd)-1);Store.put('estoque',i,{lazy:true});render()},
  estPadrao:()=>{ESTOQUE_PADRAO.forEach(([nome,unidade,minimo])=>Store.put('estoque',{id:uid(),nome,unidade,minimo,qtd:0,validade:'',custo:''}));toast('Lista adicionada. Atualize as quantidades.');render()},
  novoCiclo:()=>modalCiclo(),
  delCiclo:d=>confirmar('Excluir registro do ciclo?','Esse registro de esterilização será apagado.','Excluir',()=>{Store.del('esterilizacao',d.id);render()}),
  serv:d=>modalServ(d.id),
  delServ:d=>confirmar('Excluir serviço?','Os agendamentos antigos continuam, mas o nome do serviço deixa de aparecer neles. Para só esconder da agenda, desmarque Disponível para agendar.','Excluir',()=>{Store.del('servicos',d.id);render()}),
  servPadrao:()=>{const ex=new Set(S.servicos.map(s=>s.nome));SERV_PADRAO.filter(s=>!ex.has(s.nome)).forEach(s=>Store.put('servicos',{id:uid(),...s,ativo:true}));toast('Serviços adicionados. Ajuste os valores se precisar.');if(UI.view!=='servicos')setView('servicos');else render()},
  demo:()=>confirmar('Preencher com dados de exemplo?','Os dados atuais serão substituídos por pacientes e atendimentos fictícios. Exporte um backup antes se quiser guardar algo.','Preencher',()=>{Store.replaceAll(dadosExemplo());toast('Dados de exemplo carregados');setView('inicio')},false),
  apagarTudo:()=>{openModal(`<h2>Apagar todos os dados?</h2><p class="muted">Pacientes, agenda, prontuários, caixa e estoque serão apagados. Para confirmar, digite <b>apagar</b>.</p><form data-form="apagar" style="margin-top:12px">${inp('conf','','autocomplete="off" aria-label="Digite apagar"')}<div class="form-acts"><button type="button" class="btn" data-act="fechar">Voltar</button><button class="btn danger">Apagar tudo</button></div></form>`)},
  exportar:async()=>{
    const json=JSON.stringify({app:'excelencia-dos-pes',versao:1,exportadoEm:new Date().toISOString(),dados:S},null,1);
    const nome=`backup-excelencia-dos-pes-${hoje()}.json`;
    try{const dl=window.claude&&claude.use?await claude.use('downloads'):null;if(dl){await dl.save({filename:nome,data:json});marcarBackup();return}}catch(e){if(e&&e.code&&e.code!=='unavailable'){return}}
    if(!window.claude){try{const u=URL.createObjectURL(new Blob([json],{type:'application/json'}));const l=document.createElement('a');l.href=u;l.download=nome;document.body.appendChild(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(u),3000);marcarBackup();toast('Backup baixado. Guarde o arquivo no Google Drive ou no e-mail.');render();return}catch(e){}}
    openModal(`<h2>Copiar backup</h2><p class="muted" style="margin-bottom:10px">Copie o texto abaixo e salve em um arquivo ou no e-mail.</p><textarea rows="10" readonly onclick="this.select()">${esc(json)}</textarea><div class="form-acts"><button class="btn primary" data-act="fechar">Pronto</button></div>`);
  },
  importar:()=>$('#importFile').click(),
  esqueciSenha:()=>esqueciSenha(),
  trocarSenha:()=>modalNovaSenha(false),
  sair:()=>Store.sair(),
  reassinar:()=>{const v=$('#sigView'),b=$('#sigBox');if(v)v.classList.add('hidden');if(b)b.classList.remove('hidden');setupSig()},
  limparAss:()=>{const cv=$('#sigCanvas');if(cv&&cv.width){const ctx=cv.getContext('2d');ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cv.width,cv.height);ctx.restore()}sigDirty=false;const h=$('#sigHint');if(h)h.classList.remove('hidden')},
};
const FORMS={
  login:f=>fazerLogin(f),novaSenha:f=>salvarNovaSenha(f),
  ag:salvarAg,concluir:salvarConcluir,receber:salvarReceber,evol:salvarEvol,pac:salvarPac,
  anamnese:f=>{const o=formObj(f);const p0=pac(UI.pacienteId);if(!o.nome){toast('Informe o nome do paciente.');return}
    const {nome,nascimento,telefone,email,endereco,...resto}=o;
    const a={...anam(p0),...resto,atualizada:hoje()};['diabetes','glicemia','hipertensao','circulacao','queixa','obs','anticoagulante'].forEach(k=>delete a[k]);
    const cv=$('#sigCanvas');if(sigDirty&&cv)a.assinatura=sigPng(cv);
    Store.put('pacientes',{...p0,nome,nascimento,telefone,email,endereco,anamnese:a});sigDirty=false;toast('Ficha de anamnese salva');render()},
  avaliacao:f=>{const o=formObj(f);const p={...pac(UI.pacienteId),avaliacao:o};Store.put('pacientes',p);toast('Avaliação salva');render()},
  regiao:f=>{const o=formObj(f);const p={...pac(UI.pacienteId)};p.mapa={...(p.mapa||{})};if((o.c||[]).length||o.n)p.mapa[f.dataset.k]={c:o.c||[],n:o.n};else delete p.mapa[f.dataset.k];Store.put('pacientes',p);closeModal();render()},
  lanc:f=>{const o=formObj(f);if(num(o.valor)<=0){toast('Informe um valor maior que zero.');return}Store.put('caixa',{id:uid(),tipo:f.dataset.t,data:o.data,descricao:o.descricao,valor:num(o.valor),forma:o.forma,categoria:o.categoria||(f.dataset.t==='entrada'?'Outras entradas':'Outros')});closeModal();UI.mes=o.data.slice(0,7);toast(f.dataset.t==='entrada'?'Entrada registrada':'Despesa registrada');render()},
  item:f=>{const o=formObj(f),id=f.dataset.id;Store.put('estoque',{...(id?S.estoque.find(x=>x.id===id):{id:uid()}),...o,qtd:num(o.qtd),minimo:num(o.minimo)});closeModal();toast('Estoque atualizado');render()},
  ciclo:f=>{const o=formObj(f);Store.put('esterilizacao',{id:uid(),...o});closeModal();toast(o.indicadorQuimico==='Reprovado'||o.indicadorBiologico==='Reprovado'?'Ciclo salvo com indicador reprovado. Repita a esterilização desses materiais.':'Ciclo registrado');render()},
  serv:f=>{const o=formObj(f),id=f.dataset.id;Store.put('servicos',{...(id?servOf(id):{id:uid()}),nome:o.nome,preco:num(o.preco),duracao:num(o.duracao)||30,retornoDias:num(o.retornoDias),ativo:o.ativo});closeModal();toast('Serviço salvo');render()},
  config:f=>{const o=formObj(f);if(toMin(o.fim)<=toMin(o.inicio)){toast('O horário de fechamento precisa ser depois da abertura.');return}Store.put('config',{...cfg(),...o,intervalo:num(o.intervalo)||30,dias:(o.dias||[]).map(Number),id:'clinica'});toast('Configurações salvas');render()},
  apagar:f=>{if(semAcento(f.conf.value)!=='apagar'){toast('Digite apagar para confirmar.');return}Store.replaceAll({});closeModal();toast('Todos os dados foram apagados');setView('inicio')},
};

/* ---------- eventos ---------- */
document.addEventListener('click',e=>{
  if(e.target.classList&&e.target.classList.contains('overlay')){closeModal();return}
  const el=e.target.closest('[data-act]');if(!el)return;
  const fn=ACT[el.dataset.act];if(fn){e.preventDefault();fn(el.dataset,el)}
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&$('#modal-root').innerHTML){closeModal();return}
  if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('g[role=button][data-act]')){e.preventDefault();const fn=ACT[e.target.dataset.act];fn&&fn(e.target.dataset,e.target)}
});
document.addEventListener('submit',e=>{const f=e.target;if(!f.dataset||!f.dataset.form)return;e.preventDefault();const fn=FORMS[f.dataset.form];fn&&fn(f)});
document.addEventListener('change',e=>{
  const t=e.target;
  if(t.id==='pacSel'){$('#novoPacBox').classList.toggle('hidden',t.value!=='__novo');if(t.value==='__novo')t.form.novoNome.focus()}
  if(t.name==='servicoIds'&&t.form&&t.form.dataset.form==='ag'){recalcAg(t.form);delete t.form.dataset.force;$('#agWarn').innerHTML='';$('#agSave').textContent='Salvar agendamento'}
  if(t.form&&t.form.dataset.form==='ag'&&['data','hora','duracao'].includes(t.name)){delete t.form.dataset.force;$('#agWarn').innerHTML='';$('#agSave').textContent='Salvar agendamento'}
  if(t.id==='diaPick'&&t.value){UI.dia=t.value;render()}
  if(t.id==='fxNasc'){const i=$('#fxIdade');if(i)i.value=t.value?idade(t.value)+' anos':''}
  if(t.id==='importFile'&&t.files&&t.files[0]){const r=new FileReader();r.onload=()=>{try{const o=JSON.parse(r.result);const dados=o.dados||o;if(!dados||!Array.isArray(dados.pacientes))throw 0;
      confirmar('Restaurar este backup?',`O arquivo tem ${dados.pacientes.length} pacientes e ${(dados.agenda||[]).length} agendamentos. Os dados atuais serão substituídos.`,'Restaurar',()=>{Store.replaceAll(dados);toast('Backup restaurado');setView('inicio')},false)}
      catch(err){toast('Esse arquivo não é um backup do sistema.')}t.value=''};r.readAsText(t.files[0])}
});
document.addEventListener('input',e=>{if(e.target.id==='busca'){UI.busca=e.target.value;$('#pacList').innerHTML=listaPacientes()}});
window.addEventListener('hashchange',()=>{const v=location.hash.slice(1);if(NAV.some(n=>n[0]===v)&&v!==UI.view)setView(v)});

/* ---------- início ---------- */
function marcarBackup(){try{localStorage.setItem('excelencia-dos-pes-ultimo-backup',hoje())}catch(e){}}
// Pede ao navegador para não apagar os dados sozinho quando faltar espaço.
try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}
{const v=location.hash.slice(1);if(NAV.some(n=>n[0]===v))UI.view=v}
Store.iniciar();
