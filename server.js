// server.js
const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, "public")));

/*---------------------------------------------------------
  USER ROLES
---------------------------------------------------------*/
const adminIDs = ["Dhani_Admin", "Shaheera_Admin", "Craig_Admin", "Saranya_Admin"];
const parentIDs = ["Saranya_Parent", "Craig_Parent"];
const guestIDs = ["Karunanithi", "Porchelvi", "Brian", "Paula", "Julie", "Neil", "Shannon", "David", "Subha", "Ravi", "Aswini", "Brandi", "Becky", "Eli", "Ava", "Gideon", "Dan"];

function getUserRole(username) {
  if (adminIDs.includes(username)) return "admin";
  if (parentIDs.includes(username)) return "parent";
  if (guestIDs.includes(username)) return "guest";
  return null;
}

/*---------------------------------------------------------
  GAME 1: TRIVIA GAME (Baby Trivia)
---------------------------------------------------------*/
const triviaQuestions = [
  {
    id: 1,
    question: "At what age do most babies start crawling?",
    options: ["3-6 months", "6-9 months", "9-12 months", "12-15 months"],
    correctAnswer: "6-9 months"
  },
  {
    id: 2,
    question: "What is the average weight of a full-term newborn?",
    options: ["5-6 lbs", "6-9 lbs", "8-10 lbs", "10-12 lbs"],
    correctAnswer: "6-9 lbs"
  },
  {
    id: 3,
    question: "Which reflex is present in newborns?",
    options: ["Grasp reflex", "Knee-jerk reflex", "Sneeze reflex", "Blink reflex"],
    correctAnswer: "Grasp reflex"
  },
  {
    id: 4,
    question: "At what age do babies typically start to smile socially?",
    options: ["1 month", "2 months", "3 months", "4 months"],
    correctAnswer: "2 months"
  },
  {
    id: 5,
    question: "What is the average number of diapers a baby uses in a day?",
    options: ["4-6", "6-8", "8-10", "10-12"],
    correctAnswer: "6-8"
  },
  {
    id: 6,
    question: "Which vitamin is often recommended for newborns?",
    options: ["Vitamin A", "Vitamin C", "Vitamin D", "Vitamin E"],
    correctAnswer: "Vitamin D"
  },
  {
    id: 7,
    question: "How many hours a day do newborns sleep on average?",
    options: ["8-10 hours", "10-12 hours", "14-17 hours", "18-20 hours"],
    correctAnswer: "14-17 hours"
  },
  {
    id: 8,
    question: "What is a common first food for babies?",
    options: ["Rice cereal", "Banana", "Carrot", "Avocado"],
    correctAnswer: "Rice cereal"
  },
  {
    id: 9,
    question: "When do most babies start teething?",
    options: ["2-3 months", "4-6 months", "6-8 months", "8-10 months"],
    correctAnswer: "4-6 months"
  },
  {
    id: 10,
    question: "Which sense is the most developed at birth?",
    options: ["Sight", "Hearing", "Taste", "Smell"],
    correctAnswer: "Hearing"
  },
  {
    id: 11,
    question: "What percentage of babies are born on their due date?",
    options: ["1%", "5%", "10%", "20%"],
    correctAnswer: "5%"
  },
  {
    id: 12,
    question: "What is the term for a baby’s soft spot on the head?",
    options: ["Fontanelle", "Cranial vault", "Suture", "Malleolus"],
    correctAnswer: "Fontanelle"
  },
  {
    id: 13,
    question: "At what age do most babies start to babble?",
    options: ["2-4 months", "4-6 months", "6-8 months", "8-10 months"],
    correctAnswer: "4-6 months"
  },
  {
    id: 14,
    question: "What is the most common first word for babies?",
    options: ["Mama", "Dada", "Baba", "Uh-oh"],
    correctAnswer: "Mama"
  },
  {
    id: 15,
    question: "How long is a typical pregnancy?",
    options: ["30 weeks", "32 weeks", "38-40 weeks", "42 weeks"],
    correctAnswer: "38-40 weeks"
  },
  {
    id: 16,
    question: "What is colic in infants?",
    options: ["A skin rash", "Excessive crying", "Sleeping disorder", "Feeding problem"],
    correctAnswer: "Excessive crying"
  },
  {
    id: 17,
    question: "Which organ develops first in a baby?",
    options: ["Heart", "Brain", "Liver", "Lungs"],
    correctAnswer: "Heart"
  },
  {
    id: 18,
    question: "What is the main ingredient in breast milk?",
    options: ["Protein", "Fat", "Water", "Carbohydrates"],
    correctAnswer: "Water"
  },
  {
    id: 19,
    question: "At what age do most babies start to walk?",
    options: ["9-12 months", "12-15 months", "15-18 months", "18-24 months"],
    correctAnswer: "12-15 months"
  },
  {
    id: 20,
    question: "Which baby product is essential for safe sleep?",
    options: ["Pacifier", "Crib", "Car seat", "Stroller"],
    correctAnswer: "Crib"
  }
];

// Keep track of the current trivia question index and user scores
let currentTriviaIndex = 0;
let triviaScores = {}; // { username: score }

/*---------------------------------------------------------
  GAME 2: REDBUS PUZZLE CHALLENGE
---------------------------------------------------------*/
const redbusPuzzles = [
  {
    id: 1,
    image: "/assets/redbus1.jpg",
    question: "Identify the model of this redbus.",
    options: ["Model A", "Model B", "Model C", "Model D"],
    correctAnswer: "Model A"
  },
  {
    id: 2,
    image: "/assets/redbus2.jpg",
    question: "Which route is shown in this redbus image?",
    options: ["Route 1", "Route 2", "Route 3", "Route 4"],
    correctAnswer: "Route 3"
  }
  // Add additional puzzles (up to 20) similarly
];

