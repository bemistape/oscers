/*******************************************************
 * GLOBAL STATE & CONFIG
 *******************************************************/
// CSV for game data + reactions
const csvUrl = "runtime_source_02222025.csv";
const reactionsUrl = "reactions.csv";

// Airtable credentials
const AIRTABLE_API_TOKEN = "patOq3ZLWnPBw54z9.612d6c936097d6a23fd1dd06f9a68ca1e1ab4ccad99a5eb6770eca4af2d74396";  // <-- PUT YOUR ACTUAL TOKEN HERE
const AIRTABLE_BASE_ID = "appDwKDKdB22NsFkb"; // from your base
const AIRTABLE_TABLE_ID = "tblADki2GveNohUdD"; // from your table
// Endpoint to read/write records
const AIRTABLE_TABLE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`;

// We'll store scoreboard data from Airtable in these arrays:
let scoreboardEasy = [];
let scoreboardMedium = [];
let scoreboardHard = [];

/*******************************************************
 * GAME STATE
 *******************************************************/
let difficulty;
let allMovies = [];
let filteredMovies = [];

let perfectReactions = [];
let closeReactions = [];
let unimpressedReactions = [];
let badReactions = [];

const TIMERS = {
  easy:   [30, 30, 30, 30, 30],
  medium: [30, 25, 20, 15, 15],
  hard:   [20, 18, 15, 12, 10]
};
let roundTimers = [];
let rounds = [];
let currentRoundIndex = 0;

let totalCorrect = 0;
let totalDifference = 0;
let totalAnswered = 0;
let totalScore = 0;
let roundScores = [];

let jokerUsed = false;
let timeLeft = 20;
let roundTimer = null;
let canDrag = false;
let selectedRuntimeCard = null;

// Bonus
let bonusMovies = [];
let bonusUsed = false;
let bonusTimer = null;
let bonusTimeLeft = 10;
let bonusStarted = false;

// Player
let playerName = "";
let pendingReaction = "";

/*******************************************************
 * ON DOM READY
 *******************************************************/
document.addEventListener("DOMContentLoaded", async () => {
  // Difficulty selection
  document.getElementById("easy-btn").addEventListener("click", () => setDifficulty("easy"));
  document.getElementById("medium-btn").addEventListener("click", () => setDifficulty("medium"));
  document.getElementById("hard-btn").addEventListener("click", () => setDifficulty("hard"));
  setDifficulty("easy");

  // Name input
  const nameInput = document.getElementById("playerNameInput");
  nameInput.addEventListener("input", () => {
    document.getElementById("begin-btn").disabled = (nameInput.value.trim().length !== 6);
  });

  const beginBtn = document.getElementById("begin-btn");
  beginBtn.disabled = true;
  beginBtn.innerText = "Loading...";

  try {
    // Load main CSV + reactions for the game
    await fetchMainCSV();
    await fetchReactionsCSV();

    // Enable "Begin"
    beginBtn.disabled = false;
    beginBtn.innerText = "Begin";
  } catch (e) {
    console.error("Error loading data:", e);
    beginBtn.innerText = "Error loading data";
  }

  // Button event listeners
  beginBtn.addEventListener("click", onBeginGame);
  document.getElementById("joker-btn").addEventListener("click", () => {
    if (!jokerUsed) useJoker();
  });
  document.getElementById("submit-btn").addEventListener("click", onSubmitRound);
  document.getElementById("bonus-begin-btn").addEventListener("click", startBonusActual);
  document.getElementById("bonus-continue-btn").addEventListener("click", onFinishBonus);

  document.getElementById("share-twitter-btn").addEventListener("click", shareOnTwitter);
  document.getElementById("copy-recap-btn").addEventListener("click", copyRecap);
  document.getElementById("play-again-btn").addEventListener("click", () => {
    document.getElementById("final-container").style.display = "none";
    document.getElementById("intro-container").style.display = "flex";
  });
  document.getElementById("round-recap-close-btn").addEventListener("click", () => {
    document.getElementById("round-recap-overlay").style.display = "none";
    nextRoundAfterRecap();
  });

  // Load scoreboard from Airtable
  loadScoreboardFromAirtable();
});

/*******************************************************
 * MAIN CSV + REACTIONS
 *******************************************************/
async function fetchMainCSV() {
  const resp = await fetch(csvUrl);
  let data = await resp.text();
  data = data.replace(/^\uFEFF/, "");
  parseMainCSV(data);
}
function parseMainCSV(csvData) {
  const lines = csvData.trim().split(/\r?\n/);
  const headers = lines[0].split(",");
  const colId         = headers.indexOf("id");
  const colMovieName  = headers.indexOf("movie_name");
  const colRuntime    = headers.indexOf("runtime");
  const colDifficulty = headers.indexOf("difficulty");
  const colGroup      = headers.indexOf("group");
  const colPoster     = headers.indexOf("poster");
  const colOverview   = headers.indexOf("overview");

  for (let i = 1; i < lines.length; i++) {
    const rowCells = lines[i].split(",");
    if (rowCells.length < 7) continue;
    let movie = {};
    movie.id = rowCells[colId]?.trim() || "";
    movie.movie_name = rowCells[colMovieName]?.trim() || "";
    movie.runtime = parseInt(rowCells[colRuntime] || "0", 10);
    movie.difficulty = rowCells[colDifficulty]?.trim().toLowerCase() || "";
    movie.group = rowCells[colGroup]?.trim().toUpperCase() || "";
    movie.poster = rowCells[colPoster]?.trim() || "";
    movie.overview = rowCells[colOverview]?.trim() || "";
    movie._assignedRuntime = null;
    allMovies.push(movie);
  }
}

async function fetchReactionsCSV() {
  const resp = await fetch(reactionsUrl);
  let data = await resp.text();
  data = data.replace(/^\uFEFF/, "");
  parseReactionsCSV(data);
}
function parseReactionsCSV(csvData) {
  const rows = parseCSVWithQuotes(csvData);
  const headers = rows[0];
  const colPerfect = headers.indexOf("perfect");
  const colClose   = headers.indexOf("close");
  const colUnimp   = headers.indexOf("unimpressed");
  const colBad     = headers.indexOf("bad");

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.length < 4) continue;
    if (r[colPerfect]) perfectReactions.push(r[colPerfect]);
    if (r[colClose])   closeReactions.push(r[colClose]);
    if (r[colUnimp])   unimpressedReactions.push(r[colUnimp]);
    if (r[colBad])     badReactions.push(r[colBad]);
  }
}
function parseCSVWithQuotes(csv) {
  const lines = [];
  let currentLine = [];
  let currentCell = "";
  let inQuotes = false;
  for (let i = 0; i < csv.length; i++) {
    const c = csv[i];
    if (c === '"') {
      if (inQuotes && csv[i + 1] === '"') {
        currentCell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      currentLine.push(currentCell);
      currentCell = "";
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && i < csv.length - 1 && csv[i + 1] === '\n') i++;
      currentLine.push(currentCell);
      lines.push(currentLine);
      currentLine = [];
      currentCell = "";
    } else {
      currentCell += c;
    }
  }
  if (currentCell || currentLine.length > 0) {
    currentLine.push(currentCell);
    lines.push(currentLine);
  }
  return lines;
}

/*******************************************************
 * DIFFICULTY & GAME SETUP
 *******************************************************/
function setDifficulty(diff) {
  difficulty = diff;
  ["easy-btn","medium-btn","hard-btn"].forEach(id => {
    document.getElementById(id).classList.remove("active");
  });
  document.getElementById(`${diff}-btn`).classList.add("active");
}
function onBeginGame() {
  const nameInput = document.getElementById("playerNameInput");
  playerName = nameInput.value.trim();
  if (playerName.length !== 6) {
    alert("Please enter a 6-letter name.");
    return;
  }
  document.getElementById("intro-container").style.display = "none";
  document.getElementById("game-container").style.display = "flex";
  setupGame();
}
function setupGame() {
  currentRoundIndex = 0;
  totalCorrect = 0;
  totalDifference = 0;
  totalAnswered = 0;
  totalScore = 0;
  roundScores = [];
  jokerUsed = false;
  bonusUsed = false;
  bonusStarted = false;
  selectedRuntimeCard = null;

  document.getElementById("bonus-container").style.display = "none";
  document.getElementById("final-container").style.display = "none";

  filterByDifficulty();
  if (filteredMovies.length < 5) {
    filteredMovies = allMovies.slice();
  }
  roundTimers = TIMERS[difficulty] || [20, 20, 20, 20, 20];
  buildRounds();
  startRound();
}
function filterByDifficulty() {
  if (!difficulty) return;
  filteredMovies = allMovies.filter(m => m.difficulty === difficulty);
}
function buildRounds() {
  const groups = { A: [], B: [], C: [], D: [], E: [] };
  filteredMovies.forEach(movie => {
    if (groups[movie.group] !== undefined) {
      groups[movie.group].push(movie);
    }
  });
  for (let g in groups) {
    shuffle(groups[g]);
  }
  const potentialRoundsCount = Math.min(
    groups["A"].length,
    groups["B"].length,
    groups["C"].length,
    groups["D"].length,
    groups["E"].length
  );
  const finalCount = Math.min(potentialRoundsCount, 5);
  rounds = [];
  for (let i = 0; i < finalCount; i++) {
    rounds.push([
      groups["A"][i],
      groups["B"][i],
      groups["C"][i],
      groups["D"][i],
      groups["E"][i]
    ]);
  }
}

/*******************************************************
 * ROUND LOGIC
 *******************************************************/
function startRound() {
  if (currentRoundIndex >= 5) {
    // Show Bonus
    document.getElementById("game-container").style.display = "none";
    document.getElementById("bonus-container").style.display = "flex";
    document.getElementById("bonus-intro").style.display = "block";
    document.getElementById("bonus-timer-box").style.display = "none";
    document.getElementById("bonus-floating-container").style.display = "none";
    document.getElementById("bonus-continue-btn").style.display = "none";
    return;
  }
  fadeOutCards(() => {
    renderRound();
    fadeInCards();
  });
}
function renderRound() {
  timeLeft = roundTimers[currentRoundIndex] || 20;
  setupTimer();
  updateGameStatsBox();

  document.getElementById("round-label").innerText = `Round ${currentRoundIndex + 1}`;

  const moviesContainer = document.getElementById("movies-container");
  const runtimesContainer = document.getElementById("runtimes-container");
  moviesContainer.innerHTML = "";
  runtimesContainer.innerHTML = "";

  document.getElementById("joker-btn").style.display = jokerUsed ? "none" : "inline-block";

  const roundMovies = rounds[currentRoundIndex];
  const displayMovies = shuffle([...roundMovies]);
  displayMovies.forEach(m => {
    const card = document.createElement("div");
    card.classList.add("movie-card");
    card.setAttribute("data-correct", m.runtime);
    card.setAttribute("data-id", m.id);
    card.movie = m;

    let posterHTML = m.poster ? `<img class="movie-poster" src="${m.poster}" alt="${m.movie_name} poster">` : "";
    card.innerHTML = posterHTML;

    // Tap to place runtime
    card.addEventListener("click", () => {
      if (selectedRuntimeCard && !card.querySelector(".runtime-card")) {
        card.appendChild(selectedRuntimeCard);
        card.classList.add("placed");
        m._assignedRuntime = parseInt(selectedRuntimeCard.getAttribute("data-runtime"), 10);
        selectedRuntimeCard.classList.remove("selected");
        selectedRuntimeCard = null;
      }
    });
    card.addEventListener("dragover", e => { if (canDrag) e.preventDefault(); });
    card.addEventListener("drop", e => dropHandler(e, m, card));
    moviesContainer.appendChild(card);
  });

  roundMovies.forEach((m, i) => {
    const rc = document.createElement("div");
    rc.classList.add("runtime-card");
    rc.setAttribute("data-unique", `rt-${currentRoundIndex}-${i}`);
    rc.setAttribute("data-runtime", m.runtime.toString());
    rc.innerText = m.runtime + " min";
    rc.setAttribute("draggable", "true");

    rc.addEventListener("dragstart", e => {
      if (!canDrag) { e.preventDefault(); return; }
      rc.classList.add("dragging");
      e.dataTransfer.setData("text/plain", rc.getAttribute("data-unique"));
    });
    rc.addEventListener("dragend", () => {
      rc.classList.remove("dragging");
    });
    // Tap to select
    rc.addEventListener("click", () => {
      if (selectedRuntimeCard === rc) {
        rc.classList.remove("selected");
        selectedRuntimeCard = null;
      } else {
        if (selectedRuntimeCard) selectedRuntimeCard.classList.remove("selected");
        selectedRuntimeCard = rc;
        rc.classList.add("selected");
      }
    });
    runtimesContainer.appendChild(rc);
  });
  canDrag = true;
}
function setupTimer() {
  clearInterval(roundTimer);
  styleTimerBox(timeLeft);
  const timerVal = document.getElementById("timer-value");
  timerVal.innerText = timeLeft;

  roundTimer = setInterval(() => {
    timeLeft--;
    timerVal.innerText = timeLeft;
    styleTimerBox(timeLeft);
    if (timeLeft <= 0) {
      clearInterval(roundTimer);
      onSubmitRound();
    }
  }, 1000);
}
function styleTimerBox(t) {
  const timerBox = document.getElementById("timer-box");
  if (t <= 3) {
    timerBox.style.color = "red";
    timerBox.style.borderColor = "red";
  } else if (t <= 5) {
    timerBox.style.color = "orange";
    timerBox.style.borderColor = "orange";
  } else if (t <= 10) {
    timerBox.style.color = "yellow";
    timerBox.style.borderColor = "yellow";
  } else {
    timerBox.style.color = "white";
    timerBox.style.borderColor = "#444";
  }
}
function dropHandler(e, movieObj, movieCard) {
  if (!canDrag) return;
  e.preventDefault();
  const uniqueId = e.dataTransfer.getData("text/plain");
  const dragged = document.querySelector(`.runtime-card[data-unique="${uniqueId}"]`);
  if (!dragged) return;

  const rc = document.getElementById("runtimes-container");
  const existing = movieCard.querySelector(".runtime-card");
  if (existing) rc.appendChild(existing);

  movieCard.appendChild(dragged);
  movieCard.classList.add("placed");
  movieObj._assignedRuntime = parseInt(dragged.getAttribute("data-runtime"), 10);
}
function onSubmitRound() {
  clearInterval(roundTimer);
  canDrag = false;
  document.getElementById("submit-btn").style.display = "none";

  const roundMovies = rounds[currentRoundIndex];
  let roundCorrect = 0;
  let roundDiff = 0;
  let answeredCount = 0;
  let sumActual = 0;

  const cards = document.getElementById("movies-container").children;
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const correctRuntime = parseInt(card.getAttribute("data-correct"), 10);
    sumActual += correctRuntime;
    const assigned = card.querySelector(".runtime-card");
    if (assigned) {
      answeredCount++;
      const userRuntime = parseInt(assigned.getAttribute("data-runtime"), 10);
      if (userRuntime === correctRuntime) {
        roundCorrect++;
        card.classList.add("correct");
      } else {
        card.classList.add("incorrect");
        showCorrectLine(card, correctRuntime);
      }
    } else {
      card.classList.add("incorrect");
      showCorrectLine(card, correctRuntime);
    }
  }

  const leftoverBonus = timeLeft * 10;
  roundMovies.forEach(m => {
    if (m._assignedRuntime != null) {
      roundDiff += Math.abs(m._assignedRuntime - m.runtime);
    }
  });

  let fractionBonus = 0;
  if (answeredCount === 5) {
    const avgActual = sumActual / 5;
    const avgDiff = roundDiff / answeredCount;
    const fraction = avgDiff / avgActual;
    fractionBonus = (1000 * roundCorrect) * Math.pow((1 - fraction), 2);
  }

  const baseScore = roundCorrect * 1000;
  const roundScore = baseScore + leftoverBonus + fractionBonus;

  totalCorrect += roundCorrect;
  totalDifference += roundDiff;
  totalAnswered += answeredCount;
  totalScore += roundScore;

  roundScores.push({
    roundIndex: currentRoundIndex + 1,
    correct: roundCorrect,
    diff: roundDiff,
    answered: answeredCount,
    leftoverBonus,
    fractionBonus,
    roundScore
  });

  let reactionText = "";
  if (roundCorrect === 5) {
    reactionText = randomFrom(perfectReactions);
  } else if (roundCorrect === 4) {
    reactionText = randomFrom(closeReactions);
  } else if (roundCorrect === 3 || roundCorrect === 2) {
    reactionText = randomFrom(unimpressedReactions);
  } else {
    reactionText = randomFrom(badReactions);
  }
  pendingReaction = reactionText;

  showRoundRecapOverlay(roundCorrect, answeredCount, leftoverBonus, fractionBonus, roundScore, reactionText);
}
function showCorrectLine(card, correctRuntime) {
  const line = document.createElement("div");
  line.style.fontSize = "12px";
  line.style.marginTop = "5px";
  line.innerText = `Correct: ${correctRuntime} min`;
  card.appendChild(line);
}
function showRoundRecapOverlay(roundCorrect, answeredCount, leftoverBonus, fractionBonus, roundScore, reactionText) {
  const overlay = document.getElementById("round-recap-overlay");
  const title = document.getElementById("round-recap-title");
  const details = document.getElementById("round-recap-details");
  const reactionP = document.getElementById("round-recap-reaction");

  title.innerText = `Round ${currentRoundIndex + 1} Recap`;
  details.innerHTML = `
    Correct: <strong>${roundCorrect}</strong> / 5<br>
    Time bonus: <strong>+${leftoverBonus.toFixed(0)}</strong><br>
    Accuracy bonus: <strong>+${fractionBonus.toFixed(0)}</strong><br>
    Round Score: <strong>${roundScore.toFixed(0)}</strong>
  `;
  reactionP.innerText = reactionText;

  overlay.style.display = "block";
}
function nextRoundAfterRecap() {
  document.getElementById("round-recap-overlay").style.display = "none";
  document.getElementById("submit-btn").style.display = "block";
  currentRoundIndex++;
  startRound();
}

/*******************************************************
 * JOKER
 *******************************************************/
function useJoker() {
  if (jokerUsed) return;
  jokerUsed = true;
  document.getElementById("joker-btn").style.display = "none";

  const snd = document.getElementById("joker-sound");
  snd.currentTime = 0;
  snd.play().catch(() => {});

  const roundMovies = rounds[currentRoundIndex];
  const sorted = [...roundMovies].sort((a, b) => b.runtime - a.runtime);
  const greenShades = ["#003300", "#006600", "#009900", "#00CC00", "#00FF00"];
  const originals = [];

  sorted.forEach((m, idx) => {
    const card = document.querySelector(`.movie-card[data-id="${m.id}"]`);
    if (!card) {
      console.warn("Joker: could not find a card for movie ID:", m.id, m.movie_name);
      return;
    }
    originals.push({ card, bg: card.style.backgroundColor, bc: card.style.borderColor });
    card.style.backgroundColor = greenShades[idx];
    card.style.borderColor = greenShades[idx];
  });

  setTimeout(() => {
    originals.forEach(o => {
      o.card.style.backgroundColor = "#000";
      o.card.style.borderColor = "white";
    });
  }, 5000);
}

/*******************************************************
 * BONUS ROUND
 *******************************************************/
function startBonusActual() {
  if (bonusStarted) return;
  bonusStarted = true;
  document.getElementById("bonus-intro").style.display = "none";
  document.getElementById("bonus-timer-box").style.display = "flex";
  document.getElementById("bonus-floating-container").style.display = "grid";
  document.getElementById("bonus-continue-btn").style.display = "none";
  startBonusRound();
}
function startBonusRound() {
  bonusUsed = false;
  bonusTimeLeft = 10;
  let pool = shuffle(filteredMovies.slice());
  if (pool.length < 5) pool = allMovies.slice();
  bonusMovies = pool.slice(0, 5);

  const container = document.getElementById("bonus-floating-container");
  container.innerHTML = "";
  bonusMovies.forEach(m => {
    const card = document.createElement("div");
    card.classList.add("floating-card");
    if (m.poster) {
      const img = document.createElement("img");
      img.src = m.poster;
      img.classList.add("bonus-poster");
      card.appendChild(img);
    }
    const runtimeLine = document.createElement("div");
    runtimeLine.classList.add("bonus-runtime");
    runtimeLine.innerText = `${m.runtime} min`;
    card.appendChild(runtimeLine);

    card.addEventListener("click", () => pickBonusMovie(m, card));
    container.appendChild(card);
  });
  setupBonusTimer();
  document.getElementById("bonus-message").innerText = "";
  document.getElementById("bonus-result").innerText = "";
}
function setupBonusTimer() {
  clearInterval(bonusTimer);
  const box = document.getElementById("bonus-timer-box");
  const val = document.getElementById("bonus-timer-value");
  val.innerText = bonusTimeLeft;
  box.style.color = "white";
  box.style.borderColor = "#444";

  bonusTimer = setInterval(() => {
    bonusTimeLeft--;
    val.innerText = bonusTimeLeft;
    if (bonusTimeLeft <= 3) {
      box.style.color = "red";
      box.style.borderColor = "red";
    } else if (bonusTimeLeft <= 5) {
      box.style.color = "orange";
      box.style.borderColor = "orange";
    }
    if (bonusTimeLeft <= 0) {
      clearInterval(bonusTimer);
      if (!bonusUsed) {
        document.getElementById("bonus-message").innerText = "Time's up! No pick made.";
        document.getElementById("bonus-continue-btn").style.display = "inline-block";
      }
    }
  }, 1000);
}
function pickBonusMovie(chosenMovie, chosenCard) {
  if (bonusUsed) return;
  bonusUsed = true;
  clearInterval(bonusTimer);

  let maxRuntime = -1, maxMovie = null;
  bonusMovies.forEach(m => {
    if (m.runtime > maxRuntime) {
      maxRuntime = m.runtime;
      maxMovie = m;
    }
  });
  const correct = (chosenMovie.runtime === maxRuntime);
  chosenCard.classList.add(correct ? "correct" : "incorrect");
  if (correct) {
    totalScore += 1000;
    document.getElementById("bonus-message").innerText = "Correct! +1000 points.";
  } else {
    document.getElementById("bonus-message").innerText = `Sorry, it was ${maxMovie.movie_name} (${maxRuntime} min).`;
  }
  // Reveal all runtimes
  const allCards = document.querySelectorAll("#bonus-floating-container .floating-card");
  allCards.forEach(c => {
    const rt = c.querySelector(".bonus-runtime");
    if (rt) rt.style.display = "block";
  });
  document.getElementById("bonus-continue-btn").style.display = "inline-block";

  // ***** SUBMIT SCORE HERE (no popup) *****
  submitScoreToAirtableQuietly();
}
function onFinishBonus() {
  document.getElementById("bonus-container").style.display = "none";
  showFinalScreen();
}

/*******************************************************
 * FINAL SCREEN
 *******************************************************/
function showFinalScreen() {
  document.getElementById("final-container").style.display = "flex";

  // Show final total
  const accuracy = (totalCorrect / 25) * 100;
  const skill = totalAnswered ? (totalDifference / totalAnswered) : 0;
  document.getElementById("final-scores").innerText = `Final Score: ${Math.round(totalScore)}`;

  const overallBox = document.getElementById("final-overall-box");
  overallBox.innerHTML = `Accuracy: ${accuracy.toFixed(1)}% | Skill: ${skill.toFixed(1)} min`;

  // Show final round-by-round breakdown
  const finalCardsContainer = document.getElementById("final-cards-container");
  finalCardsContainer.innerHTML = "";
  rounds.forEach((round, idx) => {
    const wrapper = document.createElement("div");
    wrapper.classList.add("final-round-wrapper");

    const heading = document.createElement("div");
    heading.classList.add("final-round-heading");
    heading.innerText = `Round ${idx + 1}`;
    wrapper.appendChild(heading);

    const rowDiv = document.createElement("div");
    rowDiv.classList.add("final-round-row");
    round.forEach(movie => {
      const actual = movie.runtime;
      const assigned = (movie._assignedRuntime !== null) ? movie._assignedRuntime : "-";
      const isCorrect = (assigned === actual);

      const card = document.createElement("div");
      card.classList.add("final-card");
      if (assigned !== "-") {
        card.classList.add(isCorrect ? "correct" : "incorrect");
      }
      let posterHTML = movie.poster ? `<img class="movie-poster" src="${movie.poster}" alt="${movie.movie_name} poster">` : "";
      card.innerHTML = `
        ${posterHTML}
        <div class="movie-title">${movie.movie_name}</div>
        <div>Actual: ${movie.runtime} min</div>
        <div>Your Pick: ${assigned === "-" ? "-" : assigned + " min"}</div>
      `;
      rowDiv.appendChild(card);
    });
    wrapper.appendChild(rowDiv);

    const roundInfo = roundScores[idx];
    if (roundInfo) {
      const infoDiv = document.createElement("div");
      infoDiv.classList.add("round-breakdown-info");
      infoDiv.innerHTML = `
        ${roundInfo.correct}/5 correct<br>
        Time bonus: +${(roundInfo.leftoverBonus || 0).toFixed(0)}<br>
        Accuracy bonus: +${(roundInfo.fractionBonus || 0).toFixed(0)}<br>
        Round Score: ${roundInfo.roundScore.toFixed(0)}
      `;
      wrapper.appendChild(infoDiv);
    }
    finalCardsContainer.appendChild(wrapper);
  });

  // Show scoreboard for the difficulty just played
  renderFinalDifficultyScoreboard();
}

/*******************************************************
 * SCORE SUBMISSION (Airtable)
 *******************************************************/
function submitScoreToAirtableQuietly() {
  // Called after bonus round is picked
  // We have final totalScore, totalCorrect, totalAnswered, totalDifference, etc.
  // We'll also store 'accuracy' and 'skill'
  const accuracy = (totalCorrect / 25) * 100;
  const skill = totalAnswered ? (totalDifference / totalAnswered) : 0;
  const now = new Date().toISOString();

  const postBody = {
    records: [
      {
        fields: {
          name: playerName,
          timestamp: now,
          difficulty: difficulty,
          score: parseFloat(totalScore),
          accuracy: parseFloat(accuracy.toFixed(3)),
          skill: parseFloat(skill.toFixed(3))
        }
      }
    ]
  };

  fetch(AIRTABLE_TABLE_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${AIRTABLE_API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(postBody)
  })
  .then(resp => resp.json())
  .then(data => {
    console.log("Airtable quiet POST response:", data);
    // No popup. If error, it just logs.
  })
  .catch(err => {
    console.error("Error quietly submitting score to Airtable:", err);
  });
}

/*******************************************************
 * LOAD SCOREBOARD (Airtable)
 *******************************************************/
async function loadScoreboardFromAirtable() {
  try {
    const resp = await fetch(AIRTABLE_TABLE_URL, {
      method: "GET",
      headers: { "Authorization": `Bearer ${AIRTABLE_API_TOKEN}` }
    });
    const data = await resp.json();
    if (!data.records) {
      console.warn("No records found in Airtable response:", data);
      return;
    }

    let easyScores = [];
    let mediumScores = [];
    let hardScores = [];

    data.records.forEach(rec => {
      const f = rec.fields;
      if (!f.name || !f.score || !f.difficulty) return;
      const entry = {
        name: f.name,
        score: parseFloat(f.score) || 0
      };
      const diff = f.difficulty.toLowerCase();
      if (diff === "easy") {
        easyScores.push(entry);
      } else if (diff === "medium") {
        mediumScores.push(entry);
      } else if (diff === "hard") {
        hardScores.push(entry);
      }
    });

    // Sort descending
    easyScores.sort((a,b) => b.score - a.score);
    mediumScores.sort((a,b) => b.score - a.score);
    hardScores.sort((a,b) => b.score - a.score);

    // Deduplicate (Name+Score) so we only show unique combos
    easyScores = deduplicateNameScore(easyScores);
    mediumScores = deduplicateNameScore(mediumScores);
    hardScores = deduplicateNameScore(hardScores);

    // Keep top 10
    easyScores = easyScores.slice(0, 10);
    mediumScores = mediumScores.slice(0, 10);
    hardScores = hardScores.slice(0, 10);

    // Store globally for final usage
    scoreboardEasy = easyScores;
    scoreboardMedium = mediumScores;
    scoreboardHard = hardScores;

    // Render scoreboard tables
    renderScoreboard("scoreboard-easy", scoreboardEasy);
    renderScoreboard("scoreboard-medium", scoreboardMedium);
    renderScoreboard("scoreboard-hard", scoreboardHard);

    // Remove "Loading scoreboard..."
    const loadingEl = document.getElementById("scoreboard-loading");
    if (loadingEl) loadingEl.remove();

  } catch (err) {
    console.error("Error loading scoreboard from Airtable:", err);
  }
}
function renderScoreboard(elementId, scores) {
  const tbody = document.querySelector(`#${elementId} table tbody`);
  if (!tbody) return;
  tbody.innerHTML = "";

  scores.forEach((entry, index) => {
    const tr = document.createElement("tr");

    const rankTd = document.createElement("td");
    rankTd.innerText = index + 1;

    const nameTd = document.createElement("td");
    nameTd.innerText = entry.name;

    const scoreTd = document.createElement("td");
    scoreTd.innerText = entry.score;

    tr.appendChild(rankTd);
    tr.appendChild(nameTd);
    tr.appendChild(scoreTd);
    tbody.appendChild(tr);
  });
}

