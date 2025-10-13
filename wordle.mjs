import { SkyMass } from "@skymass/skymass";

const sm = new SkyMass({ key: process.env["SKYMASS_KEY"] });

const WORDS = ["APPLE", "BRAVE", "CRANE", "DANCE", "EPOCH"];

const maxGuesses = 6;

let playerWon = false;

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
  ui.md`This is Wordle using SkyMass. You have **6** tries to guess the word.  
  You will be given feedback for each letter of your guess in the table below.  
  **Green** means the letter is in the word and in the correct spot.  
  **Blue** means the letter is in the word but in the wrong spot.  
  **Red** means the letter is not in the word.`


  const { answer, guesses } = ui.getState(() => ({
    answer: pickWord(),
    guesses: [],
  }));
  const { currentGuess } = ui.getState(() => ({ currentGuess: "hey" }));

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

  if (guesses.length >= maxGuesses) {
    if (guesses[guesses.length - 1].word === answer) {
      playerWon = true;
    } else {
      ui.md`**Game over! The answer was ${answer}**`;
      const restart = ui.button("restart", { label: "Play Again" });
      if (restart.didClick) {
        ui.setState(() => ({
          answer: pickWord(),
          guesses: [],
        }));
      }
      return;
    }
  }

  if (playerWon) {
    ui.md`**You guessed it! Click the button below to play again!**`;
    const restart = ui.button("restart", { label: "Play Again" });
    if (restart.didClick) {
      ui.setState(() => ({
        answer: pickWord(),
        guesses: [],
      }));
      playerWon = false;
    }
    return;
  }

  const guessForm = ui.form("guess_form", {
    fields: {
      guess: ui.string("guess", {
        label: "Enter your guess",
        placeholder: "Enter guess here",
        val: currentGuess,
        required: true,
        minLength: 5,
        maxLength: 5,
      }),
    },
    action: ui.submitButton("submit", { label: "Submit" }),
  });

  if (guessForm.didSubmit) {
    const guessWord = guessForm.val.guess.toUpperCase();
    const feedback = computeFeedback(guessWord, answer);

    ui.setState(({ guesses }) => ({
      guesses: [...guesses, { word: guessWord, feedback }],
    }));

    if (guessWord === answer) {
      playerWon = true;
    }
  }
});