let currentRedbusIndex = 0;
let redbusVotes = {}; // { puzzleId: { option: count } }
redbusPuzzles.forEach(puzzle => {
  redbusVotes[puzzle.id] = {};
  puzzle.options.forEach(opt => {
    redbusVotes[puzzle.id][opt] = 0;
  });
});

/*---------------------------------------------------------
  GAME 3: PARENTS BATTLE
  (Using your 20 "Who's more likely..." questions)
---------------------------------------------------------*/
const parentBattleQuestions = [
  { id: 1, question: "Who’s more likely to Google every pregnancy symptom?" },
  { id: 2, question: "Who had the most bizarre pregnancy cravings?" },
  { id: 3, question: "Who talks to baby Puffina the most already?" },
  { id: 4, question: "Who’s more likely to fall asleep during baby books research?" },
  { id: 5, question: "Who will be the one reminding the other to pack the hospital bag?" },
  { id: 6, question: "Who will be the “fun” parent, and who will be the “strict” parent?" },
  { id: 7, question: "Who’s more likely to say “Ask your mom/dad” when baby Puffina wants something?" },
  { id: 8, question: "Who will baby Puffina go to first when she needs to sneak an extra treat?" },
  { id: 9, question: "Who’s more likely to cry first during Puffina’s first day at school?" },
  { id: 10, question: "Who will be the one teaching Puffina math at home?" },
  { id: 11, question: "Who’s more likely to stay up late doing last-minute baby prep?" },
  { id: 12, question: "Who’s more likely to take 500 pictures of Puffina for no reason?" },
  { id: 13, question: "Who’s more likely to baby-proof everything in the house first?" },
  { id: 14, question: "Who will be the one using baby talk more?" },
  { id: 15, question: "Who’s going to be the best at diaper duty?" },
  { id: 16, question: "Which of these two will spoil Puffina the most? (Let guests vote!)" },
  { id: 17, question: "Who is most likely to dress Puffina in the weirdest outfits?" },
  { id: 18, question: "Who’s most likely to make up a bedtime story on the spot?" },
  { id: 19, question: "Who will be the first to panic if Puffina gets a small scratch?" },
  { id: 20, question: "Who will be the one reading all the baby product reviews before buying anything?" }
];

let currentParentIndex = 0;
// For each Parents Battle question, tally responses (from both admin and guests)
// Structure: { questionId: { "Craig": count, "Saranya": count, "Both": count } }
let parentBattleVotes = {};
parentBattleQuestions.forEach(q => {
  parentBattleVotes[q.id] = { "Craig": 0, "Saranya": 0, "Both": 0 };
});

/*---------------------------------------------------------
  SOCKET.IO EVENTS & SYNC
---------------------------------------------------------*/
io.on("connection", (socket) => {
  console.log("New socket connected");

  // Login handling
  socket.on("login", (username) => {
    const role = getUserRole(username);
    if (!role) {
      socket.emit("login_error", "Invalid username!");
      return;
    }
    socket.username = username;
    socket.role = role;
    // Send initial state to client
    socket.emit("login_success", {
      username,
      role,
      triviaQuestions,
      redbusPuzzles,
      parentBattleQuestions,
      currentTriviaIndex,
      currentRedbusIndex,
      currentParentIndex,
      triviaScores,
      redbusVotes,
      parentBattleVotes
    });
  });

  // ---------------------
  // Admin-controlled advance (all games)
  // data: { game: "trivia" | "redbus" | "parents", index: newIndex }
  socket.on("advance_question", (data) => {
    if (socket.role !== "admin") return;
    const { game, index } = data;
    if (game === "trivia") {
      currentTriviaIndex = index;
      io.emit("sync_trivia", { currentTriviaIndex });
    } else if (game === "redbus") {
      currentRedbusIndex = index;
      io.emit("sync_redbus", { currentRedbusIndex });
    } else if (game === "parents") {
      currentParentIndex = index;
      io.emit("sync_parents", { currentParentIndex });
    }
  });

  // ---------------------
  // GAME 1: Trivia Answers
  // data: { questionId, answer }
  socket.on("trivia_answer", (data) => {
    const { questionId, answer } = data;
    const question = triviaQuestions.find(q => q.id === questionId);
    if (!question) return;
    if (!triviaScores[socket.username]) triviaScores[socket.username] = 0;
    if (answer === question.correctAnswer) {
      triviaScores[socket.username] += 1;
    }
    io.emit("update_trivia_scores", triviaScores);
  });

  // ---------------------
  // GAME 2: Redbus Puzzle Votes
  // data: { puzzleId, answer }
  socket.on("redbus_vote", (data) => {
    const { puzzleId, answer } = data;
    if (redbusVotes[puzzleId] && redbusVotes[puzzleId][answer] !== undefined) {
      redbusVotes[puzzleId][answer] += 1;
      io.emit("update_redbus_votes", { puzzleId, votes: redbusVotes[puzzleId] });
    }
  });

  // ---------------------
  // GAME 3: Parents Battle Responses
  // There are two events:
  //  a) Admin enters the parents’ responses
  //  b) Guests submit their guesses
  // data: { questionId, response } where response is "Craig", "Saranya", or "Both"
  socket.on("parents_response", (data) => {
    const { questionId, response } = data;
    if (parentBattleVotes[questionId] && parentBattleVotes[questionId][response] !== undefined) {
      parentBattleVotes[questionId][response] += 1;
      io.emit("update_parents_votes", { questionId, votes: parentBattleVotes[questionId] });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
