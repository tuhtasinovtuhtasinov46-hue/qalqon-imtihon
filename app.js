
// ===== TELEGRAM BOT SETTINGS =====
// Бесплатный вариант: создайте бота через @BotFather, получите TOKEN.
// Узнайте CHAT_ID через @userinfobot или через getUpdates.
// ВАЖНО: если сайт будет полностью статическим, TOKEN будет виден в коде сайта.
// Для публичного большого проекта лучше использовать маленький backend/proxy.
const TELEGRAM_BOT_TOKEN = '8553152617:AAFmwLVu_dK4k0pumOO9tQI9lJ2AHr8avgE';
const TELEGRAM_CHAT_ID = '8871797673';

async function sendResultToTelegram(payload){
  if(!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN.includes('PASTE_') || !TELEGRAM_CHAT_ID || TELEGRAM_CHAT_ID.includes('PASTE_')){
    console.warn('Telegram не настроен: вставьте TOKEN и CHAT_ID в app.js');
    return {ok:false, skipped:true};
  }
  const text = [
    '🛡 QALQON IMTIHON — новый результат',
    '',
    `👤 ФИО: ${payload.reg.fio}`,
    `📞 Телефон: ${payload.reg.phone}`,
    `📅 Дата тестирования: ${payload.reg.date}`,
    `📝 Вариант: ${payload.variant}`,
    '',
    `✅ Правильных: ${payload.res.correct}`,
    `❌ Неправильных: ${payload.res.wrong}`,
    `📊 Процент: ${payload.res.percent}%`,
    `⏱ Время: ${fmt(payload.seconds)}`,
    '',
    `🕒 Завершено: ${new Date().toLocaleString('ru-RU')}`
  ].join('\n');
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  try{
    const r = await fetch(url, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({chat_id: TELEGRAM_CHAT_ID, text, parse_mode:'HTML'})
    });
    return await r.json();
  }catch(err){
    console.error('Telegram send error', err);
    return {ok:false,error:String(err)};
  }
}

