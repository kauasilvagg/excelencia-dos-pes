'use strict';
/* ---------- dados de exemplo ---------- */
function dadosExemplo(){
  const d=hoje(),N={};COLS.forEach(c=>N[c]=[]);
  N.servicos=SERV_PADRAO.map(s=>({id:uid(),...s,ativo:true}));
  const sv=n=>N.servicos.find(x=>x.nome.startsWith(n));
  const base=[
    ['Maria das Graças Silva','(98) 98111-0001',`1958-${addDays(d,2).slice(5)}`,{diabetes:'Tipo 2',glicemia:'Sim',hipertensao:true,queixa:'Unha do dedão direito encravando e doendo ao calçar',calcado:'Sandália rasteira',medicamentos:'Metformina, losartana'},{'D-halux':{c:['Unha encravada (onicocriptose)'],n:'Borda lateral inflamada, sem secreção'}},{sensibilidade:'Diminuída',pulsos:'Presentes',pele:'Ressecada'}],
    ['José Ribamar Costa','(98) 98111-0002','1971-03-14',{diabetes:'Não',anticoagulante:true,medicamentos:'Varfarina',queixa:'Calos na planta dos pés',calcado:'Botina de segurança',horasPe:'9'},{'E-antepe':{c:['Calosidade (hiperqueratose)'],n:''},'D-antepe':{c:['Calosidade (hiperqueratose)','Calo (heloma)'],n:'Calo sob a 2ª cabeça metatarsal'}},{pisada:'Pronada (para dentro)'}],
    ['Ana Clara Mendes','(98) 98111-0003','1996-09-02',{diabetes:'Não',alergias:'Látex',queixa:'Unhas amareladas e grossas',atividade:'Academia 4x por semana'},{'E-halux':{c:['Micose de unha (onicomicose)'],n:'Metade distal da lâmina'},'E-dedo2':{c:['Micose de unha (onicomicose)'],n:''}},{pele:'Suor excessivo (hiperidrose)'}],
    ['Francisca Sousa Lima','(98) 98111-0004','1983-12-20',{diabetes:'Não',gestante:true,queixa:'Rachaduras no calcanhar'},{'E-calcanhar':{c:['Rachadura (fissura)'],n:''},'D-calcanhar':{c:['Rachadura (fissura)'],n:'Fissura profunda'}},{pele:'Muito ressecada (anidrose)'}],
    ['Raimundo Nonato Pereira','(98) 98111-0005','1949-06-08',{diabetes:'Tipo 2',glicemia:'Não',circulacao:true,fumante:true,queixa:'Avaliação de rotina do pé diabético'},{},{sensibilidade:'Diminuída',pulsos:'Diminuídos',temperatura:'Fria'}],
    ['Luciana Ferreira','(98) 98111-0006','1990-04-25',{diabetes:'Não',queixa:'Podoprofilaxia mensal'},{},{}],
  ];
  N.pacientes=base.map(([nome,telefone,nascimento,anamnese,mapa,avaliacao])=>({id:uid(),nome,telefone,nascimento,criadoEm:addDays(d,-70),anamnese:{...anamnese,atualizada:addDays(d,-60)},mapa,avaliacao,sexo:/a$|Graças/.test(primeiro(nome))||nome.startsWith('Maria')?'Feminino':'Masculino'}));
  const P=i=>N.pacientes[i];
  const ag=(pi,dd,hora,servs,status)=>{const ss=servs.map(sv);return {id:uid(),pacienteId:P(pi).id,data:dd,hora,duracao:ss.reduce((a,x)=>a+x.duracao,0),servicoIds:ss.map(x=>x.id),valor:ss.reduce((a,x)=>a+x.preco,0),status,obs:'',criadoEm:addDays(d,-7)}};
  const passados=[[0,-14,'09:00',['Unha encravada'],'Pix',7,'Espiculectomia na borda lateral do hálux direito. Sem sinais de infecção.','Manter curativo seco por 24 horas e usar calçado aberto.'],
    [1,-10,'10:00',['Remoção de calos'],'A receber',30,'Desbaste de calosidades plantares bilaterais e enucleação de calo sob 2º metatarso. Cuidado redobrado por uso de anticoagulante.','Hidratar diariamente e evitar andar descalço.'],
    [2,-20,'14:00',['Tratamento de micose','Laserterapia'],'Cartão de crédito',15,'Desbaste da lâmina ungueal e primeira sessão de laser.','Aplicar o antifúngico todas as noites e trocar as meias diariamente.'],
    [5,-33,'16:00',['Podoprofilaxia'],'Dinheiro',30,'Corte, limpeza e hidratação.',''],
    [3,-40,'15:00',['Tratamento de rachaduras'],'Pix',15,'Desbaste das bordas das fissuras e hidratação profunda.','Creme com ureia duas vezes ao dia, meias de algodão para dormir.']];
  passados.forEach(([pi,dd,h,ss,forma,ret,desc,ori])=>{const a=ag(pi,addDays(d,dd),h,ss,'concluido');const pago=forma!=='A receber';a.pagamento={forma,pago,data:a.data};N.agenda.push(a);
    if(pago)N.caixa.push({id:uid(),tipo:'entrada',data:a.data,descricao:`Atendimento: ${P(pi).nome}`,valor:a.valor,forma,categoria:'Atendimento',agendaId:a.id});
    N.evolucoes.push({id:uid(),pacienteId:P(pi).id,agendaId:a.id,data:a.data,procedimentos:ss.map(n=>sv(n).nome),dor:String(pi===0?6:pi===1?4:2),descricao:desc,conduta:'Instrumental esterilizado, lâmina nº 15, gaze estéril.',orientacoes:ori,retornoDias:ret,mapa:JSON.parse(JSON.stringify(P(pi).mapa))})});
  N.agenda.push(ag(3,addDays(d,-3),'15:00',['Tratamento de rachaduras'],'faltou'));
  N.agenda.push(ag(5,d,'08:30',['Podoprofilaxia'],'confirmado'),ag(0,d,'10:00',['Unha encravada'],'confirmado'),ag(4,d,'14:00',['Avaliação do pé diabético'],'agendado'),ag(2,d,'16:00',['Tratamento de micose','Laserterapia'],'agendado'));
  N.agenda.push(ag(1,addDays(d,1),'09:00',['Remoção de calos'],'agendado'));
  const mes=d.slice(0,8);
  N.caixa.push({id:uid(),tipo:'saida',data:mes+'01',descricao:'Aluguel da sala',valor:1200,forma:'Pix',categoria:'Aluguel'},{id:uid(),tipo:'saida',data:mes+'03',descricao:'Lâminas, luvas e gaze',valor:236.5,forma:'Cartão de débito',categoria:'Material e insumos'},{id:uid(),tipo:'entrada',data:mes+'02',descricao:'Venda de creme hidratante',valor:45,forma:'Dinheiro',categoria:'Venda'});
  N.estoque=ESTOQUE_PADRAO.map(([nome,unidade,minimo],i)=>({id:uid(),nome,unidade,minimo,qtd:i===0?1:i===3?3:minimo+3+(i%4),validade:i===12?addDays(d,18):'',custo:''}));
  [-6,-4,-2,-1].forEach((k,i)=>N.esterilizacao.push({id:uid(),ciclo:i+41,data:addDays(d,k),hora:'07:30',temperatura:'121',tempo:'30',indicadorQuimico:'Aprovado',indicadorBiologico:i===0?'Aprovado':'Não usado',materiais:'Kits de alicates e espátulas',responsavel:'',obs:''}));
  N.config=[{...CFG_PADRAO}];
  return N;
}
