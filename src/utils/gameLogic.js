// Türkçe karakterleri normalize et (büyük harfe çevir)
export const normalizeChar = (char) => {
  const turkishMap = {
    'i': 'İ',
    'ı': 'I',
    'ğ': 'Ğ',
    'ü': 'Ü',
    'ş': 'Ş',
    'ö': 'Ö',
    'ç': 'Ç',
  };
  const upperChar = char.toUpperCase();
  return turkishMap[char] || upperChar;
};

// Kelimeyi normalize et (tüm harfleri büyük yap)
export const normalizeWord = (word) => {
  return word.split('').map(normalizeChar).join('');
};

// Günlük kelimeyi seç (tarih bazlı)
export const getDailyWord = (words) => {
  const today = new Date();
  const startDate = new Date('2026-01-01');
  const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
  const index = daysSinceStart % words.length;
  return words[index];
};

// Tahmin sonuçlarını hesapla
export const evaluateGuess = (guess, solution) => {
  const result = [];
  const solutionArray = solution.split('');
  const guessArray = guess.split('');
  const solutionCharCount = {};
  
  // Çözümdeki harf sayılarını say
  solutionArray.forEach(char => {
    solutionCharCount[char] = (solutionCharCount[char] || 0) + 1;
  });
  
  // İlk geçiş: Doğru pozisyonları bul
  guessArray.forEach((char, i) => {
    if (char === solutionArray[i]) {
      result[i] = 'correct';
      solutionCharCount[char]--;
    }
  });
  
  // İkinci geçiş: Yanlış pozisyonları ve olmayanları bul
  guessArray.forEach((char, i) => {
    if (result[i]) return; // Zaten işaretlendi
    
    if (solutionCharCount[char] > 0) {
      result[i] = 'present';
      solutionCharCount[char]--;
    } else {
      result[i] = 'absent';
    }
  });
  
  return result;
};

// Klavye için harf durumlarını güncelle
export const updateKeyboardStatus = (currentStatus, guess, evaluation) => {
  const newStatus = { ...currentStatus };
  const statusPriority = { 'correct': 3, 'present': 2, 'absent': 1 };
  
  guess.split('').forEach((char, i) => {
    const currentPriority = statusPriority[newStatus[char]] || 0;
    const newPriority = statusPriority[evaluation[i]];
    
    if (newPriority > currentPriority) {
      newStatus[char] = evaluation[i];
    }
  });
  
  return newStatus;
};

// Oyun durumunu kontrol et
export const checkGameStatus = (guesses, solution) => {
  const lastGuess = guesses[guesses.length - 1];
  
  if (lastGuess === solution) {
    return 'won';
  }
  
  if (guesses.length >= 6) {
    return 'lost';
  }
  
  return 'playing';
};

// Sonraki güne kalan süreyi hesapla
export const getTimeUntilMidnight = () => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const diff = tomorrow - now;
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return {
    hours: hours.toString().padStart(2, '0'),
    minutes: minutes.toString().padStart(2, '0'),
    seconds: seconds.toString().padStart(2, '0'),
  };
};

// Paylaşım metnini oluştur
export const generateShareText = (guesses, evaluations, modeText, isWon) => {
  const emojiMap = {
    'correct': '🟩',
    'present': '🟨',
    'absent': '⬜',
  };
  
  const attemptText = isWon ? `${guesses.length}/6` : 'X/6';
  
  let text = `Nurdle ${modeText} ${attemptText}\n\n`;
  
  evaluations.forEach(evaluation => {
    const row = evaluation.map(status => emojiMap[status]).join('');
    text += row + '\n';
  });
  
  text += '\nhttps://nurdle.app';
  
  return text;
};

// Bugünün tarihini YYYY-MM-DD formatında al
export const getTodayString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Oyun numarasını hesapla
export const getGameNumber = () => {
  const startDate = new Date('2026-01-01');
  const today = new Date();
  return Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
};

