// Web Audio synth sounds, unchanged from the live game (index.html).

export class SoundEngine {
    constructor() {
        this.ctx = null;
        this.engineOsc = null;
        this.engineGain = null;
    }
    init() {
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.engineOsc = this.ctx.createOscillator();
            this.engineGain = this.ctx.createGain();
            this.engineOsc.type = 'sine';
            this.engineOsc.frequency.value = 95;
            this.engineGain.gain.value = 0.015;
            this.engineOsc.connect(this.engineGain);
            this.engineGain.connect(this.ctx.destination);
            this.engineOsc.start();
        } catch {}
    }
    updateEngine(speedRatio) {
        if (!this.ctx) return;
        this.engineOsc.frequency.setTargetAtTime(80 + Math.abs(speedRatio) * 280, this.ctx.currentTime, 0.1);
        this.engineGain.gain.setTargetAtTime(0.015 + Math.abs(speedRatio) * 0.04, this.ctx.currentTime, 0.1);
    }
    playLaser(isPlayer = true) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(isPlayer ? 880 : 620, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.14);
        gain.gain.setValueAtTime(isPlayer ? 0.12 : 0.04, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.14);
    }
    playHit() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(170, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(45, this.ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.24, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.18);
    }
    playExplosion() {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 0.45;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, this.ctx.currentTime);
        filter.frequency.linearRampToValueAtTime(55, this.ctx.currentTime + 0.45);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.45);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
    }
}
export const sound = new SoundEngine();
