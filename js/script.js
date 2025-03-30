const sentences = {
    easy: [
        "The quick brown fox jumps over the lazy dog.",
        "A journey of a thousand miles begins with a single step.",
        "All that glitters is not gold.",
        "The early bird catches the worm.",
        "Actions speak louder than words.",
        "Don't judge a book by its cover.",
        "Practice makes perfect.",
        "Where there's a will, there's a way.",
        "You can't teach an old dog new tricks.",
        "Better late than never."
    ],
    medium: [
        "The greatest glory in living lies not in never falling, but in rising every time we fall.",
        "The way to get started is to quit talking and begin doing.",
        "Your time is limited, so don't waste it living someone else's life.",
        "If life were predictable it would cease to be life, and be without flavor.",
        "If you look at what you have in life, you'll always have more.",
        "Life is what happens when you're busy making other plans.",
        "Spread love everywhere you go. Let no one ever come to you without leaving happier.",
        "When you reach the end of your rope, tie a knot in it and hang on.",
        "Always remember that you are absolutely unique. Just like everyone else.",
        "The future belongs to those who believe in the beauty of their dreams."
    ],
    hard: [
        "Success is not final, failure is not fatal: It is the courage to continue that counts. Winston Churchill's wisdom reminds us of the importance of perseverance.",
        "Education is the most powerful weapon which you can use to change the world. Nelson Mandela understood that knowledge creates opportunity for transformation.",
        "The only limit to our realization of tomorrow will be our doubts of today. Franklin D. Roosevelt encouraged people to overcome their fears and uncertainties.",
        "In the end, it's not the years in your life that count. It's the life in your years. Abraham Lincoln's profound statement about quality over quantity remains relevant.",
        "Life is 10% what happens to us and 90% how we react to it. Charles R. Swindoll's perspective highlights the importance of our response to circumstances.",
        "The greatest glory in living lies not in never falling, but in rising every time we fall. Nelson Mandela's words inspire resilience in the face of adversity.",
        "The way to get started is to quit talking and begin doing. Walt Disney's practical advice cuts through procrastination and encourages action over words.",
        "Your time is limited, so don't waste it living someone else's life. Steve Jobs reminded us to follow our own path rather than conforming to others' expectations.",
        "Spread love everywhere you go. Let no one ever come to you without leaving happier. Mother Teresa's philosophy centered on making a positive impact in every interaction.",
        "Many of life's failures are people who did not realize how close they were to success when they gave up. Thomas Edison's observation highlights the importance of persistence."
    ]
};

let currentUser = null;
let currentSentence = '';
let startTime = 0;
let timerInterval = null;
let wpmInterval = null;
let currentDifficulty = 'easy';
let isGameActive = false;
let errorCount = 0;
let totalKeystrokes = 0;

let users = JSON.parse(localStorage.getItem('users')) || {};
let scores = JSON.parse(localStorage.getItem('scores')) || {
    easy: [],
    medium: [],
    hard: []
};

const authSection = document.getElementById('auth-section');
const gameSection = document.getElementById('game-section');
const scoreBoardSection = document.getElementById('scoreboard-section');
const gameArea = document.getElementById('game-area');
const userDisplay = document.getElementById('user-display');
const sentenceDisplay = document.getElementById('sentence-display');
const typingInput = document.getElementById('typing-input');
const timerElement = document.getElementById('timer');
const wpmDisplay = document.getElementById('wpm-display');
const accuracyDisplay = document.getElementById('accuracy-display');
const resultMessage = document.getElementById('result-message');
const authMessage = document.getElementById('auth-message');
const scoreboardBody = document.getElementById('scoreboard-body');

typingInput.addEventListener('input', handleTyping);

document.getElementById('password').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        handleLogin();
    }
});

function handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!username || !password) {
        showAuthMessage('Please enter both username and password', 'error');
        return;
    }
    
    const user = users[username];
    
    if (!user) {
        showAuthMessage('User not found!', 'error');
        return;
    }
    
    if (user.password !== password) {
        showAuthMessage('Incorrect password!', 'error');
        return;
    }
    
    currentUser = username;
    saveCurrentUser(); 
    showAuthMessage('Login successful!', 'success');
    
    setTimeout(() => {
        showGameInterface();
    }, 1000);
}

