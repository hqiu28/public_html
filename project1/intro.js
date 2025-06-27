function myFunction() {
    const mytext1 = document.getElementById("mytext1");
    mytext1.innerHTML="it works!";
    const mytext2 = document.getElementById("mytext2");
    mytext2.innerHTML="This is my script!";
    const myInput = document.getElementById("myinput");
    document.body.style.backgroundColor = myInput.value;
    mytext1.innerHTML = myInput.value;

}

/**
 * Generates a random hex color.
 * @returns {string} A random color in hex format (e.g., "#1A2B3C").
 */
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Change the color of all elements with the class 'myclass' every 3 seconds.
setInterval(() => {
    const elements = document.querySelectorAll('.myclass');
    const newColor = getRandomColor();
    elements.forEach(element => {
        element.style.color = newColor;
    });
}, 3000);


// --- Math Racer Game ---

// Get references to HTML elements for the game
const problemEl = document.getElementById('problem');
const answerEl = document.getElementById('answer');
const submitBtn = document.getElementById('submitBtn');
const carEl = document.getElementById('car');
const feedbackEl = document.getElementById('feedback');

// Game state variables
let correctAnswer;
let carPosition = 0; // Car's position in percentage

/**
 * Generates a new random math problem.
 */
function generateProblem() {
    const operators = ['+', '-', '*', '/'];
    const operator = operators[Math.floor(Math.random() * operators.length)];

    let num1, num2;

    switch (operator) {
        case '+':
            // Addition with numbers up to 25
            num1 = Math.floor(Math.random() * 25) + 1;
            num2 = Math.floor(Math.random() * 25) + 1;
            correctAnswer = num1 + num2;
            break;
        case '-':
            // Subtraction that always results in a positive number
            const tempNum = Math.floor(Math.random() * 25) + 1;
            num1 = tempNum + Math.floor(Math.random() * 15) + 1; // Ensures num1 is always > tempNum
            num2 = tempNum;
            correctAnswer = num1 - num2;
            break;
        case '*':
            // Multiplication with smaller, more manageable numbers
            num1 = Math.floor(Math.random() * 10) + 2; // Numbers from 2 to 11
            num2 = Math.floor(Math.random() * 9) + 2;  // Numbers from 2 to 10
            correctAnswer = num1 * num2;
            break;
        case '/':
            // Division that always results in a whole number
            num2 = Math.floor(Math.random() * 9) + 2; // Divisor from 2 to 10
            const result = Math.floor(Math.random() * 9) + 2; // Result from 2 to 10
            num1 = num2 * result;
            correctAnswer = result;
            break;
    }

    problemEl.textContent = `${num1} ${operator} ${num2} = ?`;
    answerEl.value = ''; // Clear previous answer
    answerEl.focus(); // Put cursor in the input box
}

/**
 * Handles the answer submission.
 */
function checkAnswer() {
    const userAnswer = parseInt(answerEl.value, 10);

    if (userAnswer === correctAnswer) {
        feedbackEl.textContent = 'Correct! Vroom!';
        feedbackEl.style.color = 'green';

        carPosition += 10; // Move 10% each time
        if (carPosition >= 90) { // Reached the end
            carPosition = 90;
            feedbackEl.textContent = 'You reached the finish line! 🎉';
        }
        carEl.style.left = carPosition + '%';

        if (carPosition < 90) {
            setTimeout(generateProblem, 1000); // Generate a new problem after a delay
        }
    } else {
        feedbackEl.textContent = 'Wrong answer, try again!';
        feedbackEl.style.color = 'red';
    }
}

// Add event listeners only if the game elements exist on the page
if (submitBtn && answerEl) {
    submitBtn.addEventListener('click', checkAnswer);
    answerEl.addEventListener('keyup', (event) => event.key === 'Enter' && checkAnswer());
    generateProblem(); // Start the game by generating the first problem
}


// --- Lyrics Finder ---

// Get references to HTML elements for the lyrics finder
const artistNameEl = document.getElementById('artistName');
const songTitleEl = document.getElementById('songTitle');
const dramaNameEl = document.getElementById('dramaName');
const findLyricsBtn = document.getElementById('findLyricsBtn');
const lyricsContainerEl = document.getElementById('lyricsContainer');

/**
 * Fetches lyrics from an API and displays them.
 */
async function fetchLyrics() {
    const artist = artistNameEl.value.trim();
    const title = songTitleEl.value.trim();
    const drama = dramaNameEl.value.trim();

    if (!artist || !title) {
        lyricsContainerEl.textContent = 'Please enter both an artist and a song title.';
        return;
    }

    lyricsContainerEl.textContent = 'Searching for lyrics...';

    try {
        const response = await fetch(`https://api.lyrics.ovh/v1/${artist}/${title}`);
        
        if (!response.ok) {
            let errorMessage = `Sorry, lyrics for "${title}" by ${artist}`;
            if (drama) {
                errorMessage += ` (from "${drama}")`;
            }
            errorMessage += ` could not be found. Please check the spelling.`;
            lyricsContainerEl.textContent = errorMessage;
            return;
        }

        const data = await response.json();
        let lyricsText = data.lyrics || 'No lyrics found for this song.';
        if (data.lyrics && drama) {
            const header = `Lyrics for "${title}" by ${artist}\n(from the drama "${drama}")\n\n--------------------------------\n\n`;
            lyricsText = header + lyricsText;
        }
        lyricsContainerEl.textContent = lyricsText;
    } catch (error) {
        console.error('Error fetching lyrics:', error);
        lyricsContainerEl.textContent = 'An error occurred while fetching lyrics. Please try again later.';
    }
}

