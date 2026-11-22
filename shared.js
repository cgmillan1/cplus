/* C Plus shared helpers: language, money, brand art, totals, printing, photos. */
(function () {
const T = {
es: {
 client:'Cliente',contractor:'Contratista',thanks:'Gracias por confiar en nosotros',dream:'Tu sueño es nuestro sueño',enter:'Ver mi proyecto',skip:'Saltar',
 overview:'Resumen',estimate:'Estimado',pays:'Pagos',changes:'Cambios',materials:'Materiales',steps:'Pasos',updates:'Avances',messages:'Mensajes',
 done:'completado',start:'Inicio',end:'Entrega estimada',st_estimate_sent:'Estimado enviado',st_estimate_accepted:'Estimado aceptado',st_progress:'En progreso',st_done:'Terminado',st_planning:'Estimado enviado',st_paused:'En progreso',
 total:'Total del proyecto',labor:'Mano de obra',subtotal:'Subtotal',taxMat:'Impuesto sobre materiales',desc:'Concepto',qty:'Cant.',price:'Precio',amount:'Importe',
 paidSoFar:'Has pagado',remaining:'Falta por pagar',paidPct:'del total pagado',history:'Historial de pagos',date:'Fecha',note:'Nota',amt:'Monto',
 schedule:'Calendario de pagos',ms_paid:'Pagado',ms_next:'Siguiente pago',ms_later:'Pendiente',coveredOf:'cubierto de',
 estSub:'Detalle del trabajo cotizado.',paySub:'Lo que has pagado y lo que falta por pagar.',matSub:'Todo lo necesario para tu proyecto y lo que ya compramos.',
 all:'Todos',pending:'Por comprar',purchased:'Comprado',stepsSub:'Lo que ya hicimos y lo que sigue.',taken:'Pasos realizados',next:'Pasos pendientes',
 updSub:'Notas y fotos del equipo sobre tu proyecto.',contact:'¿Preguntas? Contáctanos',none:'Nada por aquí todavía.',
 changesSub:'Trabajo extra o cambios al estimado. Los aprobados se suman al total.',co_draft:'Borrador',co_pending:'Esperando aprobación',co_approved:'Aprobado',co_declined:'Rechazado',
 approve:'Aprobar',decline:'Rechazar',yourName:'Tu nombre',nameNeeded:'Escribe tu nombre para firmar.',by:'por',
 msgSub:'Escríbenos aquí. Te contestamos lo antes posible.',send:'Enviar',writeMsg:'Escribe tu mensaje',you:'Tú',
 printEst:'Imprimir / PDF del estimado',signClient:'Firma del cliente',signContractor:'Firma del contratista',prepared:'Preparado para',estNo:'Estimado',
 noLink:'Usa el enlace que te mandó tu contratista para ver tu proyecto.',notFound:'No encontramos este proyecto. Revisa el enlace.',loading:'Cargando…',
 refresh:'Actualizar',error:'Algo salió mal',retry:'Intentar de nuevo',
 /* contractor */
 login:'Entrar',email:'Correo',password:'Contraseña',loginT:'Panel del contratista',loginS:'Entra con tu cuenta de C Plus.',logout:'Salir',
 setupT:'Falta conectar la base de datos',setupS:'Abre config.js y pega la URL y la llave de tu proyecto de Supabase. Los pasos están en el README.',
 projects:'Proyectos',newProject:'+ Nuevo proyecto',sampleProject:'Crear proyecto de ejemplo',allProjects:'Todos los proyectos',
 contracts:'Contratos',collected:'Cobrado',receivable:'Por cobrar',spent:'Gastado',profit:'Ganancia estimada',budget:'Presupuesto de costos',left:'Queda del presupuesto',
 profitSub:'Contrato sin impuesto menos lo gastado',contract:'Contrato (cliente)',thisWeek:'Próximos 14 días',noUpcoming:'Sin pasos programados.',
 unread:'mensajes nuevos',settings:'Datos de la empresa',company:'Empresa',cname:'Contacto',phone:'Teléfono',
 dash:'Panel',money:'Presupuesto y gastos',progress:'Avance',project:'Proyecto',back:'← Proyectos',
 logBuy:'Registrar compra o gasto',logPay:'Registrar pago del cliente',store:'Tienda / a quién',cat:'Categoría',linkMat:'Marcar material como comprado',noMat:'Ninguno',register:'Registrar',
 buyOk:'Gasto registrado',payOk:'Pago registrado',addCat:'+ Agregar categoría',expLog:'Registro de gastos',of:'de',over:'Sobre presupuesto',byCat:'Presupuesto por categoría',recent:'Compras y gastos recientes',
 receipt:'Recibo',addReceipt:'Subir recibo',viewReceipt:'Ver recibo',
 addItem:'+ Agregar concepto',addMat:'+ Agregar material',addStep:'+ Agregar paso',addMs:'+ Agregar pago programado',addCo:'+ Nuevo cambio',
 postUpd:'Publicar avance',newUpd:'Escribe un avance para el cliente',addPhotos:'Agregar fotos',photosSel:'fotos listas',uploading:'Subiendo…',
 sendClient:'Enviar al cliente',coHint:'Los cambios en borrador no los ve el cliente. Al enviarlo, el cliente lo puede aprobar o rechazar.',
 msHint:'El estado de cada pago se calcula solo, con lo que el cliente ha pagado.',scheduleTotal:'Suma del calendario',
 reply:'Responder',
 projInfo:'Datos del proyecto',clientName:'Cliente',clientPhone:'Teléfono del cliente',clientEmail:'Correo del cliente',ptitle:'Proyecto',address:'Dirección',status:'Estado',taxp:'Impuesto % (materiales)',
 clientLink:'Enlace privado del cliente',copy:'Copiar',copied:'Copiado',open:'Abrir',whatsapp:'Enviar por WhatsApp',linkHint:'Cualquiera con este enlace puede ver el proyecto (no tus costos). Mándalo solo al cliente.',
 duplicate:'Duplicar como plantilla',dupOk:'Proyecto duplicado',deleteP:'Eliminar proyecto',deleteConfirm:'Escribe ELIMINAR para borrar este proyecto y todo su contenido.',
 saved:'Guardado',saving:'Guardando…',removed:'Eliminado',undo:'Deshacer',category:'Categoría',unit:'Unidad',datePaid:'Fecha de compra',
 sampleNote:'Proyecto de ejemplo: cámbialo o bórralo.',kind:'Tipo',copySuffix:'(copia)',matPriv:'El cliente ve el material y si ya se compró, pero no su costo.',noCat:'Sin categoría',clientTab:'Cliente y proyecto',editClient:'Editar datos del cliente',npStep1:'Cliente',npStep2:'Proyecto',npStep3:'Detalles',fullName:'Nombre completo',phone1:'Teléfono',phone2:'Otro teléfono (opcional)',projAddress:'Dirección de la obra',service:'Tipo de trabajo',details:'Detalles del proyecto',detailsHint:'Qué quiere el cliente, medidas, materiales, colores, horarios de acceso. El cliente ve este texto en su página y aparece en el contrato.',detailsPh:'Ej. Deck de composite de 20 x 16 pies con escalones al jardín, color gris. Acceso por el portón del lado derecho.',required:'Obligatorio',errName:'Escribe el nombre completo del cliente.',errPhone:'Escribe un teléfono de 10 dígitos.',errEmail:'Escribe un correo válido, como nombre@gmail.com.',errTitle:'Escribe un nombre para el proyecto.',titleAuto:'Si lo dejas vacío, usamos el tipo de trabajo y el nombre del cliente.',clientCard:'Datos del cliente',clientCardSub:'Para llamarle, mandarle mensajes y correos, y para el contrato.',projCard:'Datos del proyecto',call:'Llamar',textMsg:'Texto',mail:'Correo',edit:'Editar',aboutProject:'Sobre tu proyecto',fixedField:'No se guardó: revisa el dato.',optional:'opcional',svc_pergola:'Pérgola',svc_deck:'Deck',svc_tile:'Azulejo y regaderas',svc_kitchen:'Cocina y backsplash',svc_flooring:'Pisos',svc_basement:'Sótano',svc_remodel:'Remodelación',svc_repair:'Reparación',svc_framing:'Estructura y ampliación',svc_other:'Otro',shareT:'Compartir con el cliente',shareS:'El cliente ve su avance, estimado, pagos, fotos y documentos con este enlace.',sms:'Mensaje de texto',noPhone:'Agrega el teléfono del cliente en Cliente y proyecto para mandarlo directo.',shareMsg:'Hola {n}, aquí puedes ver el avance de tu proyecto con C Plus: ',upSigned:'Subir PDF firmado',dlSigned:'Descargar firmado',dlOriginal:'Descargar original',upDoc:'Subir un documento (PDF)',upDocHint:'Para un contrato o estimado firmado en papel o en DocuSign. Queda guardado aquí y el cliente lo puede descargar.',upKind:'Tipo de documento',signedFile:'PDF firmado guardado',uploadedDoc:'Documento subido',pdfOnly:'Sube un archivo PDF de máximo 20 MB.',savedSigned:'PDF firmado guardado. El cliente ya lo puede descargar.',share:'Comisión',shareOf:'del contrato sin impuesto',sharePct:'Comisión del socio %',shareHint:'Porcentaje del contrato final sin impuesto (materiales + mano de obra + cambios aprobados). Se gana conforme el cliente paga.',shareEarned:'Comisión ganada',shareEarnedSub:'según lo que el cliente ha pagado',sharePending:'Comisión por cobrar',profitAfter:'Ganancia después de comisión',shareByProject:'Comisión por proyecto',docs:'Documentos',docsSub:'Estimado, contrato y terminación del proyecto en PDF.',contractData:'Datos de la empresa para contratos',contractDataSub:'Utah pide el nombre legal, el número de licencia DOPL y la dirección en cada contrato con un propietario.',legalName:'Nombre legal de la empresa',licenseNo:'Número de licencia DOPL',bizAddress:'Dirección de la empresa',warranty:'Garantía (texto del contrato)',warrantyHint:'Ej. Garantizamos la mano de obra por 1 año desde la terminación. Si lo dejas vacío, el contrato deja una línea para llenarla.',extraTerms:'Condiciones adicionales (opcional)',docLang:'Idioma del documento',dlEstimate:'Descargar estimado (PDF)',mkContract:'Crear contrato',mkCompletion:'Crear documento de terminación',doc_estimate:'Estimado',doc_contract:'Contrato',doc_completion:'Terminación y estado de cuenta final',ds_draft:'Borrador',ds_sent:'Enviado al cliente',ds_signed:'Firmado',ds_void:'Anulado',signedBy:'Firmado por',signedOn:'Fecha de firma',download:'Descargar PDF',legalNote:'El contrato es una plantilla general, no asesoría legal. Revísalo con un abogado de Utah antes de usarlo, incluido el aviso de protección contra gravámenes (Utah Admin. Code R156-38a-108).',missingFor:'Para el contrato faltan',contractBanner:'El estimado fue aceptado. Crea el contrato para enviarlo a firmar.',goDocs:'Ir a documentos',docMade:'Documento creado y descargado',noContractYet:'Aún no hay contrato: la terminación usará el estimado actual como monto original.',docsClient:'Tus documentos del proyecto.',docsHint:'El cliente ve el documento en su página cuando lo marcas como Enviado o Firmado.',newProjectT:'Nuevo proyecto',ptitleEx:'Ej. Deck y pérgola, familia López',create:'Crear proyecto',cancel:'Cancelar',noneInStatus:'No hay proyectos con este estado.',leads:'Solicitudes de estimado',leadsSub:'Llegan desde el formulario del sitio web.',lead_new:'Nueva',lead_contacted:'Contactado',lead_won:'Proyecto creado',leadToProject:'Crear proyecto',archive:'Archivar',installT:'Ponlo en tu pantalla de inicio',installS:'En Safari toca Compartir y luego "Agregar a pantalla de inicio". Se abrirá como una app.',hide:'Ocultar',delete:'Eliminar',close:'Cerrar',f_description:'Concepto',f_qty:'Cantidad',f_price:'Precio',f_amount:'Monto',f_label:'Pago programado',f_title:'Título',f_category:'Categoría',f_name:'Material',f_unit:'Unidad',f_body:'Texto del avance',f_vendor:'Tienda',f_note:'Nota',f_spent_on:'Fecha',f_paid_on:'Fecha',f_due_date:'Fecha',f_purchased_on:'Fecha de compra',f_kind:'Tipo',f_status:'Estado',f_budget_id:'Categoría',f_details:'Detalles',f_done:'Hecho',f_purchased:'Comprado',f_tax_rate:'Impuesto',f_client_name:'Nombre completo',f_client_phone:'Teléfono',f_client_phone2:'Otro teléfono',f_client_email:'Correo',f_address:'Dirección de la obra',f_details:'Detalles del proyecto',f_service:'Tipo de trabajo',f_start_date:'Inicio',f_end_date:'Entrega estimada',f_share_pct:'Comisión %',rotate:'Crear enlace nuevo',rotateHint:'Si el enlace llegó a otra persona, crea uno nuevo. El anterior deja de funcionar.',rotated:'Enlace nuevo creado. Mándaselo al cliente.',tooMany:'Mandaste muchos mensajes seguidos. Intenta en unos minutos.',saveFail:'No se pudo guardar. Revisa tu conexión e intenta otra vez.'
},
en: {
 client:'Client',contractor:'Contractor',thanks:'Thank you for trusting us',dream:'Your dream is our dream',enter:'See my project',skip:'Skip',
 overview:'Overview',estimate:'Estimate',pays:'Payments',changes:'Changes',materials:'Materials',steps:'Steps',updates:'Updates',messages:'Messages',
 done:'complete',start:'Start',end:'Estimated completion',st_estimate_sent:'Estimate sent',st_estimate_accepted:'Estimate accepted',st_progress:'In progress',st_done:'Completed',st_planning:'Estimate sent',st_paused:'In progress',
 total:'Project total',labor:'Labor',subtotal:'Subtotal',taxMat:'Tax on materials',desc:'Description',qty:'Qty',price:'Price',amount:'Amount',
 paidSoFar:'You have paid',remaining:'Still due',paidPct:'of the total paid',history:'Payment history',date:'Date',note:'Note',amt:'Amount',
 schedule:'Payment schedule',ms_paid:'Paid',ms_next:'Next payment',ms_later:'Upcoming',coveredOf:'covered of',
 estSub:'Quoted work, line by line.',paySub:'What you have paid and what is still due.',matSub:'Everything your project needs and what we already bought.',
 all:'All',pending:'To buy',purchased:'Purchased',stepsSub:'What we have done and what comes next.',taken:'Steps completed',next:'Steps remaining',
 updSub:'Notes and photos from the crew about your project.',contact:'Questions? Contact us',none:'Nothing here yet.',
 changesSub:'Extra work or changes to the estimate. Approved ones are added to the total.',co_draft:'Draft',co_pending:'Waiting for approval',co_approved:'Approved',co_declined:'Declined',
 approve:'Approve',decline:'Decline',yourName:'Your name',nameNeeded:'Type your name to sign.',by:'by',
 msgSub:'Write to us here. We will answer as soon as we can.',send:'Send',writeMsg:'Write your message',you:'You',
 printEst:'Print / PDF estimate',signClient:'Client signature',signContractor:'Contractor signature',prepared:'Prepared for',estNo:'Estimate',
 noLink:'Use the link your contractor sent you to see your project.',notFound:'We could not find this project. Check the link.',loading:'Loading…',
 refresh:'Refresh',error:'Something went wrong',retry:'Try again',
 login:'Sign in',email:'Email',password:'Password',loginT:'Contractor panel',loginS:'Sign in with your C Plus account.',logout:'Sign out',
 setupT:'The database is not connected yet',setupS:'Open config.js and paste your Supabase project URL and key. The steps are in the README.',
 projects:'Projects',newProject:'+ New project',sampleProject:'Create sample project',allProjects:'All projects',
 contracts:'Contracts',collected:'Collected',receivable:'Still to collect',spent:'Spent',profit:'Estimated profit',budget:'Cost budget',left:'Budget left',
 profitSub:'Contract before tax minus spending',contract:'Contract (client)',thisWeek:'Next 14 days',noUpcoming:'No steps scheduled.',
 unread:'new messages',settings:'Company details',company:'Company',cname:'Contact',phone:'Phone',
 dash:'Dashboard',money:'Budget and expenses',progress:'Progress',project:'Project',back:'← Projects',
 logBuy:'Log a purchase or expense',logPay:'Log a client payment',store:'Store / paid to',cat:'Category',linkMat:'Mark material as purchased',noMat:'None',register:'Log it',
 buyOk:'Expense logged',payOk:'Payment logged',addCat:'+ Add category',expLog:'Expense log',of:'of',over:'Over budget',byCat:'Budget by category',recent:'Recent purchases and expenses',
 receipt:'Receipt',addReceipt:'Upload receipt',viewReceipt:'View receipt',
 addItem:'+ Add line item',addMat:'+ Add material',addStep:'+ Add step',addMs:'+ Add scheduled payment',addCo:'+ New change',
 postUpd:'Post update',newUpd:'Write an update for the client',addPhotos:'Add photos',photosSel:'photos ready',uploading:'Uploading…',
 sendClient:'Send to client',coHint:'Drafts are hidden from the client. Once sent, the client can approve or decline it.',
 msHint:'Each payment status is worked out automatically from what the client has paid.',scheduleTotal:'Schedule total',
 reply:'Reply',
 projInfo:'Project details',clientName:'Client',clientPhone:'Client phone',clientEmail:'Client email',ptitle:'Project',address:'Address',status:'Status',taxp:'Tax % (materials)',
 clientLink:'Client private link',copy:'Copy',copied:'Copied',open:'Open',whatsapp:'Send on WhatsApp',linkHint:'Anyone with this link can see the project (not your costs). Send it only to the client.',
 duplicate:'Duplicate as template',dupOk:'Project duplicated',deleteP:'Delete project',deleteConfirm:'Type DELETE to erase this project and everything in it.',
 saved:'Saved',saving:'Saving…',removed:'Removed',undo:'Undo',category:'Category',unit:'Unit',datePaid:'Purchase date',
 sampleNote:'Sample project: change it or delete it.',kind:'Type',copySuffix:'(copy)',matPriv:'The client sees each material and whether it was bought, not its cost.',noCat:'No category',clientTab:'Client and project',editClient:'Edit client details',npStep1:'Client',npStep2:'Project',npStep3:'Details',fullName:'Full name',phone1:'Phone',phone2:'Other phone (optional)',projAddress:'Job site address',service:'Type of work',details:'Project details',detailsHint:'What the client wants, measurements, materials, colors, access times. The client sees this text on their page and it appears in the contract.',detailsPh:'E.g. 20 x 16 ft composite deck with steps to the yard, gray color. Access through the right side gate.',required:'Required',errName:'Type the client\'s full name.',errPhone:'Type a 10 digit phone number.',errEmail:'Type a valid email, like name@gmail.com.',errTitle:'Type a name for the project.',titleAuto:'If left empty, we use the type of work and the client name.',clientCard:'Client details',clientCardSub:'To call, text and email them, and for the contract.',projCard:'Project details',call:'Call',textMsg:'Text',mail:'Email',edit:'Edit',aboutProject:'About your project',fixedField:'Not saved: check the value.',optional:'optional',svc_pergola:'Pergola',svc_deck:'Deck',svc_tile:'Tile and showers',svc_kitchen:'Kitchen and backsplash',svc_flooring:'Flooring',svc_basement:'Basement',svc_remodel:'Remodel',svc_repair:'Repair',svc_framing:'Framing and addition',svc_other:'Other',shareT:'Share with the client',shareS:'With this link the client sees their progress, estimate, payments, photos and documents.',sms:'Text message',noPhone:'Add the client phone in Client and project to send it directly.',shareMsg:'Hi {n}, here you can follow your project with C Plus: ',upSigned:'Upload signed PDF',dlSigned:'Download signed',dlOriginal:'Download original',upDoc:'Upload a document (PDF)',upDocHint:'For a contract or estimate signed on paper or in DocuSign. It is kept here and the client can download it.',upKind:'Document type',signedFile:'Signed PDF saved',uploadedDoc:'Uploaded document',pdfOnly:'Upload a PDF file of 20 MB at most.',savedSigned:'Signed PDF saved. The client can download it now.',share:'Commission',shareOf:'of the contract before tax',sharePct:'Partner commission %',shareHint:'Percent of the final contract before tax (materials + labor + approved changes). It is earned as the client pays.',shareEarned:'Commission earned',shareEarnedSub:'based on what the client has paid',sharePending:'Commission still to collect',profitAfter:'Profit after commission',shareByProject:'Commission by project',docs:'Documents',docsSub:'Estimate, contract and project completion as PDF.',contractData:'Company details for contracts',contractDataSub:'Utah requires the legal name, DOPL license number and address in every contract with a homeowner.',legalName:'Company legal name',licenseNo:'DOPL license number',bizAddress:'Company address',warranty:'Warranty (contract text)',warrantyHint:'E.g. We warranty our workmanship for 1 year from completion. If left empty, the contract leaves a line to fill in.',extraTerms:'Additional terms (optional)',docLang:'Document language',dlEstimate:'Download estimate (PDF)',mkContract:'Create contract',mkCompletion:'Create completion document',doc_estimate:'Estimate',doc_contract:'Contract',doc_completion:'Completion and final statement',ds_draft:'Draft',ds_sent:'Sent to client',ds_signed:'Signed',ds_void:'Void',signedBy:'Signed by',signedOn:'Signed on',download:'Download PDF',legalNote:'The contract is a general template, not legal advice. Have a Utah attorney review it before use, including the lien protection notice (Utah Admin. Code R156-38a-108).',missingFor:'Missing for the contract',contractBanner:'The estimate was accepted. Create the contract to send it for signature.',goDocs:'Go to documents',docMade:'Document created and downloaded',noContractYet:'No contract yet: the completion document will use the current estimate as the original amount.',docsClient:'Your project documents.',docsHint:'The client sees the document on their page once you mark it Sent or Signed.',newProjectT:'New project',ptitleEx:'E.g. Deck and pergola, López family',create:'Create project',cancel:'Cancel',noneInStatus:'No projects with this status.',leads:'Estimate requests',leadsSub:'They come from the website form.',lead_new:'New',lead_contacted:'Contacted',lead_won:'Project created',leadToProject:'Create project',archive:'Archive',installT:'Put it on your Home Screen',installS:'In Safari tap Share, then "Add to Home Screen". It will open like an app.',hide:'Hide',delete:'Delete',close:'Close',f_description:'Description',f_qty:'Quantity',f_price:'Price',f_amount:'Amount',f_label:'Scheduled payment',f_title:'Title',f_category:'Category',f_name:'Material',f_unit:'Unit',f_body:'Update text',f_vendor:'Store',f_note:'Note',f_spent_on:'Date',f_paid_on:'Date',f_due_date:'Date',f_purchased_on:'Purchase date',f_kind:'Type',f_status:'Status',f_budget_id:'Category',f_details:'Details',f_done:'Done',f_purchased:'Purchased',f_tax_rate:'Tax',f_client_name:'Full name',f_client_phone:'Phone',f_client_phone2:'Other phone',f_client_email:'Email',f_address:'Job site address',f_details:'Project details',f_service:'Type of work',f_start_date:'Start',f_end_date:'Estimated completion',f_share_pct:'Commission %',rotate:'Create a new link',rotateHint:'If the link reached someone else, create a new one. The old one stops working.',rotated:'New link created. Send it to the client.',tooMany:'You sent many messages in a row. Try again in a few minutes.',saveFail:'Could not save. Check your connection and try again.'
}};
let L = 'es';
try { L = localStorage.getItem('cplus-lang') || ((navigator.language || 'es').startsWith('es') ? 'es' : 'en'); } catch (_) {}
Object.assign(T.es, {role_admin:'Admin',role_manager:'Project manager',role_contractor:'Contratista',assignedTo:'Asignado a',unassigned:'Sin asignar',everyone:'Todos',team:'Equipo',teamSub:'Cada persona entra con su correo y contraseña. Los contratistas solo ven los proyectos que les asignan, sin precios ni pagos.',addMember:'Agregar persona',memberName:'Nombre',tempPass:'Contraseña temporal',roleL:'Rol',removeM:'Quitar',resetPw:'Nueva contraseña',you:'tú',myAccount:'Mi cuenta',changePw:'Cambiar mi contraseña',newPw:'Contraseña nueva (8 o más)',pwSaved:'Contraseña cambiada.',pwShort:'La contraseña necesita 8 caracteres o más.',firstT:'Crear la cuenta del admin',firstS:'Solo se hace una vez. Usa el código de configuración que te dieron.',setupCode:'Código de configuración',createAdmin:'Crear admin y entrar',firstLink:'¿Primera vez? Crear la cuenta del admin',noAccessT:'Tu cuenta no tiene acceso',noAccessS:'Pídele al admin de C Plus que te agregue al equipo.',myProjects:'Mis proyectos',info:'Datos del trabajo',noAssigned:'Todavía no tienes proyectos asignados.',removeConfirm:'¿Quitar a {n} del equipo? Ya no podrá entrar y sus proyectos quedarán sin asignar.',errExists:'Ya existe una cuenta con ese correo.',errCode:'El código no es correcto.',errDone:'El admin ya fue creado. Entra con tu correo.',sendCreds:'Mándale estos datos',credsMsg:'Hola {n}, ya tienes cuenta en C Plus. Entra aquí: {u}\nCorreo: {e}\nContraseña temporal: {p}\nCámbiala en "Mi cuenta" al entrar.',nextStep:'Siguiente paso',openMaps:'Abrir en mapas',done2:'Listo'});
Object.assign(T.en, {role_admin:'Admin',role_manager:'Project manager',role_contractor:'Contractor',assignedTo:'Assigned to',unassigned:'Unassigned',everyone:'Everyone',team:'Team',teamSub:'Each person signs in with their own email and password. Contractors only see the projects assigned to them, without prices or payments.',addMember:'Add person',memberName:'Name',tempPass:'Temporary password',roleL:'Role',removeM:'Remove',resetPw:'New password',you:'you',myAccount:'My account',changePw:'Change my password',newPw:'New password (8 or more)',pwSaved:'Password changed.',pwShort:'The password needs 8 characters or more.',firstT:'Create the admin account',firstS:'This is done only once. Use the setup code you were given.',setupCode:'Setup code',createAdmin:'Create admin and sign in',firstLink:'First time? Create the admin account',noAccessT:'Your account has no access',noAccessS:'Ask the C Plus admin to add you to the team.',myProjects:'My projects',info:'Job details',noAssigned:'You have no assigned projects yet.',removeConfirm:'Remove {n} from the team? They will not be able to sign in and their projects will be unassigned.',errExists:'There is already an account with that email.',errCode:'The code is not correct.',errDone:'The admin already exists. Sign in with your email.',sendCreds:'Send them these details',credsMsg:'Hi {n}, you now have a C Plus account. Sign in here: {u}\nEmail: {e}\nTemporary password: {p}\nChange it in "My account" after you sign in.',nextStep:'Next step',openMaps:'Open in maps',done2:'Done'});
const S = window.CPLUS = {
  get L() { return L; },
  setLang(x) { L = x; try { localStorage.setItem('cplus-lang', x); } catch (_) {} document.documentElement.lang = x; },
  t: k => T[L][k] || T.es[k] || k,
  esc: v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
  money: n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(+n || 0),
  today() { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); },
  fdate(d) { if (!d) return ''; const x = new Date(String(d).length <= 10 ? d + 'T12:00' : d); return isNaN(x) ? d : x.toLocaleDateString(L === 'es' ? 'es-MX' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }); },
  uid: () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2))
};
const t = S.t;