/*******************************************************
 * FINAL DIFFICULTY SCOREBOARD
 *******************************************************/
function renderFinalDifficultyScoreboard() {
  // Which difficulty was played
  const diff = difficulty.toLowerCase();
  // Copy the scoreboard array
  let arr;
  if (diff === "easy") {
    arr = [...scoreboardEasy];
  } else if (diff === "medium") {
    arr = [...scoreboardMedium];
  } else {
    arr = [...scoreboardHard];
  }

  // Insert the player's final score into that array
  // (since we might have just posted it quietly)
  // We'll do the same deduplicate approach
  const finalScore = parseFloat(totalScore);
  const playerEntry = { name: playerName, score: finalScore };
  arr.push(playerEntry);

  // Re-sort
  arr.sort((a,b) => b.score - a.score);
  arr = deduplicateNameScore(arr);

  // Find player's rank
  const playerIndex = arr.findIndex(e => e.name === playerName && e.score === finalScore);
  const rank = playerIndex >= 0 ? (playerIndex + 1) : arr.length + 1;

  // If rank <= 10, show top 10; else show top 10 plus the player
  let displayArr = arr.slice(0, 10);
  let isInTop10 = (playerIndex < 10 && playerIndex >= 0);

  if (!isInTop10) {
    // We'll show top 10 plus the player's row
    // But only if player isn't already in top 10
    displayArr.push(arr[playerIndex]);
  }

  // Render the table
  const headingEl = document.getElementById("final-diff-heading");
  headingEl.innerText = `Final ${diff.charAt(0).toUpperCase() + diff.slice(1)} Scoreboard`;

  const tableBody = document.querySelector("#final-difficulty-scoreboard table tbody");
  tableBody.innerHTML = "";

  displayArr.forEach((entry, idx) => {
    const tr = document.createElement("tr");

    const rankTd = document.createElement("td");
    rankTd.innerText = (idx + 1);

    const nameTd = document.createElement("td");
    nameTd.innerText = entry.name;

    const scoreTd = document.createElement("td");
    scoreTd.innerText = entry.score;

    tr.appendChild(rankTd);
    tr.appendChild(nameTd);
    tr.appendChild(scoreTd);

    // Highlight the player's row
    if (entry.name === playerName && entry.score === finalScore) {
      tr.style.backgroundColor = "#444";
      tr.style.color = "#FFD700";
    }
    tableBody.appendChild(tr);
  });

  // Optionally show a message if rank > 10
  // Or show rank somewhere if desired
  console.log(`Player rank in ${diff} scoreboard: ${rank}`);
}

