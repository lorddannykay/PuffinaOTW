// public/script.js
const socket = io();

let currentUser = null;
let userRole = null;
let triviaQuestions = [];
let parentBattleQuestions = [];
let currentTriviaIndex = 0;
let currentParentIndex = 0;
let triviaScores = {};
let parentBattleVotes = {};

// DOM Elements
const loginModal = document.getElementById("loginModal");
const usernameInput = document.getElementById("usernameInput");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");
const appContainer = document.getElementById("appContainer");

const tabBtns = document.querySelectorAll(".tab-btn");
const triviaSection = document.getElementById("triviaSection");
const parentsSection = document.getElementById("parentsSection");

// Trivia Elements
const triviaQuestionElem = document.getElementById("triviaQuestion");
const triviaOptionsElem = document.getElementById("triviaOptions");
const triviaLeaderboardList = document.getElementById("triviaLeaderboardList");
const triviaNextBtn = document.getElementById("triviaNextBtn");
const triviaAdminPanel = document.getElementById("triviaAdmin");

// Parents Elements
const parentsQuestionElem = document.getElementById("parentsQuestion");
const parentsOptionsElem = document.getElementById("parentsOptions");
const barCraig = document.getElementById("barCraig");
const barSaranya = document.getElementById("barSaranya");
const barBoth = document.getElementById("barBoth");
const parentsNextBtn = document.getElementById("parentsNextBtn");
const parentsAdminPanel = document.getElementById("parentsAdmin");

// LOGIN
loginBtn.addEventListener("click", () => {
  const username = usernameInput.value.trim();
  if (!username) return;
  socket.emit("login", username);
});

socket.on("login_error", (msg) => {
  loginError.textContent = msg;
});

socket.on("login_success", (data) => {
  currentUser = data.username;
  userRole = data.role;
  triviaQuestions = data.triviaQuestions;
  parentBattleQuestions = data.parentBattleQuestions;
  currentTriviaIndex = data.currentTriviaIndex;
  currentParentIndex = data.currentParentIndex;
  triviaScores = data.triviaScores;
  parentBattleVotes = data.parentBattleVotes;

  loginModal.style.display = "none";
  appContainer.classList.remove("hidden");

  if (userRole === "admin") {
    triviaAdminPanel.classList.remove("hidden");
    parentsAdminPanel.classList.remove("hidden");
  }

  loadTriviaQuestion();
  loadParentsQuestion();
});

// NAV TABS
tabBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    tabBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    showTab(btn.getAttribute("data-tab"));
  });
});

function showTab(tab) {
  triviaSection.classList.add("hidden");
  parentsSection.classList.add("hidden");
  if (tab === "trivia") triviaSection.classList.remove("hidden");
  if (tab === "parents") parentsSection.classList.remove("hidden");
}

// TRIVIA GAME
function loadTriviaQuestion() {
  if (currentTriviaIndex >= triviaQuestions.length) {
    triviaQuestionElem.textContent = "Game Over!";
    triviaOptionsElem.innerHTML = "";
    return;
  }
  const q = triviaQuestions[currentTriviaIndex];
  triviaQuestionElem.textContent = `Q${q.id}: ${q.question}`;
  triviaOptionsElem.innerHTML = "";
  q.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = opt;
    btn.addEventListener("click", () => {
      socket.emit("trivia_answer", { questionId: q.id, answer: opt });
      Array.from(triviaOptionsElem.children).forEach(b => b.disabled = true);
    });
    triviaOptionsElem.appendChild(btn);
  });
  updateTriviaLeaderboard();
}

function updateTriviaLeaderboard() {
  triviaLeaderboardList.innerHTML = "";
  const sorted = Object.entries(triviaScores).sort((a, b) => b[1] - a[1]);
  sorted.forEach(([user, score]) => {
    const li = document.createElement("li");
    li.textContent = `${user}: ${score}`;
    triviaLeaderboardList.appendChild(li);
  });
}

triviaNextBtn.addEventListener("click", () => {
  if (userRole !== "admin") return;
  if (currentTriviaIndex < triviaQuestions.length - 1) {
    currentTriviaIndex++;
    socket.emit("advance_question", { game: "trivia", index: currentTriviaIndex });
  } else {
    currentTriviaIndex = triviaQuestions.length;
    socket.emit("advance_question", { game: "trivia", index: currentTriviaIndex });
  }
});

socket.on("sync_trivia", (data) => {
  currentTriviaIndex = data.currentTriviaIndex;
  loadTriviaQuestion();
});

socket.on("update_trivia_scores", (scores) => {
  triviaScores = scores;
  updateTriviaLeaderboard();
});

// PARENTAL QUICKSHOTS
function loadParentsQuestion() {
  if (currentParentIndex >= parentBattleQuestions.length) {
    parentsQuestionElem.textContent = "Game Over!";
    parentsOptionsElem.innerHTML = "";
    return;
  }
  const q = parentBattleQuestions[currentParentIndex];
  parentsQuestionElem.textContent = `Q${q.id}: ${q.question}`;
  parentsOptionsElem.innerHTML = "";
  if (q.isBonus) {
    // For bonus question, use provided options
    q.options.forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.textContent = opt;
      btn.setAttribute("data-option", opt);
      btn.addEventListener("click", () => {
        socket.emit("parents_response", { questionId: q.id, response: opt });
        btn.classList.add("selected");
        setTimeout(() => btn.classList.remove("selected"), 500);
      });
      parentsOptionsElem.appendChild(btn);
    });
  } else {
    // Default options: Craig, Saranya, Both
    const defaultOptions = [
      { text: "Craig (Father)", value: "Craig" },
      { text: "Saranya (Mother)", value: "Saranya" },
      { text: "Both", value: "Both" }
    ];
    defaultOptions.forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.textContent = opt.text;
      btn.setAttribute("data-option", opt.value);
      btn.addEventListener("click", () => {
        socket.emit("parents_response", { questionId: q.id, response: opt.value });
        btn.classList.add("selected");
        setTimeout(() => btn.classList.remove("selected"), 500);
      });
      parentsOptionsElem.appendChild(btn);
    });
  }
}

parentsNextBtn.addEventListener("click", () => {
  if (userRole !== "admin") return;
  if (currentParentIndex < parentBattleQuestions.length - 1) {
    currentParentIndex++;
    socket.emit("advance_question", { game: "parents", index: currentParentIndex });
  } else {
    currentParentIndex = parentBattleQuestions.length;
    socket.emit("advance_question", { game: "parents", index: currentParentIndex });
  }
});

socket.on("sync_parents", (data) => {
  currentParentIndex = data.currentParentIndex;
  loadParentsQuestion();
});

socket.on("update_parents_votes", (data) => {
  const { questionId, votes } = data;
  updateBar(barCraig, "Craig", votes["Craig"]);
  updateBar(barSaranya, "Saranya", votes["Saranya"]);
  updateBar(barBoth, "Both", votes["Both"]);
});

function updateBar(barElem, label, count) {
  barElem.querySelector("span").textContent = `${label}: ${count}`;
  barElem.style.width = `${Math.min(count * 20, 100)}%`;
}