/* phones: keep digits, show (801) 555-0134 for US numbers */
S.fmtPhone = v => { const d = String(v || '').replace(/\D/g, '').replace(/^1(?=\d{10}$)/, ''); return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : String(v || '').trim(); };
S.phoneOk = v => /^1?\d{10}$/.test(String(v || '').replace(/\D/g, ''));
S.emailOk = v => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(v || '').trim());
S.intl = v => { const d = String(v || '').replace(/\D/g, ''); return d.length === 10 ? '1' + d : d; };
S.SERVICES = ['pergola', 'deck', 'tile', 'kitchen', 'flooring', 'basement', 'remodel', 'repair', 'other'];
S.MARK = (c = '') => `<svg class="mk ${c}" viewBox="-80 -80 160 160" aria-hidden="true"><g class="towers"><path d="M-40,-23 L-28,-30 V8 H-40 Z" fill="#7c4604"/><path d="M-28,-30 L-12,-22 V8 H-28 Z" fill="#ec9c3b"/><path d="M-14,-54 L0,-62 V8 H-14 Z" fill="#7c4604"/><path d="M0,-62 L26,-50 V8 H0 Z" fill="#ec9c3b"/><path d="M5,-52 V2 M11,-49 V2 M17,-46 V2 M-23,-23 V2 M-18,-21 V2" stroke="#f7e9d4" stroke-width="2.2"/></g><path class="roof" d="M-78,38 L-46,13 L-16,22" fill="none" stroke="#ec9c3b" stroke-width="7" stroke-linejoin="round"/><path class="roof" d="M16,22 L46,13 L78,38" fill="none" stroke="#ec9c3b" stroke-width="7" stroke-linejoin="round"/><path class="roof" d="M-36,44 L0,16 L36,44" fill="none" stroke="#9a5a0e" stroke-width="9" stroke-linejoin="round"/><path d="M-6,30 h12 v12 h-12 Z M0,30 v12 M-6,36 h12" fill="#ec9c3b" stroke="#110f0d" stroke-width="1.5"/></svg>`;
S.WORD = (c = '') => `<svg class="wm" viewBox="0 0 340 92" aria-label="C Plus LLC"><text x="170" y="52" text-anchor="middle" font-family="Bricolage Grotesque, Barlow Semi Condensed, sans-serif" font-weight="800" font-size="58" fill="#f3ece3" letter-spacing="2">C<tspan fill="#ec9c3b">+</tspan>PLUS</text><text x="170" y="82" text-anchor="middle" font-family="Montserrat, sans-serif" font-weight="700" font-size="13" letter-spacing="9" fill="#d9a15a">LLC</text></svg>`;
S.langSeg = () => `<div class="seg" role="group" aria-label="Language"><button data-lang="es" aria-pressed="${L === 'es'}">ES</button><button data-lang="en" aria-pressed="${L === 'en'}">EN</button></div>`;
S.header = (extra = '', badge = '') => `<header class="top"><div class="wrap"><div class="brand">${S.MARK('h')}<div><b>C PLUS</b>${badge}<small>${L === 'es' ? 'Remodelación' : 'Remodeling'}</small></div></div>${extra}${S.langSeg()}</div></header>`;