const $=s=>document.querySelector(s);let currentVariant=null, qIndex=0, answers=[], startedAt=0, seconds=0, timerId=null, reg={};
const grid=$('#variantGrid');VARIANTS.forEach(v=>{const d=document.createElement('div');d.className='variant';d.innerHTML=`<b>${v.title}</b><p>22 вопроса, включая 2 аудио-задания с двумя частями.</p>`;d.onclick=()=>startVariant(v.id);grid.appendChild(d)});$('#testDate').value=new Date().toISOString().slice(0,10);
function startVariant(id){currentVariant=VARIANTS.find(v=>v.id===id);qIndex=0;answers=currentVariant.questions.map(q=>q.type==='audioPair'?[null,null]:null);$('#testPanel').classList.remove('hidden');$('#resultBlock').classList.add('hidden');$('#regForm').classList.remove('hidden');$('#quiz').classList.add('hidden');$('#testTitle').textContent=currentVariant.title;location.hash='testPanel'}
$('#backBtn').onclick=()=>{stopTimer();$('#testPanel').classList.add('hidden');location.hash='variants'};
$('#regForm').onsubmit=e=>{e.preventDefault();reg={fio:$('#fio').value.trim(),phone:$('#phone').value.trim(),date:$('#testDate').value};$('#regForm').classList.add('hidden');$('#quiz').classList.remove('hidden');startedAt=Date.now();seconds=0;timerId=setInterval(()=>{seconds=Math.floor((Date.now()-startedAt)/1000);$('#timer').textContent=fmt(seconds)},1000);renderNav();renderQ()};
function fmt(s){return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
function stopTimer(){if(timerId)clearInterval(timerId);timerId=null}
function renderNav(){const nav=$('#questionNav');nav.innerHTML='';currentVariant.questions.forEach((q,i)=>{let b=document.createElement('button');b.textContent=i+1;b.className=(i===qIndex?'current ':'')+(isAnswered(i)?'answered':'');b.onclick=()=>{qIndex=i;renderQ();renderNav()};nav.appendChild(b)})}
function isAnswered(i){const a=answers[i];return Array.isArray(a)?a.every(x=>x!==null):a!==null}
function renderQ(){const q=currentVariant.questions[qIndex], box=$('#questionBox');$('#progressText').textContent=`Вопрос ${qIndex+1} из ${currentVariant.questions.length}`;$('#progressBar').style.width=((qIndex+1)/currentVariant.questions.length*100)+'%';let html=`<div class="qcard"><div class="qtype">${q.label}</div>`;
 if(q.type==='single'){html+=`<h3>${q.text}</h3>`+q.options.map((o,i)=>`<label class="option"><input type="radio" name="ans" value="${i}" ${answers[qIndex]===i?'checked':''}> ${o}</label>`).join('')}
 if(q.type==='audioPair'){html+=`<h3>Прослушайте аудио и ответьте на две части вопроса</h3><div class="audioBox"><button class="btn" onclick="speakAudio();return false">▶ Прослушать мужским голосом</button><p class="audioText">Голос читает задание. Для настоящего дикторского качества можно заменить на mp3-файлы.</p></div>`;q.parts.forEach((p,pi)=>{html+=`<div class="part"><b>Часть ${pi+1}. ${p.text}</b>`+p.options.map((o,i)=>`<label class="option"><input type="radio" name="ans${pi}" value="${i}" ${answers[qIndex][pi]===i?'checked':''}> ${o}</label>`).join('')+`</div>`})}
 html+='</div>';box.innerHTML=html;box.querySelectorAll('input').forEach(inp=>inp.onchange=saveAnswer);$('#prevQ').disabled=qIndex===0;$('#nextQ').textContent=qIndex===currentVariant.questions.length-1?'Проверить':'Далее'}
window.speakAudio=function(){const q=currentVariant.questions[qIndex];if(!q||q.type!=='audioPair')return; speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(q.audioText);u.lang='ru-RU';u.rate=.85;u.pitch=.8;const voices=speechSynthesis.getVoices();const male=voices.find(v=>/male|муж|Yuri|Pavel|Alexander|Google русский/i.test(v.name));if(male)u.voice=male;speechSynthesis.speak(u)};
function saveAnswer(){const q=currentVariant.questions[qIndex];if(q.type==='single'){const c=document.querySelector('input[name="ans"]:checked');answers[qIndex]=c?Number(c.value):null}else{q.parts.forEach((p,pi)=>{const c=document.querySelector(`input[name="ans${pi}"]:checked`);answers[qIndex][pi]=c?Number(c.value):null})}renderNav()}
$('#prevQ').onclick=()=>{if(qIndex>0){qIndex--;renderQ();renderNav()}};$('#nextQ').onclick=()=>{saveAnswer();if(qIndex<currentVariant.questions.length-1){qIndex++;renderQ();renderNav()}else finish()};$('#finishBtn').onclick=()=>finish();
function calc(){let correct=0,total=0,details=[];currentVariant.questions.forEach((q,idx)=>{if(q.type==='single'){total++;let ok=answers[idx]===q.answer;if(ok)correct++;details.push({n:idx+1,text:q.text,user:q.options[answers[idx]]||'Нет ответа',right:q.options[q.answer],ok,explain:q.explain})}else{q.parts.forEach((p,pi)=>{total++;let ok=answers[idx][pi]===p.answer;if(ok)correct++;details.push({n:`${idx+1}.${pi+1}`,text:p.text,user:p.options[answers[idx][pi]]||'Нет ответа',right:p.options[p.answer],ok,explain:q.explain})})}});return{correct,total,wrong:total-correct,percent:Math.round(correct/total*100),details}}
async function finish(){saveAnswer();if(!confirm('Завершить тест и показать результат?'))return;stopTimer();const res=calc();const payload={variant:currentVariant.title,reg,seconds,res,finishedAt:new Date().toISOString()};localStorage.setItem('lastQalqonResult',JSON.stringify(payload));location.hash='resultBlock';showResult(res,'sending');const tg=await sendResultToTelegram(payload);showResult(res,tg.ok?'sent':(tg.skipped?'notConfigured':'error'))}
function showResult(res,tgStatus=''){ $('#testPanel').classList.add('hidden');const block=$('#resultBlock');block.classList.remove('hidden');let tgMsg='';if(tgStatus==='sending')tgMsg='<div class="tg sending">⏳ Отправляем результат администратору в Telegram...</div>';if(tgStatus==='sent')tgMsg='<div class="tg sent">✅ Результат отправлен администратору в Telegram.</div>';if(tgStatus==='notConfigured')tgMsg='<div class="tg warn">⚠️ Telegram пока не настроен. Вставьте TOKEN и CHAT_ID в app.js.</div>';if(tgStatus==='error')tgMsg='<div class="tg error">⚠️ Результат показан, но Telegram не принял отправку. Проверьте TOKEN/CHAT_ID.</div>';block.innerHTML=`<h2>Результат тестирования</h2>${tgMsg}<p>${reg.fio} • ${currentVariant.title} • ${reg.date}</p><div class="summary"><div><b class="ok">${res.correct}</b><p>Правильных</p></div><div><b class="bad">${res.wrong}</b><p>Неправильных</p></div><div><b>${res.percent}%</b><p>Процент</p></div><div><b>${fmt(seconds)}</b><p>Время</p></div></div><div class="actions"><button class="ghost" onclick="downloadCSV()">Скачать CSV</button><button class="btn" onclick="location.reload()">Пройти заново</button></div><div class="review"><h3>Разбор ответов</h3>${res.details.map(d=>`<div class="reviewItem"><b class="${d.ok?'ok':'bad'}">${d.ok?'✓ Правильно':'✕ Неправильно'} — вопрос ${d.n}</b><p>${d.text}</p><p>Ваш ответ: <b>${d.user}</b></p><p>Правильный ответ: <b>${d.right}</b></p><p>${d.explain}</p></div>`).join('')}</div>`;}
window.downloadCSV=function(){const data=JSON.parse(localStorage.getItem('lastQalqonResult')||'{}');const row=[new Date().toLocaleString('ru-RU'),data.reg?.fio||'',data.reg?.phone||'',data.reg?.date||'',data.variant||'',data.res?.correct||0,data.res?.wrong||0,data.res?.percent||0,fmt(data.seconds||0)];const csv='Дата записи;ФИО;Телефон;Дата тестирования;Вариант;Правильных;Неправильных;Процент;Время\n'+row.map(x=>'"'+String(x).replaceAll('"','""')+'"').join(';');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='qalqon-result.csv';a.click()}
speechSynthesis.onvoiceschanged=()=>{};
