const LIFF_ID = "2008714027-cuYvg8O7";
const GAS_URL = "https://script.google.com/macros/s/AKfycbxo-EnKSfJJ7Qc9Yc04v7xewRoq0-FHGFne5xiwlh2MCuxtinHSrTBc54jxKEz9aTek/exec";

let currentIdx = 0, answers = [], lineProfile = null;
let currentSurveyIdx = 0;
let surveyAnswers = {};
let finalS1 = 0, finalS2 = 0;

window.onload = async () => {
  checkLastResult();
  initSurvey(); // アンケート画面を動的に生成
  try {
    await liff.init({ liffId: LIFF_ID });
    if (liff.isLoggedIn()) {
      lineProfile = await liff.getProfile();
      document.getElementById('liff-status').innerText = `${lineProfile.displayName}さん、準備完了`;
      document.getElementById('start-btn').disabled = false;
    } else {
      liff.login();
    }
  } catch (e) {
    document.getElementById('liff-status').innerText = "DEMO MODE (No LINE Connection)";
    document.getElementById('start-btn').disabled = false;
  }
};

// アンケートHTMLの動的生成
function initSurvey() {
  const container = document.getElementById('survey-content');
  container.innerHTML = "";

  surveyQuestions.forEach((q, index) => {
    const stepDiv = document.createElement('div');
    stepDiv.className = `survey-step ${index === 0 ? 'active-step' : ''}`;
    stepDiv.id = `step-${index}`;

    let inputHtml = "";
    if (q.type === "radio") {
      inputHtml = `<div class="grid grid-cols-1 gap-3">` +
        q.options.map(opt => `
          <label class="option-card block p-6 rounded-2xl border border-gray-200 shadow-sm has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50/50">
            <input type="radio" name="survey_${q.id}" value="${opt}" class="hidden">
            <span class="font-bold">${opt}</span>
          </label>`).join('') + `</div>`;
    } else if (q.type === "select") {
      inputHtml = `<div class="relative">
        <select id="survey_${q.id}" class="w-full p-6 bg-white border border-gray-200 rounded-2xl font-bold appearance-none focus:border-blue-500 outline-none shadow-sm text-lg">
          <option value="">${q.placeholder || "選択してください"}</option>
          ${q.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
        </select>
        <div class="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
      </div>`;
    } else if (q.type === "textarea") {
      inputHtml = `<textarea id="survey_${q.id}" class="w-full h-40 p-6 bg-white border border-gray-200 rounded-2xl font-bold focus:border-blue-500 outline-none shadow-inner resize-none text-lg" placeholder="${q.placeholder || ""}"></textarea>`;
    }

    stepDiv.innerHTML = `
      <h3 class="text-xl font-bold ${q.subtitle ? 'mb-2' : 'mb-8'} text-center">${q.title}</h3>
      ${q.subtitle ? `<p class="text-[12px] text-gray-400 text-center mb-8 uppercase tracking-widest font-bold">${q.subtitle}</p>` : ''}
      ${inputHtml}
      <button onclick="nextSurvey(${index})" class="btn-primary w-full mt-10 text-white font-bold py-5 rounded-xl shadow-lg shadow-blue-500/20 text-lg">
        ${index === surveyQuestions.length - 1 ? '回答して結果を見る' : '次へ'}
      </button>
    `;
    container.appendChild(stepDiv);
  });
}

function nextSurvey(index) {
  const qConfig = surveyQuestions[index];
  let value = "";

  if (qConfig.type === "radio") {
    const checked = document.querySelector(`input[name="survey_${qConfig.id}"]:checked`);
    if (qConfig.required && !checked) return alert("項目を選択してください");
    value = checked ? checked.value : "";
  } else if (qConfig.type === "select") {
    value = document.getElementById(`survey_${qConfig.id}`).value;
    if (qConfig.required && !value) return alert("項目を選択してください");
  } else if (qConfig.type === "textarea") {
    value = document.getElementById(`survey_${qConfig.id}`).value;
    if (qConfig.required && !value) return alert("内容を入力してください");
  }

  surveyAnswers[qConfig.id] = value;

  if (index < surveyQuestions.length - 1) {
    document.getElementById(`step-${index}`).classList.remove('active-step');
    document.getElementById(`step-${index + 1}`).classList.add('active-step');
    window.scrollTo(0, 0);
  } else {
    finishSurvey();
  }
}

