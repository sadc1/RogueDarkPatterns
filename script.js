// =======================================
// GAMEPLAY FILE (Person 2 - Tasks & Loop)
// =======================================
// This file controls:
// - task rendering
// - user interaction (clicking options)
// - moving between tasks
// - temporary scoring (can be replaced by Person 3)


// ============================
// TASK DATA (edit freely)
// ============================
// Each task has:
// - type (label)
// - title (main text)
// - description (instructions)
// - options (buttons with points)

const tasks = [
  {
    type: "Choice",
    title: "Pick a starter task",
    description: "Choose one of the options below to begin your run.",
    options: [
      { title: "Quick Start", description: "Take the fastest option and move on.", points: 10 },
      { title: "Careful Start", description: "Play it safe and take a smaller reward.", points: 5 },
      { title: "Do Nothing", description: "Skip the opportunity.", points: 0 }
    ]
  },

  {
    type: "Decision",
    title: "Follow the suggestion?",
    description: "A highlighted option appears on screen. Decide what to do.",
    options: [
      { title: "Follow It", description: "Go with the suggestion.", points: 10 },
      { title: "Think First", description: "Take a middle option.", points: 5 },
      { title: "Ignore It", description: "Reject it.", points: 0 }
    ]
  },

  {
    type: "Task",
    title: "Choose a card",
    description: "Pick the card that seems best.",
    options: [
      { title: "Top Card", description: "Looks like the best option.", points: 10 },
      { title: "Middle Card", description: "Safe choice.", points: 5 },
      { title: "Low Card", description: "Lowest value.", points: 0 }
    ]
  },

  {
    type: "Bonus",
    title: "Claim a bonus",
    description: "A bonus appears briefly.",
    options: [
      { title: "Claim Now", description: "Take it immediately.", points: 10 },
      { title: "Wait", description: "Take less later.", points: 5 },
      { title: "Pass", description: "Ignore it.", points: 0 }
    ]
  },

  {
    type: "Reaction",
    title: "Keep your streak going",
    description: "You have momentum.",
    options: [
      { title: "Keep Going", points: 10 },
      { title: "Slow Down", points: 5 },
      { title: "Stop", points: 0 }
    ]
  },

  {
    type: "Navigation",
    title: "Choose a route",
    description: "Pick a path.",
    options: [
      { title: "Highlighted Route", points: 10 },
      { title: "Normal Route", points: 5 },
      { title: "Back Out", points: 0 }
    ]
  },

  {
    type: "Priority",
    title: "Handle a priority task",
    description: "A task is marked important.",
    options: [
      { title: "Do It Now", points: 10 },
      { title: "Do It Later", points: 5 },
      { title: "Ignore It", points: 0 }
    ]
  },

  {
    type: "Final Push",
    title: "Finish strong",
    description: "Make one last decision.",
    options: [
      { title: "Go All In", points: 10 },
      { title: "Play Safe", points: 5 },
      { title: "End Quietly", points: 0 }
    ]
  }
];


// ============================
// GAME STATE (Person 3 may modify)
// ============================

let score = 0;                 // total points
let completed = 0;             // completed tasks
let skipped = 0;               // skipped tasks
let rounds = 0;                // total rounds played
let currentIndex = 0;          // current task index
let selectedOptionIndex = null;

// Shuffle tasks so they don't appear in same order every time
let taskOrder = shuffle([...tasks]);


// ============================
// GET HTML ELEMENTS
// ============================

const scoreDisplay = document.getElementById("scoreDisplay");
const taskCounter = document.getElementById("taskCounter");

const completedCount = document.getElementById("completedCount");
const skippedCount = document.getElementById("skippedCount");
const roundCount = document.getElementById("roundCount");

const taskType = document.getElementById("taskType");
const taskTitle = document.getElementById("taskTitle");
const taskDescription = document.getElementById("taskDescription");

const taskOptions = document.getElementById("taskOptions");
const feedbackBox = document.getElementById("feedbackBox");

const nextBtn = document.getElementById("nextBtn");
const skipBtn = document.getElementById("skipBtn");


// ============================
// SHUFFLE FUNCTION
// ============================
// Randomizes task order

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}


// ============================
// RENDER TASK
// ============================
// Displays the current task on screen

function renderTask() {

  // If we reach the end → reshuffle tasks
  if (currentIndex >= taskOrder.length) {
    taskOrder = shuffle([...tasks]);
    currentIndex = 0;
  }

  const task = taskOrder[currentIndex];

  selectedOptionIndex = null;
  nextBtn.disabled = true;

  hideFeedback();

  // Update UI text
  taskType.textContent = task.type;
  taskTitle.textContent = task.title;
  taskDescription.textContent = task.description;

  // Update counter
  taskCounter.textContent = `${currentIndex + 1} / ${taskOrder.length}`;

  // Clear previous buttons
  taskOptions.innerHTML = "";

  // Create option buttons
  task.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.className = "option-card";

    button.innerHTML = `
      <h3>${option.title}</h3>
      <p>${option.description || ""}</p>
    `;

    // When user clicks an option
    button.addEventListener("click", () => {
      selectedOptionIndex = index;

      // Remove previous selection
      document.querySelectorAll(".option-card").forEach(card => {
        card.classList.remove("selected");
      });

      // Highlight selected
      button.classList.add("selected");

      nextBtn.disabled = false;
    });

    taskOptions.appendChild(button);
  });
}


// ============================
// UPDATE STATS
// ============================

function updateStats() {
  scoreDisplay.textContent = score;
  completedCount.textContent = completed;
  skippedCount.textContent = skipped;
  roundCount.textContent = rounds;
}


// ============================
// FEEDBACK ( +10, skip, etc )
// ============================

function showFeedback(message, type) {
  feedbackBox.textContent = message;
  feedbackBox.className = `feedback ${type}`;
}

function hideFeedback() {
  feedbackBox.className = "feedback hidden";
  feedbackBox.textContent = "";
}


// ============================
// NEXT TASK LOGIC
// ============================
// Called when user clicks "Next"

function handleNext() {
  if (selectedOptionIndex === null) return;

  const task = taskOrder[currentIndex];
  const choice = task.options[selectedOptionIndex];

  // TEMP scoring logic (Person 3 can replace this)
  score += choice.points;

  completed += 1;
  rounds += 1;

  updateStats();

  showFeedback(`+${choice.points} points`, "good");

  setTimeout(() => {
    currentIndex++;
    renderTask();
  }, 700);
}


// ============================
// SKIP TASK
// ============================

function handleSkip() {
  skipped += 1;
  rounds += 1;

  updateStats();

  showFeedback("Skipped (+0)", "skip");

  setTimeout(() => {
    currentIndex++;
    renderTask();
  }, 700);
}


// ============================
// EVENT LISTENERS
// ============================

nextBtn.addEventListener("click", handleNext);
skipBtn.addEventListener("click", handleSkip);


// ============================
// INITIAL LOAD
// ============================

renderTask();
updateStats();