const questions = [
  {
    key: "revenue",
    kicker: "Revenue",
    title: "How much revenue are you doing each year?",
    help: "This gives a quick read on whether there is enough operating scale for a useful review.",
    answers: [
      { label: "Under $500K", detail: "Likely too early for this offer", value: 0 },
      { label: "$500K-$1M", detail: "Some potential, depending on staff and costs", value: 12 },
      { label: "$1M-$2M", detail: "Core fit for the Strategize review", value: 24 },
      { label: "$2M+", detail: "Ideal scale for a deeper review", value: 30 },
    ],
  },
  {
    key: "staff",
    kicker: "Team size",
    title: "How many staff do you have?",
    help: "Staff count is a fast proxy for operating complexity and potential savings.",
    answers: [
      { label: "1-2 staff", detail: "Usually less leverage in the numbers", value: 0 },
      { label: "3-4 staff", detail: "May have some useful opportunities", value: 10 },
      { label: "5-10 staff", detail: "Strong signal for a review", value: 23 },
      { label: "11+ staff", detail: "More moving parts, more room for leakage", value: 28 },
    ],
  },
  {
    key: "coach",
    kicker: "Current support",
    title: "Are you currently working with a business coach?",
    help: "Strategize does not want to duplicate an existing coaching relationship.",
    answers: [
      { label: "No", detail: "Good, this keeps the review clean", value: 18 },
      { label: "Yes", detail: "You may be better taking this to your current coach", value: -45 },
    ],
  },
  {
    key: "location",
    kicker: "Location",
    title: "Where is the business based?",
    help: "This helps route qualified leads to the right local strategist.",
    answers: [
      { label: "Christchurch / Canterbury", detail: "Best match for the pilot", value: 14 },
      { label: "Elsewhere in New Zealand", detail: "Still worth checking", value: 9 },
      { label: "Outside New Zealand", detail: "May not be serviceable right now", value: 1 },
    ],
  },
  {
    key: "goal",
    kicker: "Main concern",
    title: "What would you most like to uncover?",
    help: "This helps frame the follow-up around the number that matters most.",
    answers: [
      { label: "Missed revenue", detail: "Sales, pricing, conversion, or productivity gaps", value: 12 },
      { label: "Cost savings", detail: "Wages, supplier terms, or buying group leakage", value: 12 },
      { label: "Both", detail: "A broad review may make sense", value: 16 },
    ],
  },
];

const state = {
  current: 0,
  answers: {},
};

const screens = {
  intro: document.querySelector('[data-screen="intro"]'),
  quiz: document.querySelector('[data-screen="quiz"]'),
  result: document.querySelector('[data-screen="result"]'),
};

const answerList = document.querySelector("#answer-list");
const stepLabel = document.querySelector("#step-label");
const progressPercent = document.querySelector("#progress-percent");
const progressBar = document.querySelector("#progress-bar");
const questionKicker = document.querySelector("#question-kicker");
const questionTitle = document.querySelector("#question-title");
const questionHelp = document.querySelector("#question-help");
const resultScore = document.querySelector("#result-score");
const resultBand = document.querySelector("#result-band");
const resultTitle = document.querySelector("#result-title");
const resultCopy = document.querySelector("#result-copy");
const resultMeter = document.querySelector(".result-meter");

function showScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.remove("is-active"));
  screens[name].classList.add("is-active");
}

function renderQuestion() {
  const question = questions[state.current];
  const progress = Math.round(((state.current + 1) / questions.length) * 100);

  stepLabel.textContent = `Question ${state.current + 1} of ${questions.length}`;
  progressPercent.textContent = `${progress}%`;
  progressBar.style.width = `${progress}%`;
  questionKicker.textContent = question.kicker;
  questionTitle.textContent = question.title;
  questionHelp.textContent = question.help;

  answerList.innerHTML = "";
  question.answers.forEach((answer) => {
    const button = document.createElement("button");
    button.className = "answer-card";
    button.type = "button";
    button.innerHTML = `<strong>${answer.label}</strong><span>${answer.detail}</span>`;
    button.addEventListener("click", () => selectAnswer(question.key, answer));
    answerList.appendChild(button);
  });
}

function selectAnswer(key, answer) {
  state.answers[key] = answer;

  if (state.current < questions.length - 1) {
    state.current += 1;
    renderQuestion();
    return;
  }

  renderResult();
  showScreen("result");
}

function getScore() {
  const total = Object.values(state.answers).reduce((sum, answer) => {
    return sum + answer.value;
  }, 0);

  return Math.max(0, Math.min(100, total));
}

function renderResult() {
  const score = getScore();
  const hasCoach = state.answers.coach?.label === "Yes";

  let band = "Early stage";
  let title = "This may not be the right review yet.";
  let copy =
    "Your answers suggest the opportunity may be limited right now. The review is usually strongest for established businesses with staff and enough revenue complexity.";

  if (hasCoach) {
    band = "Review carefully";
    title = "You may already have the right support.";
    copy =
      "Because you are currently working with a business coach, Strategize would normally recommend taking these savings questions back to your existing advisor first.";
  } else if (score >= 76) {
    band = "Strong fit";
    title = "You look like a strong fit for a savings review.";
    copy =
      "Your answers suggest there may be meaningful revenue leakage, staff cost pressure, or buying-group savings worth checking with a local strategist.";
  } else if (score >= 48) {
    band = "Possible fit";
    title = "There may be enough here to check.";
    copy =
      "You may not be the highest-priority fit, but there could still be useful savings or revenue opportunities worth a quick review.";
  }

  resultScore.textContent = score;
  resultBand.textContent = band;
  resultTitle.textContent = title;
  resultCopy.textContent = copy;
  resultMeter.style.setProperty("--score-angle", `${Math.round(score * 3.6)}deg`);
}

document.querySelector("[data-start]").addEventListener("click", () => {
  state.current = 0;
  state.answers = {};
  renderQuestion();
  showScreen("quiz");
});

document.querySelector("[data-back]").addEventListener("click", () => {
  if (state.current === 0) {
    showScreen("intro");
    return;
  }

  state.current -= 1;
  renderQuestion();
});

document.querySelector("[data-restart]").addEventListener("click", () => {
  state.current = 0;
  state.answers = {};
  showScreen("intro");
});