function finishSurvey() {
  localStorage.setItem('last_kuchi_check', JSON.stringify({
    s1: finalS1, s2: finalS2, answers: answers
  }));
  showResult();
}

function checkLastResult() {
  if (localStorage.getItem('last_kuchi_check')) {
    document.getElementById('resume-btn').classList.remove('hidden');
  }
}

function showLastResult() {
  const last = JSON.parse(localStorage.getItem('last_kuchi_check'));
  if (last) {
    finalS1 = last.s1; finalS2 = last.s2; answers = last.answers;
    showResult(true);
  }
}

function startQuiz() {
  currentIdx = 0; answers = [];
  showPage('page-q');
  updateQuestion();
}

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

function updateQuestion() {
  const q = questions[currentIdx];
  document.getElementById('q-counter').innerText = `${currentIdx + 1} / 20`;
  document.getElementById('progress').style.width = `${((currentIdx + 1) / 20) * 100}%`;
  document.getElementById('q-cat-label').innerText = q.cat;
  document.getElementById('q-text').innerText = q.text;
  document.getElementById('q-image-area').classList.toggle('hidden', !q.hasImage);

  const backBtn = document.getElementById('back-btn');
  currentIdx > 0 ? backBtn.classList.remove('hidden') : backBtn.classList.add('hidden');

  const container = document.getElementById('options-container');
  container.innerHTML = "";
  q.labels.forEach((label, i) => {
    const btn = document.createElement('button');
    btn.className = "option-card w-full p-6 rounded-2xl text-left border border-gray-100 shadow-sm flex justify-between items-center group";
    btn.innerHTML = `<span class="text-lg font-bold text-gray-800">${label}</span><span class="text-blue-500 opacity-0 group-active:opacity-100 transition-opacity">→</span>`;
    btn.onclick = () => {
      answers.push({ ...q, userScore: (i === 0 ? 1 : (i === 1 ? 0.5 : 0)) });
      if (currentIdx < questions.length - 1) {
        currentIdx++;
        updateQuestion();
      } else {
        calculateFinalScores();
      }
    };
    container.appendChild(btn);
  });
}

function prevQuestion() {
  if (currentIdx > 0) {
    currentIdx--; answers.pop();
    updateQuestion();
  }
}

function calculateFinalScores() {
  let s1 = 0, s2 = 0;
  answers.forEach(a => {
    let p = a.userScore * 10;
    a.axis === 1 ? s1 += p : s2 += p;
  });
  finalS1 = Math.round(s1);
  finalS2 = Math.round(s2);
  showPage('page-survey');
}

