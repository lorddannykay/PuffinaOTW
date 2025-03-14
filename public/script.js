// public/script.js
const socket = io();

// Global state
let currentUser = null;
let userRole = null;
let triviaQuestions = [];
let redbusPuzzles = [];
let parentBattleQuestions = [];
let currentTriviaIndex = 0;
let currentRedbusIndex = 0;
let currentParentIndex = 0;
let triviaScores = {};
let redbusVotes = {};
let parentBattleVotes = {};

// DOM Elements
const loginModal = document.getElementById("loginModal");
const usernameInput = document.getElementById("usernameInput");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");
const appContainer = document.getElementById("appContainer");

// Navigation Tabs
const tabBtns = document.querySelectorAll(".tab-btn");
const triviaSection = document.getElementById("triviaSection");
const redbusSection = document.getElementById("redbusSection");
const parentsSection = document.getElementById("parentsSection");

// Trivia Elements
const triviaQuestionElem = document.getElementById("triviaQuestion");
const triviaOptionsElem = document.getElementById("triviaOptions");
const triviaLeaderboardList = document.getElementById("triviaLeaderboardList");
const triviaNextBtn = document.getElementById("triviaNextBtn");
const triviaAdminPanel = document.getElementById("triviaAdmin");

// Redbus Elements
const redbusImage = document.getElementById("redbusImage");
const redbusQuestionElem = document.getElementById("redbusQuestion");
const redbusOptionsElem = document.getElementById("redbusOptions");
const redbusNextBtn = document.getElementById("redbusNextBtn");
const redbusAdminPanel = document.getElementById("redbusAdmin");

// Parents Battle Elements
const parentsQuestionElem = document.getElementById("parentsQuestion");
const parentsOptionsElem = document.getElementById("parentsOptions");
const barCraig = document.getElementById("barCraig");
const barSaranya = document.getElementById("barSaranya");
const barBoth = document.getElementById("barBoth");
const parentsNextBtn = document.getElementById("parentsNextBtn");
const parentsAdminPanel = document.getElementById("parentsAdmin");

// ---------------------
// LOGIN HANDLING
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
  redbusPuzzles = data.redbusPuzzles;
  parentBattleQuestions = data.parentBattleQuestions;
  currentTriviaIndex = data.currentTriviaIndex;
  currentRedbusIndex = data.currentRedbusIndex;
  currentParentIndex = data.currentParentIndex;
  triviaScores = data.triviaScores;
  redbusVotes = data.redbusVotes;
  parentBattleVotes = data.parentBattleVotes;

  loginModal.style.display = "none";
  appContainer.classList.remove("hidden");

  // Show admin panels if user is admin
  if (userRole === "admin") {
    triviaAdminPanel.classList.remove("hidden");
    redbusAdminPanel.classList.remove("hidden");
    parentsAdminPanel.classList.remove("hidden");
  }

  // Initialize each game display
  loadTriviaQuestion();
  loadRedbusPuzzle();
  loadParentsQuestion();
});

// ---------------------
// NAVIGATION TABS
tabBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    tabBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const tab = btn.getAttribute("data-tab");
    showTab(tab);
  });
});

function showTab(tab) {
  triviaSection.classList.add("hidden");
  redbusSection.classList.add("hidden");
  parentsSection.classList.add("hidden");
  if (tab === "trivia") triviaSection.classList.remove("hidden");
  if (tab === "redbus") redbusSection.classList.remove("hidden");
  if (tab === "parents") parentsSection.classList.remove("hidden");
}

// ---------------------
// TRIVIA GAME FUNCTIONS
function loadTriviaQuestion() {
  if (!triviaQuestions.length) return;
  const q = triviaQuestions[currentTriviaIndex];
  triviaQuestionElem.textContent = `Q${q.id}: ${q.question}`;
  triviaOptionsElem.innerHTML = "";
  q.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = opt;
    btn.addEventListener("click", () => {
      socket.emit("trivia_answer", { questionId: q.id, answer: opt });
      // Disable options after answering (or provide visual feedback)
      Array.from(triviaOptionsElem.children).forEach(b => b.disabled = true);
    });
    triviaOptionsElem.appendChild(btn);
  });
  updateTriviaLeaderboard();
}