function handleRegister() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!username || !password) {
        showAuthMessage('Please enter both username and password', 'error');
        return;
    }
    
    if (username.length < 3) {
        showAuthMessage('Username must be at least 3 characters long', 'error');
        return;
    }
    
    if (password.length < 4) {
        showAuthMessage('Password must be at least 4 characters long', 'error');
        return;
    }
    
    if (users[username]) {
        showAuthMessage('Username already exists!', 'error');
        return;
    }
    
    users[username] = {
        password: password,
        createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('users', JSON.stringify(users));
    showAuthMessage('Registration successful! You can now login.', 'success');
}

function handleLogout() {
    clearCurrentUser(); 
    currentUser = null;
    stopTimer();
    resetGame();
    showAuthSection();
}

function showAuthMessage(message, type) {
    authMessage.textContent = message;
    authMessage.className = 'message';
    authMessage.classList.add(type);
}

function startGame(difficulty) {
    currentDifficulty = difficulty;
    resetGame();
    
    currentSentence = getRandomSentence(difficulty);
    displaySentence(currentSentence);
    
    
    gameArea.classList.remove('hidden');
    
    typingInput.focus();
    
    startTimer();
    startWpmCounter();
    
    isGameActive = true;
    errorCount = 0;
    totalKeystrokes = 0;
}

function restartGame() {
    startGame(currentDifficulty);
}

function getRandomSentence(difficulty) {
    const sentenceArray = sentences[difficulty];
    const randomIndex = Math.floor(Math.random() * sentenceArray.length);
    return sentenceArray[randomIndex];
}

function displaySentence(sentence) {
    sentenceDisplay.textContent = sentence;
}

function handleTyping(event) {
    if (!isGameActive) return;
    
    const typedText = typingInput.value;
    
    if (event.inputType === 'insertText') {
        totalKeystrokes++;
        
        const currentPosition = typedText.length - 1;
        if (currentPosition >= 0 && 
            (currentPosition >= currentSentence.length || 
             typedText[currentPosition] !== currentSentence[currentPosition])) {
            errorCount++;
        }
    }
    
    updateAccuracy();
    
    highlightErrors(typedText);
    
    if (typedText === currentSentence) {
        isGameActive = false;
        
        clearInterval(timerInterval);
        clearInterval(wpmInterval);
        timerInterval = null;
        wpmInterval = null;
        
        typingInput.disabled = true;
        
        const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        const finalWpm = calculateWPM(currentSentence, elapsedTime);
        const accuracy = calculateAccuracy();
        const score = calculateScore(finalWpm, accuracy, elapsedTime, currentDifficulty);
        
        timerElement.textContent = elapsedTime;
        wpmDisplay.textContent = finalWpm;
        accuracyDisplay.textContent = accuracy;
        
        saveScore(currentDifficulty, elapsedTime, finalWpm, accuracy, score);
        
        resultMessage.innerHTML = `
            <div class="score-display">Your Score: ${score}</div>
            <p>Great job! You completed the 
            <span class="difficulty-badge ${currentDifficulty}-badge">${currentDifficulty}</span>
            level in ${elapsedTime} seconds.</p>
            <p>Typing Speed: ${finalWpm} WPM | Accuracy: ${accuracy}%</p>
        `;
        resultMessage.className = 'message success';
        
        setTimeout(() => {
            showScoreboard(currentDifficulty);
        }, 3000);
        
        return;
    }
}



function calculateAccuracy() {
    if (totalKeystrokes === 0) return 100;
    
    const correctKeystrokes = totalKeystrokes - errorCount;
    return Math.round((correctKeystrokes / totalKeystrokes) * 100);
}

function calculateScore(wpm, accuracy, timeInSeconds, difficulty) {
    let baseScore = wpm * (accuracy / 100);
    
    const difficultyMultiplier = {
        'easy': 1,
        'medium': 1.5,
        'hard': 2.2
    };
    
    baseScore *= difficultyMultiplier[difficulty];
    
    const targetTimes = {
        'easy': 20,  
        'medium': 40, 
        'hard': 80   
    };
    
    
    const targetTime = targetTimes[difficulty];
    const timeEfficiency = Math.min(2, targetTime / timeInSeconds); 
    
    baseScore *= timeEfficiency;
    
    let accuracyBonus = 1;
    if (accuracy > 95) {
        accuracyBonus = 1.2; 
    } else if (accuracy > 98) {
        accuracyBonus = 1.5; 
    } else if (accuracy === 100) {
        accuracyBonus = 2;   
    }
    
    baseScore *= accuracyBonus;
    
    return Math.round(baseScore);
}


