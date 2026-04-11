// ---- TTS Engine ----
// Browser SpeechSynthesis — sentence-by-sentence with word-boundary sync

let selectedVoice: SpeechSynthesisVoice | null = null;
let speechAborted = false;

/** Abort current speech immediately (for barge-in) */
export function abortSpeech() {
  speechAborted = true;
  try { speechSynthesis?.cancel(); } catch {}
}

if (typeof window !== "undefined" && window.speechSynthesis) {
  speechSynthesis.onvoiceschanged = () => {
    selectedVoice = findBestVoice();
    console.log("Voice selected:", selectedVoice?.name || "default");
  };
  selectedVoice = findBestVoice();
}

function findBestVoice(): SpeechSynthesisVoice | null {
  const voices = speechSynthesis?.getVoices() || [];
  if (voices.length === 0) return null;

  const preferred = [
    "Google UK English Male",
    "Google US English",
    "Aaron",
    "Microsoft David",
    "Alex",
  ];
  for (const name of preferred) {
    const match = voices.find(v => v.name.includes(name));
    if (match) return match;
  }
  const skip = ["Samantha", "Victoria", "Karen", "Moira", "Tessa", "Fiona", "Kate", "Susan", "Siri"];
  return voices.find(v => v.lang.startsWith("en") && !skip.some(s => v.name.includes(s))) || voices[0];
}

export async function prefetchAudio(_text: string): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  speechSynthesis.getVoices();
  await new Promise(r => setTimeout(r, 300));
  if (!selectedVoice) selectedVoice = findBestVoice();
  console.log("TTS ready. Voice:", selectedVoice?.name || "system default");
}

/**
 * Speak text sentence-by-sentence.
 * onProgress fires with the portion of full text spoken so far (synced to speech).
 * GUARANTEED to resolve within 30s.
 */
export async function speak(
  text: string,
  onProgress?: (displayedText: string) => void
): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  if (!selectedVoice) selectedVoice = findBestVoice();

  const sentences = splitSentences(text);

  speechAborted = false;

  const speakAll = async () => {
    let charOffset = 0;
    for (const sentence of sentences) {
      if (speechAborted) break;
      if (!sentence.trim()) { charOffset += sentence.length; continue; }
      await speakOne(sentence, (sentenceCharIndex) => {
        if (onProgress) {
          onProgress(text.substring(0, charOffset + sentenceCharIndex));
        }
      });
      if (speechAborted) break;
      charOffset += sentence.length;
      if (onProgress) onProgress(text.substring(0, charOffset));
    }
    if (onProgress) onProgress(text);
  };

  await Promise.race([
    speakAll(),
    new Promise<void>(r => setTimeout(r, 30000)),
  ]);

  // Always show full text when done
  if (onProgress) onProgress(text);
}

function splitSentences(text: string): string[] {
  // Split on sentence-ending punctuation only (. ! ?)
  // Don't split on commas — they create fragments that sound choppy
  const parts = text.match(/[^.!?]+[.!?]+[\s]*/g);
  if (!parts) return [text]; // No punctuation at all — speak as one chunk

  // Check for leftover text after last sentence (e.g. "My" with no period)
  const joined = parts.join("");
  const leftover = text.slice(joined.length).trim();

  if (leftover) {
    // Append trailing fragment to the last sentence instead of speaking alone
    parts[parts.length - 1] = parts[parts.length - 1] + " " + leftover;
  }

  return parts.filter(s => s.trim().length > 0);
}

function speakOne(
  text: string,
  onWordBoundary?: (charIndex: number) => void
): Promise<void> {
  return new Promise<void>((resolve) => {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95;
      u.pitch = 1.0;
      u.volume = 1.0;
      if (selectedVoice) u.voice = selectedVoice;

      // Pre-calculate word positions for timer-based streaming
      const words = text.split(/\s+/);
      const wordEnds: number[] = [];
      let pos = 0;
      for (const w of words) {
        pos = text.indexOf(w, pos) + w.length;
        wordEnds.push(pos);
      }

      // Start streaming words immediately via timer (no lag)
      // ~370ms per word at 0.95 rate
      const msPerWord = 370;
      let wordIdx = 0;
      const streamTimer = setInterval(() => {
        if (wordIdx >= wordEnds.length) { clearInterval(streamTimer); return; }
        if (onWordBoundary) onWordBoundary(wordEnds[wordIdx]);
        wordIdx++;
      }, msPerWord);

      // Show first word immediately (no delay on first word)
      if (onWordBoundary && wordEnds.length > 0) {
        onWordBoundary(wordEnds[0]);
        wordIdx = 1;
      }

      const timer = setTimeout(() => {
        clearInterval(streamTimer);
        try { speechSynthesis.cancel(); } catch {}
        resolve();
      }, 10000);

      u.onend = () => { clearTimeout(timer); clearInterval(streamTimer); resolve(); };
      u.onerror = () => { clearTimeout(timer); clearInterval(streamTimer); resolve(); };

      speechSynthesis.speak(u);

      // Dead-speech detection
      setTimeout(() => {
        if (!speechSynthesis.speaking && !speechSynthesis.pending) {
          clearTimeout(timer);
          clearInterval(streamTimer);
          resolve();
        }
      }, 800);
    } catch {
      resolve();
    }
  });
}

export function resetSpeakState() {
  try { speechSynthesis?.cancel(); } catch {}
}
