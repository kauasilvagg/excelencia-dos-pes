'use strict';
/* ---------- tela: configurações ---------- */
function vConfig(){
  const c=cfg();
  return `<header class="ph"><div><h1>Configurações</h1><p>Dados da clínica, horários, mensagens e backup</p></div></header>
  <div class="stack"><form class="panel grid" data-form="config"><h2 class="full">Clínica</h2>
    ${fld('Nome da clínica',inp('nome',c.nome))}${fld('Telefone',inp('telefone',c.telefone,'inputmode="tel"'))}
    ${fld('Podóloga responsável',inp('profissional',c.profissional))}${fld('Nome na saudação da tela inicial',inp('saudacao',c.saudacao,'placeholder="Ex.: Jucélia"'))}${fld('Registro profissional',inp('registro',c.registro,'placeholder="Opcional"'))}
    ${fld('E-mail',inp('email',c.email,'type="email"'))}
    ${fld('Endereço',inp('endereco',c.endereco))}${fld('Ponto de referência',inp('referencia',c.referencia))}
    <h3 class="section-t">Horário de atendimento</h3>
    ${fld('Abre às',inp('inicio',c.inicio,'type="time"'))}${fld('Fecha às',inp('fim',c.fim,'type="time"'))}
    ${fld('Intervalo da agenda',sel('intervalo',[['15','15 minutos'],['20','20 minutos'],['30','30 minutos'],['45','45 minutos'],['60','1 hora']],String(c.intervalo)))}
    <div class="fld full"><span>Dias de atendimento</span><div class="chks">${DIAS.map((n,i)=>chk('dias',(c.dias||[]).map(Number).includes(i),n[0].toUpperCase()+n.slice(1),String(i))).join('')}</div></div>
    <h3 class="section-t">Mensagens do WhatsApp</h3>
    <p class="full sm muted">Use {nome}, {data}, {hora} e {servico}: o sistema troca pelos dados de cada paciente.</p>
    ${fld('Confirmação de horário',txa('msgConfirmacao',c.msgConfirmacao,'rows="3"'),'full')}${fld('Chamada para retorno',txa('msgRetorno',c.msgRetorno,'rows="2"'),'full')}${fld('Aniversário',txa('msgAniversario',c.msgAniversario,'rows="2"'),'full')}
    <div class="form-acts full"><button class="btn primary">Salvar configurações</button></div></form>
    ${Store.mode==='nuvem'?`<section class="panel"><h2 style="margin-bottom:6px">Conta</h2><p class="muted" style="margin-bottom:12px">Conectada como <b>${esc(Store.user.email||'')}</b>. Entre com este e-mail e senha no celular ou no computador para ver os mesmos dados.</p>
    <div class="row"><button class="btn" data-act="trocarSenha">Trocar senha</button><button class="btn danger" data-act="sair">Sair</button></div></section>`:''}
    <section class="panel"><h2 style="margin-bottom:6px">Backup</h2><p class="muted" style="margin-bottom:12px">${Store.mode==='nuvem'?'Os dados ficam salvos no banco. Mesmo assim, guarde uma cópia de vez em quando.':'Os dados estão salvos só neste aparelho. Exporte uma cópia toda semana e guarde no Google Drive ou no e-mail.'}</p>
    <div class="row"><button class="btn" data-act="exportar">Exportar backup</button><button class="btn" data-act="importar">Restaurar de um backup</button></div></section>
    <section class="panel"><h2 style="margin-bottom:6px">Demonstração</h2><p class="muted" style="margin-bottom:12px">Preenche o sistema com pacientes e atendimentos fictícios para conhecer todas as telas. Substitui os dados atuais.</p>
    <div class="row"><button class="btn" data-act="demo">Preencher com dados de exemplo</button><button class="btn danger" data-act="apagarTudo">Apagar todos os dados</button></div></section></div>`;
}
