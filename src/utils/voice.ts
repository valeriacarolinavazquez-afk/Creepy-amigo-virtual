// Voice Recording and Pitch-shifting playback.
// Creates a chipmunk paperclip effect!
export class VoiceRepeater {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private activeSource: AudioBufferSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private animationFrameId: number | null = null;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  async startRecording(onSilenceDetection?: () => void): Promise<boolean> {
    try {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioChunks = [];

      // Determine MIME Type supported by browser
      let options = {};
      if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        options = { mimeType: 'audio/ogg' };
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' };
      }

      this.mediaRecorder = new MediaRecorder(stream, options);
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100); // chunk size 100ms
      return true;
    } catch (e) {
      console.warn("Error accessing microphone:", e);
      return false;
    }
  }

  stopRecordingAndPlayback(
    playbackRate: number = 1.45,
    onVolumeChange: (vol: number) => void,
    onEnded: () => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        reject('Not recording');
        return;
      }

      this.mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
          
          // Stop all stream tracks to release microphone light
          const stream = this.mediaRecorder?.stream;
          stream?.getTracks().forEach(track => track.stop());

          if (audioBlob.size < 100) {
            onEnded();
            resolve();
            return;
          }

          const arrayBuffer = await audioBlob.arrayBuffer();
          if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          }

          this.audioContext.decodeAudioData(
            arrayBuffer,
            (buffer) => {
              this.playAudioBuffer(buffer, playbackRate, onVolumeChange, onEnded);
              resolve();
            },
            (err) => {
              console.error("Error decoding audio data", err);
              // Fallback if decode audio fails (for example inside iframe constraints)
              onEnded();
              reject(err);
            }
          );
        } catch (err) {
          onEnded();
          reject(err);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  private playAudioBuffer(
    buffer: AudioBuffer,
    playbackRate: number,
    onVolumeChange: (vol: number) => void,
    onEnded: () => void
  ) {
    if (!this.audioContext) return;

    this.stopPlayback();

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.setValueAtTime(playbackRate, this.audioContext.currentTime);

    // Dynamic Volume Detection Node for Lipsyncing!
    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = 64;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    source.connect(analyser);
    analyser.connect(this.audioContext.destination);

    this.activeSource = source;
    this.analyser = analyser;

    // Track volume levels in animation loop
    const checkVolume = () => {
      if (!this.analyser) return;
      this.analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      // Map volume to 0.0 - 1.0 range
      onVolumeChange(Math.min(1, average / 120));
      this.animationFrameId = requestAnimationFrame(checkVolume);
    };

    checkVolume();

    source.onended = () => {
      this.stopPlayback();
      onEnded();
    };

    source.start(0);
  }

  stopPlayback() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.activeSource) {
      try {
        this.activeSource.stop();
      } catch (e) {
        // Source might have already stopped
      }
      this.activeSource = null;
    }
    this.analyser = null;
  }
}