function saveScore(difficulty, timeInSeconds, wpm, accuracy, score) {
    if (!currentUser) return;
    
    const scoreEntry = {
        username: currentUser,
        score: score,
        wpm: wpm,
        accuracy: accuracy,
        time: timeInSeconds,
        date: new Date().toISOString()
    };
    
    scores[difficulty].push(scoreEntry);
    
    scores[difficulty].sort((a, b) => b.score - a.score);
    
    localStorage.setItem('scores', JSON.stringify(scores));
}

function startTimer() {
    startTime = Date.now();
    
    timerInterval = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        timerElement.textContent = elapsedSeconds;
    }, 1000);
}

function startWpmCounter() {
    wpmInterval = setInterval(() => {
        if (typingInput.value.length > 0) {
            const elapsedSeconds = (Date.now() - startTime) / 1000;
            const wordCount = typingInput.value.trim().split(/\s+/).length;
            const currentWpm = Math.round((wordCount / elapsedSeconds) * 60);
            wpmDisplay.textContent = currentWpm;
            
            updateAccuracy();
        }
    }, 1000);
}



function updateAccuracy() {
    const accuracy = calculateAccuracy();
    accuracyDisplay.textContent = accuracy;
    
    if (accuracy < 70) {
        accuracyDisplay.style.color = '#f44336'; 
    } else if (accuracy < 90) {
        accuracyDisplay.style.color = '#ff9800'; 
    } else {
        accuracyDisplay.style.color = '#4caf50'; 
    }
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    if (wpmInterval) {
        clearInterval(wpmInterval);
        wpmInterval = null;
    }
    
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    return elapsedSeconds;
}

function resetGame() {
    typingInput.value = '';
    typingInput.disabled = false; 
    resultMessage.textContent = '';
    timerElement.textContent = '0';
    wpmDisplay.textContent = '0';
    accuracyDisplay.textContent = '100';
    accuracyDisplay.style.color = '#4caf50';
    clearInterval(timerInterval);
    clearInterval(wpmInterval);
    errorCount = 0;
    totalKeystrokes = 0;
}


function showGameInterface() {
    authSection.classList.add('hidden');
    gameSection.classList.remove('hidden');
    scoreBoardSection.classList.add('hidden');
    
    userDisplay.textContent = currentUser;
}

function showAuthSection() {
    authSection.classList.remove('hidden');
    gameSection.classList.add('hidden');
    scoreBoardSection.classList.add('hidden');
    
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    authMessage.textContent = '';
}

function showGameSection() {
    authSection.classList.add('hidden');
    gameSection.classList.remove('hidden');
    scoreBoardSection.classList.add('hidden');
}

function showScoreboard(difficulty) {
    document.getElementById('easy-scores').classList.remove('active');
    document.getElementById('medium-scores').classList.remove('active');
    document.getElementById('hard-scores').classList.remove('active');
    
    document.getElementById(`${difficulty}-scores`).classList.add('active');
    
    const difficultyScores = scores[difficulty] || [];
    
    scoreboardBody.innerHTML = '';
    
    difficultyScores.forEach((score, index) => {
        const row = document.createElement('tr');
        
        const rankCell = document.createElement('td');
        rankCell.textContent = index + 1;
        
        const usernameCell = document.createElement('td');
        usernameCell.textContent = score.username;
        
        const scoreCell = document.createElement('td');
        scoreCell.textContent = score.score || 'N/A';
        
        const wpmCell = document.createElement('td');
        wpmCell.textContent = score.wpm || 'N/A';
        
        const accuracyCell = document.createElement('td');
        accuracyCell.textContent = score.accuracy ? `${score.accuracy}%` : 'N/A';
        
        const timeCell = document.createElement('td');
        timeCell.textContent = score.time;
        
        const dateCell = document.createElement('td');
        const date = new Date(score.date);
        dateCell.textContent = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        
        row.appendChild(rankCell);
        row.appendChild(usernameCell);
        row.appendChild(scoreCell);
        row.appendChild(wpmCell);
        row.appendChild(accuracyCell);
        row.appendChild(timeCell);
        row.appendChild(dateCell);
        
        if (score.username === currentUser) {
            row.style.backgroundColor = '#e8f5e9';
        }
        
        
        if (index < 3) {
            rankCell.style.fontWeight = 'bold';
            
            if (index === 0) {
                rankCell.style.color = '#ffd700';
            } else if (index === 1) {
                rankCell.style.color = '#c0c0c0'; 
            } else if (index === 2) {
                rankCell.style.color = '#cd7f32'; 
            }
        }
        
        scoreboardBody.appendChild(row);
    });
    
    authSection.classList.add('hidden');
    gameSection.classList.add('hidden');
    scoreBoardSection.classList.remove('hidden');
}

