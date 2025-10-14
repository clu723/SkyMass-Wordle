import { SkyMass } from "@skymass/skymass";

const sm = new SkyMass({ key: process.env["SKYMASS_KEY"] });

const WORDS = ["APPLE", "BRAVE", "CRANE", "DANCE", "EPOCH"];

const maxGuesses = 6;

const gameStats = [];


function pickWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function computeFeedback(guess, answer) {
  const result = Array(guess.length).fill("absent");
  const freq = {};

  for (const char of answer) {
    freq[char] = (freq[char] || 0) + 1;
  }

  // correct
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === answer[i]) {
      result[i] = "correct";
      freq[guess[i]]--;
    }
  }

  // present
  for (let i = 0; i < guess.length; i++) {
    if (result[i] === "correct") {
      continue;
    }
    const char = guess[i];
    if (freq[char] && freq[char] > 0) {
      result[i] = "present";
      freq[char]--;
    }
  }

  return result;
}

sm.page("/wordle", (ui) => {
  const nav = ui.nav("main_nav", {
    queryParam: true,         
    appearance: "tabs",       
    defaultVal: "wordle",     
    options: [
      { value: "wordle", label: "Wordle", icon: "gamepad" },
      { value: "dashboard", label: "Dashboard", icon: "bar-chart-2" },
    ],
  });

  switch (nav.val) {
    case "wordle":
      return ui.region("wordle", (ui) => {
        playWordle(ui);
      });

    case "dashboard":
      return ui.region("dashboard", (ui) => {
        showDashboard(ui);
      });
  }
});

function playWordle(ui) {
  ui.md`This is Wordle using SkyMass. You have **6** tries to guess the word.  
  You will be given feedback for each letter of your guess in the table below.  
  **Green** means the letter is in the word and in the correct spot.  
  **Blue** means the letter is in the word but in the wrong spot.  
  **Red** means the letter is not in the word.`

  const { answer, guesses, startTime, gameRecorded } = ui.getState(() => ({
    answer: pickWord(),
    guesses: [],
    startTime: Date.now(),
    gameRecorded: false,
  }));
  const { currentGuess } = ui.getState(() => ({ currentGuess: "" }));

  const { playerWon } = ui.getState(() => ({
    playerWon: false
  }))

  function pushToGameStat(result) {
    gameStats.push({
      player: ui.user?.name || "Guest",
      won: result === "won",
      guesses: guesses.length,
      word: answer,
      timeTaken: Math.floor((Date.now() - startTime) / 1000),
      timestamp: new Date(),
    });
  }

  const rows = guesses.map((guess, index) => ({
    id: index + 1,
    word: guess.word,
    feedback: guess.word.split("").map((char, idx) => {
      const status = guess.feedback[idx];
      let color = "default";

      if (status === "correct") {
        color = "success";
      } else if (status === "present") {
        color = "info";
      } else {
        color = "error";
      }
      
      return { label: char, color };
    }),
  }));

  ui.table("Previous guesses", 
    rows, {
    columns: {
      id: { isId: true, label: "Guess #" },
      word: { label: "Word" },
      feedback: { label: "Feedback", format: "pill" },
      "*": { search: false },
    },
    size: "rows",
  });

  if (playerWon && !gameRecorded) {
    pushToGameStat("won");
    ui.setState(() => ({ gameRecorded: true }));
  }

  if (playerWon) {
    ui.md`**You guessed it! Click the button below to play again!**`;
    
    const restart = ui.button("restart", { label: "Play Again" });
    if (restart.didClick) {
      ui.setState(() => ({
        answer: pickWord(),
        guesses: [],
        playerWon: false,
        startTime: Date.now(),
        gameRecorded: false,
      }));
    }
    return;
  }

  if (guesses.length >= maxGuesses && !playerWon && !gameRecorded) {
    pushToGameStat("lost");
    ui.setState(() => ({ gameRecorded: true }));
  }

  if (guesses.length >= maxGuesses) {
    ui.md`**Game over! The answer was ${answer}**`;

    const restart = ui.button("restart", { label: "Play Again" });
    if (restart.didClick) {
      ui.setState(() => ({
        answer: pickWord(),
        guesses: [],
        playerWon: false,
        startTime: Date.now(),
        gameRecorded: false,
      }));
    }
    return;
  }

  const guessInput = ui.string("guess", {
    label: "Make a guess!",
    placeholder: "Enter guess here",
    required: true,
    minLength: 5,
    maxLength: 5,
  });

  const submitBtn = ui.button("submit_guess", {
    label: "Submit",
    disabled: !guessInput.isReady,
  });

  if (submitBtn.didClick) {
    const guessWord = guessInput.val.toUpperCase();
    const feedback = computeFeedback(guessWord, answer);

    ui.setState(({ guesses }) => ({
      guesses: [...guesses, { word: guessWord, feedback }],
    }));

    if (guessWord === answer) {
      ui.setState(() => ({ playerWon: true })); 
    }

    guessInput.setVal("");
    guessInput.focus();
  }
}

function showDashboard(ui) {
  ui.md`# Game Stats Dashboard`;

  if (gameStats.length === 0) {
    ui.md`No games played yet!`;
    return;
  }

  const totalGames = gameStats.length;
  const totalWins = gameStats.filter(g => g.won).length;
  const avgGuesses = (gameStats.reduce((sum, g) => sum + g.guesses, 0) / totalGames).toFixed(2);
  const winRate = ((totalWins / totalGames) * 100).toFixed(1);

  const overviewData = [{
    totalGames: totalGames, 
    totalWins: totalWins, 
    avgGuesses: avgGuesses, 
    winRate: winRate
  }];

  ui.table("Overview", overviewData, {
    columns: {
      totalGames: { label: "Total Games" },
      totalWins: { label: "Total Wins" },
      avgGuesses: { label: "Average Guesses" },
      winRate: { label: "Win Rate " },
    }
  });

  ui.table("Game History", gameStats, {
    columns: {
      player: { label: "Player" },
      won: { label: "Won" },
      guesses: { label: "Guesses" },
      word: {label: "Word" },
      timeTaken: { label: "Time (s)" },
      timestamp: { label: "Played At" }
    }
  });
};

