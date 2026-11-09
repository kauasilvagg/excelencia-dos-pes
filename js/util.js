'use strict';
/* ---------- utilidades ---------- */
const $=(s,el=document)=>el.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const z2=n=>String(n).padStart(2,'0');
const isoDate=d=>`${d.getFullYear()}-${z2(d.getMonth()+1)}-${z2(d.getDate())}`;
const hoje=()=>isoDate(new Date());
const parseISO=s=>{const [y,m,d]=String(s).split('-').map(Number);return new Date(y,(m||1)-1,d||1)};
const addDays=(s,n)=>{const d=parseISO(s);d.setDate(d.getDate()+n);return isoDate(d)};
const DIAS=['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
const DIAS_C=['dom','seg','ter','qua','qui','sex','sáb'];
const MESES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const fmtLongo=s=>{const d=parseISO(s);return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`};
const fmtCurto=s=>{if(!s)return '';const [y,m,d]=s.split('-');return `${d}/${m}/${y}`};
const brl=v=>(Number(v)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const num=v=>{const n=parseFloat(String(v??'').replace(',','.'));return isFinite(n)?n:0};
const toMin=h=>{if(!h)return 0;const [a,b]=h.split(':').map(Number);return a*60+(b||0)};
const fromMin=m=>`${z2(Math.floor(m/60))}:${z2(m%60)}`;
const digits=s=>String(s||'').replace(/\D/g,'');
const semAcento=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const primeiro=n=>String(n||'').trim().split(/\s+/)[0]||'';
const somar=arr=>arr.reduce((a,x)=>a+num(x.valor),0);
function idade(nasc){if(!nasc)return '';const n=parseISO(nasc),h=new Date();let i=h.getFullYear()-n.getFullYear();if(h.getMonth()<n.getMonth()||(h.getMonth()===n.getMonth()&&h.getDate()<n.getDate()))i--;return i}
function waLink(tel,msg){let d=digits(tel);if(!d)return '';if(d.length<=11)d='55'+d;return `https://wa.me/${d}?text=${encodeURIComponent(msg)}`}
const fill=(t,v)=>String(t||'').replace(/\{(\w+)\}/g,(m,k)=>v[k]??m);

/* ---------- ícones ---------- */
const sv=p=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const IC={
  inicio:sv('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>'),
  agenda:sv('<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  pacientes:sv('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14.5c2.3 0 3.9 1.5 4.5 4"/>'),
  caixa:sv('<rect x="3" y="6" width="18" height="14" rx="2.5"/><path d="M3 10.5h18M15.5 15h2.5"/>'),
  estoque:sv('<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>'),
  esterilizacao:sv('<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>'),
  servicos:sv('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM8.5 12h7M8.5 16h5"/>'),
  config:sv('<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>'),
  wa:sv('<path d="M4 20l1.3-3.9A8 8 0 1 1 8.1 19z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8c-.9-.4-1.6-1.1-2-2l.8-1-1-2z"/>'),
  plus:sv('<path d="M12 5v14M5 12h14"/>'),
  check:sv('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  left:sv('<path d="m15 5-7 7 7 7"/>'),
  right:sv('<path d="m9 5 7 7-7 7"/>'),
  search:sv('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4"/>'),
  back:sv('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  user:sv('<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.2-6 8-6s7 2 8 6"/>'),
  pulso:sv('<path d="M12 20s-7.5-4.6-9-9.5C2 7 4.2 4.5 7 4.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 2.8 0 5 2.5 4 6-1.5 4.9-9 9.5-9 9.5z"/><path d="M5 12h3l1.5-2.5 2.5 5 1.5-2.5H19"/>'),
  pe:sv('<path d="M9 21c-2.5 0-3.5-2-3.2-4.5.3-2.6-.8-4.5-.8-7C5 7 6.6 6 8.5 6.5c2 .5 2.6 2.4 2.5 5-.1 2.2.9 3.4.9 5.5 0 2.4-1 4-2.9 4z"/><circle cx="10" cy="3.2" r="1.2"/><circle cx="13" cy="4" r="1"/><circle cx="15.2" cy="5.6" r=".9"/><circle cx="16.6" cy="7.8" r=".8"/>'),
  pes:sv('<path d="M7 20c-1.8 0-2.6-1.4-2.4-3.3.2-1.9-.6-3.2-.6-5.1C4 9.8 5.1 9 6.5 9.3 8 9.7 8.4 11 8.3 12.9c-.1 1.6.7 2.5.7 4 0 1.8-.7 3.1-2 3.1zM17 20c1.8 0 2.6-1.4 2.4-3.3-.2-1.9.6-3.2.6-5.1 0-1.8-1.1-2.6-2.5-2.3-1.5.4-1.9 1.7-1.8 3.6.1 1.6-.7 2.5-.7 4 0 1.8.7 3.1 2 3.1z"/><circle cx="6.8" cy="6.5" r="1"/><circle cx="17.2" cy="6.5" r="1"/>'),
  lista:sv('<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h.01M11 9h5M8 12.5h.01M11 12.5h5M8 16h.01M11 16h5"/>'),
};