if (findLyricsBtn && artistNameEl && songTitleEl && dramaNameEl) {
    findLyricsBtn.addEventListener('click', fetchLyrics);
    // Add event listeners to trigger search on "Enter" key press
    artistNameEl.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') fetchLyrics();
    });
    songTitleEl.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') fetchLyrics();
    });
    dramaNameEl.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') fetchLyrics();
    });
}


// --- K-Pop Guessing Game ---

// A small database of K-Pop songs
const kpopSongs = [
    { artist: "IVE", title: "LOVE DIVE", lyric: "Neoga mangseorineun geu sungan, eojjeomyeon" },
    { artist: "BLACKPINK", title: "DDU-DU DDU-DU", lyric: "Chakhan eolgure geureochi mothan taedo" },
    { artist: "NewJeans", title: "Hype Boy", lyric: "Cause I know what you like boy, you're my chemical hype boy" },
    { artist: "LE SSERAFIM", title: "ANTIFRAGILE", lyric: "Deo bureobwa haneul wie nan, taeyangkkaji daheul teni" },
    { artist: "BTS", title: "Dynamite", lyric: "Shining through the city with a little funk and soul" },
    { artist: "(G)I-DLE", title: "Queencard", lyric: "I'm a queencard, I'm a queencard, I'm a, I'm a, I'm a queencard" },
    { artist: "TWICE", title: "FANCY", lyric: "Jigeum haneul gureum saegeun Tropical yeah" },
    { artist: "Stray Kids", title: "God's Menu", lyric: "Ne sonnim, ije deureogaja" },
    { artist: "ITZY", title: "WANNABE", lyric: "Jansorineun stop it, araseo halge" },
    { artist: "aespa", title: "Next Level", lyric: "I'm on the next level yeah, jeoldaejeok rureul jikyeo" },
    { artist: "SEVENTEEN", title: "Super", lyric: "Darimdarimda, gureuma, biya, naeryeora" },
    { artist: "Red Velvet", title: "Psycho", lyric: "Urin jeongmal byeollago isanghan saiya" }
];

// Get references to HTML elements for the game
const lyricSnippetEl = document.getElementById('lyric-snippet');
const kpopChoicesContainerEl = document.getElementById('kpop-choices-container');
const newKpopSongBtn = document.getElementById('newKpopSongBtn');
const kpopFeedbackEl = document.getElementById('kpop-feedback');

let currentKpopSong = null;

/**
 * Selects a new random song and displays its lyric snippet, artist hint, and multiple choice options.
 */
function displayNewKpopLyric() {
    currentKpopSong = kpopSongs[Math.floor(Math.random() * kpopSongs.length)];
    lyricSnippetEl.textContent = `"${currentKpopSong.lyric}"`;
    
    kpopFeedbackEl.textContent = '';
    kpopChoicesContainerEl.innerHTML = ''; // Clear previous choices

    // Create a list of choices
    const choices = [currentKpopSong.title];
    const distractors = kpopSongs.filter(song => song.title !== currentKpopSong.title);

    // Get 2 random distractors
    while (choices.length < 3 && distractors.length > 0) {
        const randomIndex = Math.floor(Math.random() * distractors.length);
        choices.push(distractors.splice(randomIndex, 1)[0].title);
    }

    // Shuffle the choices
    for (let i = choices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [choices[i], choices[j]] = [choices[j], choices[i]];
    }

    // Create and display buttons for each choice
    choices.forEach(choiceTitle => {
        const choiceBtn = document.createElement('button');
        choiceBtn.textContent = choiceTitle;
        choiceBtn.addEventListener('click', handleKpopChoice);
        kpopChoicesContainerEl.appendChild(choiceBtn);
    });
}

/**
 * Handles the user's choice, provides feedback, and loads the next song.
 */
function handleKpopChoice(event) {
    if (!currentKpopSong) return;

    const selectedTitle = event.target.textContent;
    const choiceButtons = kpopChoicesContainerEl.querySelectorAll('button');

    // Disable all buttons and provide visual feedback
    choiceButtons.forEach(button => {
        button.disabled = true;
        if (button.textContent === currentKpopSong.title) {
            button.style.backgroundColor = 'lightgreen';
        }
    });

    if (selectedTitle === currentKpopSong.title) {
        kpopFeedbackEl.textContent = `Correct! It's "${currentKpopSong.title}" by ${currentKpopSong.artist}! 🎉`;
        kpopFeedbackEl.style.color = 'green';
    } else {
        event.target.style.backgroundColor = 'salmon';
        kpopFeedbackEl.textContent = 'Not quite! The correct answer is highlighted above.';
        kpopFeedbackEl.style.color = 'red';
    }

    // Load a new song after a delay
    setTimeout(displayNewKpopLyric, 3000);
}

// Add event listeners if the game elements exist
if (newKpopSongBtn && kpopChoicesContainerEl) {
    newKpopSongBtn.addEventListener('click', displayNewKpopLyric);
}