function showResult(isResume = false) {
  showPage('page-result');
  const adviceSet = [];
  answers.forEach(a => { if (a.userScore >= 0.5) adviceSet.push(a.advice); });

  const renderScore = (score, scoreId, labelId) => {
    const el = document.getElementById(scoreId);
    const lbl = document.getElementById(labelId);
    el.innerText = score;
    if (score <= 40) {
      el.className = "text-5xl text-blue-500";
      lbl.innerText = "安心";
      lbl.className = "text-[12px] font-bold border-blue-200 text-blue-500 bg-blue-50 px-3 py-1 rounded-full";
    } else if (score <= 60) {
      el.className = "text-5xl text-amber-500";
      lbl.innerText = "注意";
      lbl.className = "text-[12px] font-bold border-amber-200 text-amber-600 bg-amber-50 px-3 py-1 rounded-full";
    } else {
      el.className = "text-5xl text-red-500";
      lbl.innerText = "警戒";
      lbl.className = "text-[12px] font-bold border-red-200 text-red-500 bg-red-50 px-3 py-1 rounded-full";
    }
  };

  renderScore(finalS1, 'score-1', 'label-1');
  renderScore(finalS2, 'score-2', 'label-2');

  const msgEl = document.getElementById('result-message');
  msgEl.innerText = finalS2 > 40 ? "お口の中に特定のニオイ原因が隠れている可能性があります。一度、下関市の健診で詳しくチェックしてみませんか？" : "現在は大きなリスクは見られません。日頃の水分補給と清潔なケアを続けていきましょう！";
  msgEl.style.borderColor = finalS2 > 40 ? '#EF4444' : '#007AFF';

  document.getElementById('advice-list').innerHTML = [...new Set(adviceSet)].slice(0, 4).map(adv =>
    `<div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-lg font-bold text-gray-700 flex items-start">
       <span class="w-1 h-6 bg-blue-500 mr-4 rounded-full flex-shrink-0"></span>${adv}
     </div>`
  ).join('');

  const notifContainer = document.getElementById('notification-options');
  notifContainer.innerHTML = [...new Set(adviceSet)].slice(0, 3).map((adv, i) =>
    `<div class="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
       <div class="flex items-center mb-3">
         <input type="checkbox" id="check-${i}" class="w-5 h-5 rounded-full border-gray-300 text-blue-500 focus:ring-blue-500 mr-3 notif-item" value="${adv}" checked>
         <label for="check-${i}" class="text-sm font-bold text-gray-700">${adv}</label>
       </div>
       <div class="flex items-center space-x-2">
         <input type="time" id="time-${i}" value="08:00" class="flex-1 bg-gray-50 p-2 rounded-xl font-bold text-blue-500 outline-none text-sm">
         <button onclick="saveNotification(${i})" class="bg-blue-500 text-white text-[10px] font-bold px-4 py-2 rounded-xl shadow-md active:scale-95 transition-all">保存</button>
       </div>
     </div>`
  ).join('');

  const clinicContainer = document.getElementById('clinic-search-buttons');
  let additionalClinics = "";
  if (finalS2 > 40) {
    if (answers.some(a => a.cat === "消化器" && a.userScore >= 0.5)) additionalClinics += `<a href="https://www.google.com/maps/search/?api=1&query=内科" target="_blank" class="block w-full bg-white border-2 border-gray-200 text-center font-bold py-5 rounded-2xl text-gray-600 transition-all text-lg shadow-sm active:bg-gray-50"> 📍 内科を探す </a>`;
    if (answers.some(a => a.cat === "鼻・喉" && a.userScore >= 0.5)) additionalClinics += `<a href="https://www.google.com/maps/search/?api=1&query=耳鼻咽喉科" target="_blank" class="block w-full bg-white border-2 border-gray-200 text-center font-bold py-5 rounded-2xl text-gray-600 transition-all text-lg shadow-sm active:bg-gray-50"> 📍 耳鼻咽喉科を探す </a>`;
    if (answers.some(a => a.cat === "ホルモン" && a.userScore >= 0.5)) additionalClinics += `<a href="https://www.google.com/maps/search/?api=1&query=婦人科" target="_blank" class="block w-full bg-white border-2 border-gray-200 text-center font-bold py-5 rounded-2xl text-gray-600 transition-all text-lg shadow-sm active:bg-gray-50"> 📍 婦人科を探す </a>`;
  }
  clinicContainer.innerHTML = `<a href="https://www.google.com/maps/search/?api=1&query=歯科医院" target="_blank" class="block w-full bg-white border-2 border-blue-400 text-center font-bold py-5 rounded-2xl text-blue-500 transition-all text-lg shadow-sm active:bg-blue-50">現在地から近くの歯科医院を探す</a>` + additionalClinics;

  if (!isResume) sendData(finalS1, finalS2);
}

async function saveNotification(index) {
  const checkbox = document.getElementById(`check-${index}`);
  const time = document.getElementById(`time-${index}`).value;
  const statusEl = document.getElementById('notif-status');
  if (!checkbox.checked) return alert("通知を有効にするにはチェックを入れてください");
  statusEl.innerText = "設定を保存中...";
  setTimeout(() => { statusEl.innerText = ` 「${checkbox.value}」を毎日 ${time} に予約しました`; }, 800);
}

// 通信エラー対策を追加した送信関数
async function sendData(s1, s2) {
  if (!lineProfile || !GAS_URL) return;
  const data = {
    name: lineProfile.displayName,
    userId: lineProfile.userId,
    s1: s1, s2: s2,
    ...surveyAnswers
  };

  const statusEl = document.getElementById('notif-status');

  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    // 成功したら表示をリセット
    statusEl.innerHTML = "";
    console.log("Data sent successfully");

  } catch (error) {
    console.error("Fetch error:", error);
    
    // ネットワークエラー発生時に「再試行」ボタンを表示
    statusEl.innerHTML = `
      <div class="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex flex-col items-center">
        <p class="text-red-600 text-sm font-bold mb-2">⚠️ 通信エラーが発生しました</p>
        <button onclick="sendData(${s1}, ${s2})" class="bg-red-500 text-white text-xs font-bold px-6 py-2 rounded-full shadow-md active:scale-95 transition-all">
          🔄 再試行
        </button>
      </div>
    `;
  }
}
