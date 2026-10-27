"use strict";
// Camada demonstrativa V2. Dados fictícios, exclusivamente em memória e sem serviços externos.
const archivedLeads=[];
const crmAudit=[];
const archivedCap=100;
const assignedDdd = [{ddd:"11",owner:"Equipe Comercial"},{ddd:"15",owner:"Usuário Demo"},{ddd:"19",owner:"Equipe Comercial"}];
const crmStatus=["Precisa responder","Aguardando lead","Primeiro contato","Follow-up atrasado","Parado +3 dias","Concluído"];
const nowText=()=>new Date().toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"});
const isoToday=()=>new Date().toISOString().slice(0,10);
function historyFor(l){if(!l.history)l.history=[{at:"27/10/2026",what:"Lead inserido na base demonstrativa"}];return l.history;}
function logCrm(l,what){const event={at:nowText(),what}; if(l)historyFor(l).unshift(event);crmAudit.unshift({at:event.at,lead:l?.name||"Sistema",what});renderCrmAudit();}
function addCrmCss(){const s=document.createElement('link');s.rel='stylesheet';s.href='crm-v2.css';document.head.appendChild(s);}
function appendCrmPages(){
 const nav=document.querySelector('nav[aria-label="Menu principal"]');
 nav.insertAdjacentHTML('beforeend',`<button class="nav-item" data-page="arquivados"><span class="nav-ico">▤</span>Arquivados</button><button class="nav-item" data-page="auditoria"><span class="nav-ico">◷</span>Auditoria</button>`);
 const root=document.querySelector('main.main');
 root.querySelector('footer').insertAdjacentHTML('beforebegin',`
 <section class="page" id="arquivados"><div class="surface crm-panel"><div class="section-head"><h2>Leads arquivados</h2><span>É possível restaurar um lead para o funil</span></div><div id="crm-archived-list"></div></div></section>
 <section class="page" id="auditoria"><div class="surface crm-panel"><div class="section-head"><h2>Registro de atividades</h2><span>Somente operações da demonstração atual</span></div><div id="crm-audit-list"></div></div></section>`);
 const config=$('config').querySelector('.settings-panel');
 config.insertAdjacentHTML('beforeend',`<div class="crm-extra"><h3>Usuários e permissões (simulação)</h3><p>Selecione um perfil para entender a diferença de visibilidade. Não existe autenticação neste protótipo.</p><div class="crm-inline"><label>Perfil <select id="crm-role"><option value="admin">Administrador</option><option value="comercial">Comercial</option><option value="consulta">Consulta</option></select></label><span id="crm-role-note" class="crm-muted">Administrador pode alterar e arquivar leads fictícios.</span></div><h3>Distribuição ilustrativa por DDD</h3><p>Aplica uma regra local de exemplo, sem reproduzir regras internas de distribuição.</p><div class="crm-inline"><label>DDD <select id="crm-ddd"><option value="11">11</option><option value="15">15</option><option value="19">19</option></select></label><label>Responsável <select id="crm-ddd-owner"><option>Equipe Comercial</option><option>Usuário Demo</option></select></label><button class="btn btn-primary" id="crm-ddd-save">Atualizar regra</button></div><div id="crm-ddd-map" class="crm-muted"></div><h3>Dados do portfólio</h3><button class="btn btn-outline" id="crm-reset">Restaurar dados fictícios iniciais</button></div>`);
 const leadsSection=$('leads');leadsSection.insertAdjacentHTML('beforeend',`<p class="crm-footnote">Clique em um lead para editar, registrar interação, reagendar contato, transferir responsável ou arquivar. Os dados não saem do navegador.</p>`);
}
const oldShow=show;
show=function(page){if(page==='arquivados'||page==='auditoria'){
 els('.page').forEach(el=>el.classList.toggle('active',el.id===page));els('.nav-item').forEach(el=>el.classList.toggle('active',el.dataset.page===page));$('page-title').textContent=page==='arquivados'?'Arquivados':'Auditoria';$('page-subtitle').textContent='Demonstração local sem servidor';if(page==='arquivados')renderArchived();else renderCrmAudit();window.scrollTo(0,0);return;
}oldShow(page);};
const originalRenderLeads=renderLeads;
renderLeads=function(){
  const ownerValue=$('owner-filter').value;
  $('owner-filter').innerHTML='<option value="">Todos os responsáveis</option>'+Array.from(new Set(leads.map(x=>x.owner))).map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');$('owner-filter').value=ownerValue;
  originalRenderLeads();
};
const originalLeadDetails=leadDetails;
leadDetails=function(id){const l=leads.find(x=>x.id===Number(id))||archivedLeads.find(x=>x.id===Number(id));if(!l)return;
 const viewOnly=$('crm-role')?.value==='consulta';const archived=archivedLeads.includes(l);
 modal(`Lead • ${l.name}`,`<p class="modal-note">${esc(l.org)} • Origem: ${esc(l.origin)}</p>
 <div class="crm-detail-tabs"><button type="button" class="btn btn-primary" id="crm-details-tab">Dados</button><button type="button" class="btn btn-outline" id="crm-history-tab">Histórico (${historyFor(l).length})</button></div>
 <div id="crm-detail-fields"><div class="modal-grid"><label>Nome<input id="crm-name" value="${esc(l.name)}" maxlength="90" ${viewOnly?'disabled':''}></label><label>Empresa<input id="crm-org" value="${esc(l.org)}" maxlength="90" ${viewOnly?'disabled':''}></label><label>DDD (fictício)<input id="crm-phone-ddd" value="${esc(l.ddd||'15')}" maxlength="2" inputmode="numeric" ${viewOnly?'disabled':''}></label><label>Responsável<select id="crm-owner" ${viewOnly?'disabled':''}>${['Equipe Comercial','Usuário Demo'].map(v=>`<option ${l.owner===v?'selected':''}>${v}</option>`).join('')}</select></label><label>Etapa<select id="crm-stage" ${viewOnly?'disabled':''}>${STAGES.map(v=>`<option ${l.stage===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label><label>Situação<select id="crm-attention" ${viewOnly?'disabled':''}>${crmStatus.map(v=>`<option ${l.attention===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label><label>Próximo contato<input id="crm-follow" type="date" value="${esc(l.followUp||'')}" ${viewOnly?'disabled':''}></label><label>Origem<select id="crm-origin" ${viewOnly?'disabled':''}>${['Site','Indicação','Evento'].map(v=>`<option ${l.origin===v?'selected':''}>${v}</option>`).join('')}</select></label><label class="full">Observações<textarea id="crm-notes" rows="3" maxlength="500" ${viewOnly?'disabled':''}>${esc(l.notes||'')}</textarea></label></div>
 <div class="modal-actions"><button class="btn btn-outline" id="crm-close">Fechar</button>${viewOnly?'':`<button class="btn btn-outline" id="crm-interaction">Registrar contato</button>${archived?`<button class="btn btn-primary" id="crm-restore">Restaurar</button>`:`<button class="btn btn-outline" id="crm-archive">Arquivar</button>`}<button class="btn btn-primary" id="crm-save">Salvar alterações</button>`}</div></div>
 <div id="crm-detail-history" hidden></div>`);
 const $modal=id=>document.getElementById(id);
 $modal('crm-close').onclick=closeModal;
 $modal('crm-details-tab').onclick=()=>{$modal('crm-detail-fields').hidden=false;$modal('crm-detail-history').hidden=true};
 $modal('crm-history-tab').onclick=()=>{$modal('crm-detail-fields').hidden=true;$modal('crm-detail-history').hidden=false;$modal('crm-detail-history').innerHTML=historyFor(l).map(x=>`<div class="crm-event"><strong>${esc(x.at)}</strong><span>${esc(x.what)}</span></div>`).join('')};
 if(viewOnly)return;
 $modal('crm-save').onclick=()=>{const n=$modal('crm-name').value.trim(),org=$modal('crm-org').value.trim(),ddd=$modal('crm-phone-ddd').value.trim();if(!n||!org||!/^\d{2}$/.test(ddd))return msg('Preencha o nome, a empresa e um DDD de dois números.');const oldOwner=l.owner,oldStage=l.stage;l.name=n;l.org=org;l.ddd=ddd;l.owner=$modal('crm-owner').value;l.stage=$modal('crm-stage').value;l.attention=$modal('crm-attention').value;l.followUp=$modal('crm-follow').value;l.origin=$modal('crm-origin').value;l.notes=$modal('crm-notes').value.trim();l.status=l.stage==='Convertido'?'Convertido':'Ativo';logCrm(l,`Ficha atualizada${oldOwner!==l.owner?' • responsável: '+oldOwner+' → '+l.owner:''}${oldStage!==l.stage?' • etapa: '+oldStage+' → '+l.stage:''}`);closeModal();show(els('.nav-item.active')[0]?.dataset.page||'leads');msg('Ficha e histórico atualizados nesta sessão.');};
 $modal('crm-interaction').onclick=()=>{const note=window.prompt('Descreva o contato fictício (até 200 caracteres):','Tentativa de contato registrada');if(note===null)return;const v=note.trim().slice(0,200);if(!v)return;logCrm(l,`Interação: ${v}`);l.last='Agora';closeModal();leadDetails(l.id);msg('Contato registrado no histórico.');};
 const arch=$modal('crm-archive');if(arch)arch.onclick=()=>{leads.splice(leads.indexOf(l),1);archivedLeads.unshift(l);logCrm(l,'Lead arquivado');closeModal();show('arquivados');msg('Lead arquivado.');};
 const restore=$modal('crm-restore');if(restore)restore.onclick=()=>{archivedLeads.splice(archivedLeads.indexOf(l),1);leads.unshift(l);logCrm(l,'Lead restaurado');closeModal();show('leads');msg('Lead restaurado ao funil.');};
};
function renderArchived(){const el=$('crm-archived-list');if(!el)return;el.innerHTML=archivedLeads.length?archivedLeads.map(l=>`<div class="crm-archive-item"><div><strong>${esc(l.name)}</strong><small>${esc(l.org)} · ${esc(l.stage)}</small></div><button class="btn btn-outline" data-restore="${l.id}">Abrir / Restaurar</button></div>`).join(''):'<p class="crm-muted">Nenhum lead arquivado nesta demonstração.</p>';
 el.querySelectorAll('[data-restore]').forEach(btn=>btn.onclick=()=>leadDetails(btn.dataset.restore));}
function renderCrmAudit(){const el=$('crm-audit-list');if(!el)return;el.innerHTML=crmAudit.length?crmAudit.slice(0,50).map(x=>`<div class="crm-event"><strong>${esc(x.at)} · ${esc(x.lead)}</strong><span>${esc(x.what)}</span></div>`).join(''):'<p class="crm-muted">Nenhuma alteração feita nesta sessão. Edite ou mova um lead para começar o histórico.</p>';}
function dddRender(){$('crm-ddd-map').textContent=assignedDdd.map(x=>`DDD ${x.ddd} → ${x.owner}`).join('   •   ')}
function csvImportDialog(){modal('Importar leads fictícios',`<p class="modal-note">Cole até 10 linhas de exemplo no formato <code>Nome;Empresa;DDD</code>. Os dados ficam apenas nesta sessão. Não importe informações reais.</p><textarea class="crm-import-box" id="crm-import-rows" placeholder="Pessoa Demo;Empresa Exemplo I;15"></textarea><div class="modal-actions"><button class="btn btn-outline" id="crm-import-cancel">Cancelar</button><button class="btn btn-primary" id="crm-import-apply">Importar exemplos</button></div>`);$('crm-import-cancel').onclick=closeModal;$('crm-import-apply').onclick=()=>{const rows=$('crm-import-rows').value.split(/\r?\n/).filter(Boolean);if(!rows.length||rows.length>10)return msg('Informe de 1 a 10 registros fictícios.');const parsed=rows.map(x=>x.split(';').map(v=>v.trim()));if(parsed.some(x=>x.length!==3||!x[0]||!x[1]||!/^\d{2}$/.test(x[2])))return msg('Use Nome;Empresa;DDD com DDD de dois números.');parsed.forEach(x=>{const id= Math.max(0,...leads.map(y=>y.id),...archivedLeads.map(y=>y.id))+1;const owner=assignedDdd.find(d=>d.ddd===x[2])?.owner||'Equipe Comercial';const l={id,name:x[0],org:x[1],ddd:x[2],origin:'Evento',stage:'Novo lead',attention:'Primeiro contato',owner,last:'Agora',status:'Ativo'};leads.unshift(l);logCrm(l,'Lead importado da planilha fictícia');});closeModal();show('leads');msg(`${parsed.length} registros fictícios importados.`);};}
function crmV2Init(){addCrmCss();appendCrmPages();leads.forEach(l=>{l.ddd='15';historyFor(l);});
 document.querySelectorAll('.nav-item[data-page="arquivados"],.nav-item[data-page="auditoria"]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.page)));
 $('import-demo').onclick=csvImportDialog;
 $('crm-role').onchange=e=>{const r=e.target.value;for(const id of ['new-lead','new-stage','import-demo'])$(id).disabled=(r==='consulta');$('crm-role-note').textContent={admin:'Administrador: pode editar e arquivar leads fictícios.',comercial:'Comercial: edita leads; regras administrativas são ilustrativas.',consulta:'Consulta: visualização sem edição de fichas.'}[r];};
 $('crm-ddd').onchange=()=>{$('crm-ddd-owner').value=assignedDdd.find(x=>x.ddd===$('crm-ddd').value)?.owner||'Equipe Comercial'};
 $('crm-ddd-save').onclick=()=>{if($('crm-role').value!=='admin')return msg('A regra é editável apenas no perfil administrador da demo.');assignedDdd.find(x=>x.ddd===$('crm-ddd').value).owner=$('crm-ddd-owner').value;dddRender();logCrm(null,'Regra demonstrativa de atribuição por DDD alterada');msg('Regra fictícia atualizada.');};
 $('crm-reset').onclick=()=>{if(!confirm('Restaurar a demonstração? A página será recarregada.'))return;location.reload();};
 document.addEventListener('dragstart',e=>{const c=e.target.closest('.kanban-card');if(c){const l=leads.find(x=>x.id===Number(c.dataset.lead));window._crmDragHistory=l?{id:l.id,stage:l.stage}:null;}},true);
 document.addEventListener('drop',()=>{const info=window._crmDragHistory;if(!info)return;setTimeout(()=>{const l=leads.find(x=>x.id===info.id);if(l&&l.stage!==info.stage)logCrm(l,`Funil: ${info.stage} → ${l.stage}`);window._crmDragHistory=null;},0);});
 const origNewLead=newLead;newLead=function(){if($('crm-role').value==='consulta')return msg('Perfil de consulta: sem permissão de cadastro nesta demonstração.');origNewLead();const f=$('lead-form');if(f)f.addEventListener('submit',()=>setTimeout(()=>{const l=leads[0];if(l)logCrm(l,'Lead incluído pelo formulário');},0),{once:true})};
 $('new-lead').onclick=newLead;
 dddRender();renderCrmAudit();}
crmV2Init();