function isLocalStorageAvailable() {
    try {
        const test = 'test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch(e) {
        return false;
    }
}

function saveCurrentUser() {
    if (isLocalStorageAvailable() && currentUser) {
        localStorage.setItem('currentUser', currentUser);
    }
}

function clearCurrentUser() {
    if (isLocalStorageAvailable()) {
        localStorage.removeItem('currentUser');
    }
}

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && isGameActive) {
        restartGame();
    }
    
    if (event.key === 'Enter' && !authSection.classList.contains('hidden')) {
        if (document.activeElement === document.getElementById('username') || 
            document.activeElement === document.getElementById('password')) {
            handleLogin();
        }
    }
});

function startCountdown(difficulty) {
    gameArea.classList.remove('hidden');
    sentenceDisplay.textContent = "Get ready...";
    
    let count = 3;
    const countdownInterval = setInterval(() => {
        if (count > 0) {
            sentenceDisplay.textContent = count.toString();
            count--;
        } else {
            clearInterval(countdownInterval);
            startGame(difficulty);
        }
    }, 1000);
}

function getUserStats() {
    if (!currentUser) return null;
    
    let totalGames = 0;
    let totalScore = 0;
    let bestWpm = 0;
    let bestAccuracy = 0;
    
    Object.keys(scores).forEach(difficulty => {
        const userScores = scores[difficulty].filter(score => score.username === currentUser);
        totalGames += userScores.length;
        
        userScores.forEach(score => {
            totalScore += score.score || 0;
            bestWpm = Math.max(bestWpm, score.wpm || 0);
            bestAccuracy = Math.max(bestAccuracy, score.accuracy || 0);
        });
    });
    
    const avgScore = totalGames > 0 ? Math.round(totalScore / totalGames) : 0;
    
    return {
        totalGames,
        avgScore,
        bestWpm,
        bestAccuracy
    };
}

function init() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = savedUser;
        showGameInterface();
    } else {
        showAuthSection();
    }
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', handleDeleteAccount);
    }
    
}

function highlightErrors(typedText) {
    let htmlContent = '';
    
    for (let i = 0; i < currentSentence.length; i++) {
        if (i < typedText.length) {
            if (typedText[i] === currentSentence[i]) {
                htmlContent += `<span class="correct">${currentSentence[i]}</span>`;
            } else {
                htmlContent += `<span class="error">${currentSentence[i]}</span>`;
            }
        } else {
            htmlContent += currentSentence[i];
        }
    }
    
    if (typedText.length > currentSentence.length) {
        htmlContent += `<span class="error">${typedText.substring(currentSentence.length)}</span>`;
    }
    
    sentenceDisplay.innerHTML = htmlContent;
}

function calculateWPM(text, timeInSeconds) {
    const wordCount = text.trim().split(/\s+/).length;
    
    const wpm = Math.round((wordCount / timeInSeconds) * 60);
    
    return wpm;
}
function handleDeleteAccount() {
    const confirmDelete = confirm("Are you sure you want to delete your account? This action cannot be undone.");
    
    if (!confirmDelete) {
        return; 
    }
    
    const password = prompt("Please enter your password to confirm account deletion:");
    
    if (!password) {
        return; 
    }
    
    if (users[currentUser] && users[currentUser].password === password) {
        
        delete users[currentUser];
        
        Object.keys(scores).forEach(difficulty => {
            scores[difficulty] = scores[difficulty].filter(score => score.username !== currentUser);
        });
        
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('scores', JSON.stringify(scores));
        
        clearCurrentUser();
        currentUser = null;
        
        alert("Your account has been successfully deleted.");
        showAuthSection();
    } else {
        alert("Incorrect password. Account deletion canceled.");
    }
}

document.getElementById('delete-account-btn').addEventListener('click', handleDeleteAccount);

window.onload = init;