S.splash = function () {
  const d = document.createElement('div'); d.id = 'splash'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'C Plus');
  d.innerHTML = `<button class="skip">${t('skip')}</button><div>${S.MARK('s')}<div>${S.WORD('s')}</div><h2>${t('thanks')}</h2><p>${t('dream')}</p><button class="primary enter">${t('enter')}</button></div>`;
  document.body.appendChild(d);
  d.setAttribute('aria-modal', 'true');
  const close = () => { removeEventListener('keydown', key); d.classList.add('out'); setTimeout(() => d.remove(), 700); document.querySelector('main, .tabs button, h1')?.focus?.(); };
  const key = e => { if (e.key === 'Escape') close(); };
  addEventListener('keydown', key);
  d.querySelector('.skip').onclick = close; d.querySelector('.enter').onclick = close; d.querySelector('.skip').focus();
};

/* totals: approved change orders join the estimate, tax only on materials */
S.calc = function (b) {
  const lt = i => (+i.qty || 0) * (+i.price || 0), p = b.project;
  const ok = (b.change_orders || []).filter(c => c.status === 'approved');
  const subM = b.items.filter(i => i.kind !== 'lab').reduce((a, i) => a + lt(i), 0) + ok.filter(c => c.kind !== 'lab').reduce((a, c) => a + (+c.amount || 0), 0);
  const subL = b.items.filter(i => i.kind === 'lab').reduce((a, i) => a + lt(i), 0) + ok.filter(c => c.kind === 'lab').reduce((a, c) => a + (+c.amount || 0), 0);
  const sub = subM + subL, tax = subM * (+p.tax_rate || 0) / 100, tot = sub + tax;
  const paid = b.payments.reduce((a, x) => a + (+x.amount || 0), 0);
  const sd = b.steps.filter(s => s.done).length, mb = b.materials.filter(m => m.purchased).length;
  const r = { lt, subM, subL, sub, tax, tot, paid, bal: tot - paid, sd, mb, pct: b.steps.length ? Math.round(sd / b.steps.length * 100) : 0, coOk: ok };
  if (b.budget) {
    r.bud = b.budget.reduce((a, x) => a + (+x.amount || 0), 0);
    r.spent = (b.expenses || []).reduce((a, x) => a + (+x.amount || 0), 0);
    r.left = r.bud - r.spent; r.profit = sub - r.spent;
    r.byCat = id => (b.expenses || []).filter(e => e.budget_id === id).reduce((a, e) => a + (+e.amount || 0), 0);
    r.noCat = r.byCat(null) + (b.expenses || []).filter(e => e.budget_id === undefined).reduce((a, e) => a + (+e.amount || 0), 0);
  }
  let cum = 0, nextSet = false;
  r.ms = (b.milestones || []).slice().sort((a, b) => (a.sort || 0) - (b.sort || 0)).map(m => {
    const before = cum; cum += +m.amount || 0;
    let st = 'later'; if (paid >= cum - 0.005) st = 'paid'; else if (!nextSet) { st = 'next'; nextSet = true; }
    return { ...m, st, covered: Math.max(0, Math.min(+m.amount || 0, paid - before)) };
  });
  r.msTotal = cum;
  return r;
};