function updateTriviaLeaderboard() {
  triviaLeaderboardList.innerHTML = "";
  // Sort scores descending
  const sorted = Object.entries(triviaScores).sort((a, b) => b[1] - a[1]);
  sorted.forEach(([user, score]) => {
    const li = document.createElement("li");
    li.textContent = `${user}: ${score}`;
    triviaLeaderboardList.appendChild(li);
  });
}

triviaNextBtn.addEventListener("click", () => {
  // Only admin can advance
  if (userRole !== "admin") return;
  currentTriviaIndex = (currentTriviaIndex + 1) % triviaQuestions.length;
  socket.emit("advance_question", { game: "trivia", index: currentTriviaIndex });
});

socket.on("sync_trivia", (data) => {
  currentTriviaIndex = data.currentTriviaIndex;
  // Reset options for new question
  loadTriviaQuestion();
});

socket.on("update_trivia_scores", (scores) => {
  triviaScores = scores;
  updateTriviaLeaderboard();
});

// ---------------------
// REDBUS GAME FUNCTIONS
function loadRedbusPuzzle() {
  if (!redbusPuzzles.length) return;
  const puzzle = redbusPuzzles[currentRedbusIndex];
  redbusImage.src = puzzle.image;
  redbusQuestionElem.textContent = `Puzzle ${puzzle.id}: ${puzzle.question}`;
  redbusOptionsElem.innerHTML = "";
  puzzle.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = opt;
    btn.addEventListener("click", () => {
      socket.emit("redbus_vote", { puzzleId: puzzle.id, answer: opt });
      // Visual feedback: briefly highlight the button
      btn.classList.add("selected");
      setTimeout(() => btn.classList.remove("selected"), 500);
    });
    redbusOptionsElem.appendChild(btn);
  });
}

redbusNextBtn.addEventListener("click", () => {
  if (userRole !== "admin") return;
  currentRedbusIndex = (currentRedbusIndex + 1) % redbusPuzzles.length;
  socket.emit("advance_question", { game: "redbus", index: currentRedbusIndex });
});

socket.on("sync_redbus", (data) => {
  currentRedbusIndex = data.currentRedbusIndex;
  loadRedbusPuzzle();
});

socket.on("update_redbus_votes", (data) => {
  // (Optional) You can update a vote tally display if desired.
  console.log("Redbus votes updated for puzzle", data.puzzleId, data.votes);
});

// ---------------------
// PARENTS BATTLE FUNCTIONS
function loadParentsQuestion() {
  if (!parentBattleQuestions.length) return;
  const q = parentBattleQuestions[currentParentIndex];
  parentsQuestionElem.textContent = `Q${q.id}: ${q.question}`;
  // No need to render options as they are static buttons already in the HTML.
  // (If you want to disable previous answers, you could add that logic here.)
}

parentsOptionsElem.querySelectorAll(".option-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const response = btn.getAttribute("data-option");
    socket.emit("parents_response", { questionId: parentBattleQuestions[currentParentIndex].id, response });
    // Visual feedback
    btn.classList.add("selected");
    setTimeout(() => {
      btn.classList.remove("selected");
    }, 500);
  });
});

parentsNextBtn.addEventListener("click", () => {
  if (userRole !== "admin") return;
  currentParentIndex = (currentParentIndex + 1) % parentBattleQuestions.length;
  socket.emit("advance_question", { game: "parents", index: currentParentIndex });
});

socket.on("sync_parents", (data) => {
  currentParentIndex = data.currentParentIndex;
  loadParentsQuestion();
});

socket.on("update_parents_votes", (data) => {
  // Update the animated bar graph for Parents Battle.
  const votes = data.votes;
  updateBar(barCraig, "Craig", votes["Craig"]);
  updateBar(barSaranya, "Saranya", votes["Saranya"]);
  updateBar(barBoth, "Both", votes["Both"]);
});

function updateBar(barElem, label, count) {
  barElem.querySelector("span").textContent = `${label}: ${count}`;
  // For demonstration, set width proportional to count (you can refine this)
  barElem.style.width = `${Math.min(count * 20, 100)}%`;
}