/*******************************************************
 * UTILS
 *******************************************************/
function deduplicateNameScore(arr) {
  // Remove duplicates with same name+score
  const seen = new Set();
  return arr.filter(e => {
    const key = e.name + "|" + e.score;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function fadeOutCards(cb) {
  const mc = document.getElementById("movies-container");
  const rc = document.getElementById("runtimes-container");
  mc.style.opacity = "1";
  rc.style.opacity = "1";
  mc.offsetHeight;
  mc.style.opacity = "0";
  rc.style.opacity = "0";
  setTimeout(cb, 500);
}
function fadeInCards() {
  const mc = document.getElementById("movies-container");
  const rc = document.getElementById("runtimes-container");
  mc.style.opacity = "0";
  rc.style.opacity = "0";
  mc.offsetHeight;
  mc.style.opacity = "1";
  rc.style.opacity = "1";
}
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
function getPopcornString(accuracyPercent) {
  return renderPopcorn(accuracyPercent).trim();
}
function renderPopcorn(accuracyPercent) {
  const ratingOutOf5 = (accuracyPercent / 100) * 5;
  const full = Math.floor(ratingOutOf5);
  const frac = ratingOutOf5 - full;
  let html = "";
  for (let i = 0; i < full; i++) {
    html += "🍿";
  }
  if (frac > 0) {
    html += "🍿";
  }
  return html + " ";
}
function updateGameStatsBox() {
  const statsBox = document.getElementById("this-game-stats");
  statsBox.innerText = `Score: ${Math.round(totalScore)}`;
  if (statsBox.classList.contains("empty")) {
    statsBox.classList.remove("empty");
  }
}
function randomFrom(arr) {
  if (!arr || arr.length === 0) return "";
  return arr[Math.floor(Math.random() * arr.length)];
}

/*******************************************************
 * SHARE & COPY
 *******************************************************/
function shareOnTwitter(){
  const accuracy=(totalCorrect/25)*100;
  const skill=totalAnswered?(totalDifference/totalAnswered):0;
  const popcorn=getPopcornString(accuracy);
  const text=`Runtime Challenge Recap:
Score: ${Math.round(totalScore)}
Accuracy: ${popcorn} (${accuracy.toFixed(1)}%)
Skill: ${skill.toFixed(1)}
Think you can beat me?`;
  const url=`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(url,"_blank");
}
function copyRecap(){
  const accuracy=(totalCorrect/25)*100;
  const skill=totalAnswered?(totalDifference/totalAnswered):0;
  const popcorn=getPopcornString(accuracy);
  const text=`Runtime Challenge Recap:
Score: ${Math.round(totalScore)}
Accuracy: ${popcorn} (${accuracy.toFixed(1)}%)
Skill: ${skill.toFixed(1)}
Think you can beat me?`;
  navigator.clipboard.writeText(text).then(()=>{
    alert("Recap copied to clipboard!");
  }).catch(()=>{
    alert("Failed to copy recap. Your browser may not allow clipboard writes.");
  });
}