S.toast = function (msg, undo) {
  document.querySelector('.toast')?.remove();
  const d = document.createElement('div'); d.className = 'toast'; d.setAttribute('role', 'status');
  d.innerHTML = `<span>${S.esc(msg)}</span>${undo ? `<button>${t('undo')}</button>` : ''}`;
  document.body.appendChild(d);
  if (undo) d.querySelector('button').onclick = () => { d.remove(); undo(); };
  clearTimeout(S._tt); S._tt = setTimeout(() => d.remove(), 5000);
};

/* shrink phone photos before uploading */
S.compress = function (file, max = 1600, q = .82) {
  return new Promise((res) => {
    if (!/^image\//.test(file.type) || /gif|svg/.test(file.type)) return res(file);
    const img = new Image(), u = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
      c.toBlob(b => res(b || file), 'image/jpeg', q);
    };
    img.onerror = () => { URL.revokeObjectURL(u); res(file); };
    img.src = u;
  });
};

S.photos = (paths) => paths && paths.length ? `<div class="photos">${paths.map(p => { const u = API.photoUrl(p); return `<button class="ph" data-photo="${S.esc(u)}" aria-label="${t('open')}"><img src="${S.esc(u)}" alt="" loading="lazy"></button>`; }).join('')}</div>` : '';
S.lightbox = function (url) {
  const d = document.createElement('div'); d.className = 'lb'; d.setAttribute('role', 'dialog');
  const back = document.activeElement;
  d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', t('updates'));
  d.innerHTML = `<img src="${S.esc(url)}" alt=""><button class="ghost" aria-label="${t('close')}">✕</button>`;
  const close = () => { d.remove(); removeEventListener('keydown', key); back && back.focus && back.focus(); };
  const key = e => { if (e.key === 'Escape' || e.key === 'Tab') { e.preventDefault(); if (e.key === 'Escape') close(); } };
  d.onclick = close; addEventListener('keydown', key); document.body.appendChild(d); d.querySelector('button').focus();
};

