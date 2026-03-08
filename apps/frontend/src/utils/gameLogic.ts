import type { TileStatus, TimeCountdown } from '../types';

// Türkçe karakterleri normalize et (büyük harfe çevir)
export const normalizeChar = (char: string): string => {
  const turkishMap: Record<string, string> = {
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
export const normalizeWord = (word: string): string => {
  return word.split('').map(normalizeChar).join('');
};

// Tahmin sonuçlarını hesapla
export const evaluateGuess = (guess: string, solution: string): TileStatus[] => {
  const result: TileStatus[] = [];
  const solutionArray = solution.split('');
  const guessArray = guess.split('');
  const solutionCharCount: Record<string, number> = {};
  
  // Çözümdeki harf sayılarını say
  solutionArray.forEach(char => {
    solutionCharCount[char] = (solutionCharCount[char] || 0) + 1;
  });
  
  // İlk geçiş: Doğru pozisyonları bul
  guessArray.forEach((char, i) => {
    const solutionChar = solutionArray[i];
    if (char === solutionChar && solutionChar) {
      result[i] = 'correct';
      solutionCharCount[char] = (solutionCharCount[char] ?? 0) - 1;
    }
  });
  
  // İkinci geçiş: Yanlış pozisyonları ve olmayanları bul
  guessArray.forEach((char, i) => {
    if (result[i]) return; // Zaten işaretlendi
    
    if ((solutionCharCount[char] ?? 0) > 0) {
      result[i] = 'present';
      solutionCharCount[char] = (solutionCharCount[char] ?? 0) - 1;
    } else {
      result[i] = 'absent';
    }
  });
  
  return result;
};

// Klavye için harf durumlarını güncelle
export const updateKeyboardStatus = (
  currentStatus: Record<string, TileStatus>,
  guess: string,
  evaluation: TileStatus[]
): Record<string, TileStatus> => {
  const newStatus = { ...currentStatus };
  const statusPriority: Record<string, number> = { 'correct': 3, 'present': 2, 'absent': 1 };
  
  guess.split('').forEach((char, i) => {
    const currentStatus = newStatus[char];
    const currentPriority = currentStatus ? statusPriority[currentStatus] || 0 : 0;
    const evalStatus = evaluation[i];
    const newPriority = evalStatus ? statusPriority[evalStatus] || 0 : 0;
    
    if (newPriority > currentPriority && evalStatus) {
      newStatus[char] = evalStatus;
    }
  });
  
  return newStatus;
};

// Oyun durumunu kontrol et
export const checkGameStatus = (guesses: string[], solution: string): 'won' | 'lost' | 'playing' => {
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
export const getTimeUntilMidnight = (): TimeCountdown => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const diff = tomorrow.getTime() - now.getTime();
  
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
export const generateShareText = (
  guesses: string[],
  evaluations: TileStatus[][],
  modeText: string | number,
  isWon: boolean
): string => {
  const emojiMap: Record<string, string> = {
    'correct': '🟩',
    'present': '🟨',
    'absent': '⬜',
  };
  
  const attemptText = isWon ? `${guesses.length}/6` : 'X/6';
  
  let text = `Nurdle ${modeText} ${attemptText}\n\n`;
  
  evaluations.forEach(evaluation => {
    const row = evaluation.map(status => (status ? emojiMap[status] : '⬜') || '⬜').join('');
    text += row + '\n';
  });
  
  text += '\nhttps://nurdle.app';
  
  return text;
};

// Bugünün tarihini YYYY-MM-DD formatında al
export const getTodayString = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0]!;
};

// Oyun numarasını hesapla
export const getGameNumber = (): number => {
  const startDate = new Date('2026-01-01');
  const today = new Date();
  return Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
};
