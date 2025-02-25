<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Runtime Challenge v5.4</title>
  <!-- Link to your external CSS -->
  <link rel="stylesheet" href="runtimes.css">
</head>
<body>
  <!-- NAVIGATION BAR -->
  <nav id="navBar">
    <a href="index.html">Oscer Bingo</a>
    <a href="runtimes.html">Runtime Challenge</a>
    <a href="runtime_dream.html">Runtime Dream</a>
  </nav>

  <!-- INTRO SCREEN -->
  <div id="intro-container" class="page-container">
    <h1>Runtime Challenge</h1>
    <div class="intro-rules">
      <p>In this game, you'll be given 5 movies each round.</p>
      <p>Drag (or tap) the runtime card to the movie you think it belongs to.</p>
      <p>You have a limited time each round and can submit early for a time bonus.</p>
      <p>Use your <strong>Joker</strong> once at the start of the round.</p>
    </div>
    <input id="playerNameInput" type="text" placeholder="Enter 6-letter name" maxlength="6">
    <div class="difficulty-box">
      <label style="font-size:16px; margin-right:10px;">Difficulty:</label>
      <button class="diff-btn" data-difficulty="easy" id="easy-btn">Easy</button>
      <button class="diff-btn" data-difficulty="medium" id="medium-btn">Medium</button>
      <button class="diff-btn" data-difficulty="hard" id="hard-btn">Hard</button>
    </div>
    <button id="begin-btn" class="game-btn" disabled>Begin</button>
    <div class="version-number">v5.4</div>
  </div>

  <!-- ROUND RECAP OVERLAY -->
  <div id="round-recap-overlay">
    <h3 id="round-recap-title"></h3>
    <p id="round-recap-details"></p>
    <button id="round-recap-close-btn" class="game-btn" style="font-size:16px; padding:6px 12px;">OK</button>
  </div>

  <!-- REACTION OVERLAY -->
  <div id="reaction-overlay">
    <p id="reaction-quote"></p>
    <button id="reaction-close-btn" class="game-btn">OK</button>
  </div>

  <!-- GAME SCREEN -->
  <div id="game-container" class="page-container">
    <div id="timer-box">
      <div id="round-label">Round 1</div>
      <div id="timer-value">20</div>
      <button id="joker-btn" class="glow-anim" title="Reveal relative runtimes briefly">🤡</button>
    </div>
    <div id="runtimes-container" class="cards-container"></div>
    <div id="movies-container" class="cards-container"></div>
    <button id="submit-btn" class="game-btn" title="Submit early to earn extra time bonus!">Submit</button>
    <div id="this-game-stats" class="stats-box empty"></div>
  </div>

  <!-- BONUS ROUND (Grid Layout) -->
  <div id="bonus-container" class="page-container">
    <div id="bonus-intro" style="max-width:600px; margin-bottom:20px;">
      <p><strong>Bonus Round!</strong> Pick which movie has the longest runtime for +1000 points. 
         You have a short time, so choose quickly!</p>
      <button id="bonus-begin-btn" class="game-btn">Begin Bonus</button>
    </div>
    <div id="bonus-timer-box" style="display:none;"><span id="bonus-timer-value">10</span></div>
    <h3 id="bonus-message"></h3>
    <div id="bonus-floating-container"></div>
    <button id="bonus-continue-btn" class="game-btn" style="display:none;">Continue</button>
    <div id="bonus-result"></div>
  </div>

  <!-- FINAL SCREEN -->
  <div id="final-container" class="page-container">
    <div id="final-scores"></div>
    <div id="final-overall-box"></div>
    <div class="final-buttons">
      <button id="share-twitter-btn" class="game-btn">Share on Twitter</button>
      <button id="copy-recap-btn" class="game-btn">Copy Recap</button>
      <button id="play-again-btn" class="game-btn">Play Again?</button>
      <button id="submit-score-btn" class="game-btn">Submit Score</button>
    </div>
    <div id="details-container">
      <div id="final-cards-container"></div>
    </div>
  </div>

  <!-- SOUND EFFECTS -->
  <audio id="ding-sound" src="data:audio/wav;base64,UklGRgAAAABXQVZFZm10IBIAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA="></audio>
  <audio id="buzz-sound" src="data:audio/wav;base64,UklGRgAAAABXQVZFZm10IBIAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA="></audio>
  <!-- AUDIO FOR JOKER -->
  <audio id="joker-sound" preload="auto">
    <source src="data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=" type="audio/wav">
  </audio>

  <!-- Link to external JS at bottom -->
  <script src="runtimes.js"></script>
</body>
</html>
