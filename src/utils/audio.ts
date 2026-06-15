// Web Audio API Retro Sound Effects Synthesizer
let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playSound(type: 'tap' | 'giggle' | 'chew' | 'levelUp' | 'coin' | 'hurt' | 'heal' | 'wash' | 'win') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
      case 'tap': {
        // Simple sharp office click sound
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }
      case 'giggle': {
        // High-pitched rapid sweeps
        osc.type = 'sine';
        gainNode.gain.setValueAtTime(0.1, now);
        for (let i = 0; i < 4; i++) {
          const startTime = now + i * 0.06;
          osc.frequency.setValueAtTime(1000 + i * 150, startTime);
          osc.frequency.exponentialRampToValueAtTime(1600 + i * 150, startTime + 0.04);
          gainNode.gain.setValueAtTime(0.1, startTime);
          gainNode.gain.linearRampToValueAtTime(0.01, startTime + 0.05);
        }
        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }
      case 'chew': {
        // Crunch snack noise logic
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.12);
        
        // Add white noise simulation for "crunch"
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, now);
        
        const noiseNode = ctx.createOscillator();
        noiseNode.type = 'sawtooth';
        noiseNode.frequency.setValueAtTime(40, now);
        
        noiseNode.connect(filter);
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.08, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc.start(now);
        osc.stop(now + 0.15);
        noiseNode.start(now);
        noiseNode.stop(now + 0.15);
        break;
      }
      case 'levelUp': {
        // Beautiful rising synth scale
        osc.type = 'sine';
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C Major arpeggio
        gainNode.gain.setValueAtTime(0.15, now);
        
        notes.forEach((freq, idx) => {
          const t = now + idx * 0.09;
          osc.frequency.setValueAtTime(freq, t);
          if (idx === notes.length - 1) {
            gainNode.gain.setValueAtTime(0.15, t);
            gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
          } else {
            gainNode.gain.setValueAtTime(0.12, t);
            gainNode.gain.linearRampToValueAtTime(0.06, t + 0.08);
          }
        });
        
        osc.start(now);
        osc.stop(now + notes.length * 0.09 + 0.35);
        break;
      }
      case 'coin': {
        // Mario coin sound (B5 then E6)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, now); // B5
        gainNode.gain.setValueAtTime(0.12, now);
        
        // Pitch jump after 0.08s
        const jumpTime = now + 0.08;
        osc.frequency.setValueAtTime(1318.51, jumpTime); // E6
        gainNode.gain.setValueAtTime(0.12, jumpTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, jumpTime + 0.25);
        
        osc.start(now);
        osc.stop(jumpTime + 0.3);
        break;
      }
      case 'hurt': {
        // Warning downward growl
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.25);
        
        // lowpass filter to make it sound muffled
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, now);
        osc.disconnect(gainNode);
        osc.connect(filter);
        filter.connect(gainNode);
        
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        
        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }
      case 'heal': {
        // Gentle bubble/potion sweep
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
        gainNode.gain.setValueAtTime(0.01, now);
        gainNode.gain.linearRampToValueAtTime(0.12, now + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      }
      case 'wash': {
        // Warm bubble washing sound effect, multiple high pass noise pops
        osc.type = 'sine';
        gainNode.gain.setValueAtTime(0.05, now);
        for (let i = 0; i < 5; i++) {
          const t = now + i * 0.05;
          osc.frequency.setValueAtTime(Math.random() * 400 + 400, t);
          gainNode.gain.setValueAtTime(0.06, t);
          gainNode.gain.exponentialRampToValueAtTime(0.005, t + 0.04);
        }
        osc.start(now);
        osc.stop(now + 0.28);
        break;
      }
      case 'win': {
        // Success melody
        osc.type = 'triangle';
        const notes = [440.00, 554.37, 659.25, 880.00]; // A4 -> C#5 -> E5 -> A5
        gainNode.gain.setValueAtTime(0.12, now);
        notes.forEach((freq, idx) => {
          const t = now + idx * 0.08;
          osc.frequency.setValueAtTime(freq, t);
          gainNode.gain.setValueAtTime(0.12, t);
          gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        });
        osc.start(now);
        osc.stop(now + 0.45);
        break;
      }
    }
  } catch (e) {
    console.warn('Audio synthesis failed or user gesture needed:', e);
  }
}