/* printable estimate (browser print dialog saves it as PDF) */
S.printEstimate = function (b, contact) {
  const c = S.calc(b), p = b.project, e = S.esc, m = S.money;
  const rows = k => b.items.filter(i => (i.kind === 'lab') === (k === 'lab')).map(i => `<tr><td>${e(i.description)}</td><td class="n">${e(i.qty)}</td><td class="n">${m(i.price)}</td><td class="n">${m(c.lt(i))}</td></tr>`).join('');
  const k = contact || {};
  const html = `<div class="pv-head">${S.MARK('p')}<div>${S.WORD('p')}</div><div class="pv-co"><b>${e(k.company || 'C Plus LLC')}</b><br>${e(k.name || k.contact_name || '')}<br>${e(k.phone || '')}<br>${e(k.email || '')}</div></div>
  <h1>${t('estNo')}: ${e(p.title)}</h1><p>${t('prepared')}: <b>${e(p.client_name)}</b><br>${e(p.address)}<br>${t('date')}: ${S.fdate(S.today())}</p>
  <h2>${t('materials')}</h2><table><thead><tr><th>${t('desc')}</th><th class="n">${t('qty')}</th><th class="n">${t('price')}</th><th class="n">${t('amount')}</th></tr></thead><tbody>${rows('mat') || `<tr><td colspan="4">${t('none')}</td></tr>`}</tbody></table>
  <h2>${t('labor')}</h2><table><thead><tr><th>${t('desc')}</th><th class="n">${t('qty')}</th><th class="n">${t('price')}</th><th class="n">${t('amount')}</th></tr></thead><tbody>${rows('lab') || `<tr><td colspan="4">${t('none')}</td></tr>`}</tbody></table>
  ${c.coOk.length ? `<h2>${t('changes')}</h2><table><tbody>${c.coOk.map(x => `<tr><td>${e(x.title)} (${x.kind === 'lab' ? t('labor') : t('materials')})</td><td class="n">${m(x.amount)}</td></tr>`).join('')}</tbody></table>` : ''}
  <table class="tots"><tr><td>${t('materials')}</td><td class="n">${m(c.subM)}</td></tr><tr><td>${t('labor')}</td><td class="n">${m(c.subL)}</td></tr><tr><td>${t('taxMat')} (${e(p.tax_rate)}%)</td><td class="n">${m(c.tax)}</td></tr><tr class="g"><td>${t('total')}</td><td class="n">${m(c.tot)}</td></tr><tr><td>${t('paidSoFar')}</td><td class="n">${m(c.paid)}</td></tr><tr class="g"><td>${t('remaining')}</td><td class="n">${m(c.bal)}</td></tr></table>
  ${c.ms.length ? `<h2>${t('schedule')}</h2><table><tbody>${c.ms.map(x => `<tr><td>${e(x.label)}</td><td>${t('ms_' + x.st)}</td><td class="n">${m(x.amount)}</td></tr>`).join('')}</tbody></table>` : ''}
  <div class="sig"><div>${t('signClient')}</div><div>${t('signContractor')}</div></div>`;
  let pv = document.getElementById('pv'); if (!pv) { pv = document.createElement('div'); pv.id = 'pv'; document.body.appendChild(pv); }
  pv.innerHTML = html; document.body.classList.add('printing');
  const done = () => { document.body.classList.remove('printing'); removeEventListener('afterprint', done); };
  addEventListener('afterprint', done);
  setTimeout(() => { try { print(); } catch (_) { done(); } }, 60);
};
})();
