import { mkdirSync, writeFileSync } from "node:fs";

const sampleRate = 22050;
const seconds = 14;
const samples = sampleRate * seconds;
const pcm = new Int16Array(samples);
const melody = [293.66, 329.63, 392, 440, 392, 329.63, 293.66, 261.63, 293.66, 392, 440, 523.25, 440, 392];

for (let index = 0; index < samples; index += 1) {
  const time = index / sampleRate;
  const beat = Math.floor(time) % melody.length;
  const beatTime = time % 1;
  const frequency = melody[beat];
  const pluck = Math.exp(-3.2 * beatTime);
  const lead = pluck * (
    Math.sin(2 * Math.PI * frequency * time) +
    0.42 * Math.sin(2 * Math.PI * frequency * 2 * time) +
    0.18 * Math.sin(2 * Math.PI * frequency * 3 * time)
  );
  const drone = 0.22 * Math.sin(2 * Math.PI * 146.83 * time) + 0.12 * Math.sin(2 * Math.PI * 220 * time);
  const tablaPhase = time % 0.5;
  const tabla = Math.exp(-24 * tablaPhase) * Math.sin(2 * Math.PI * (105 - 55 * tablaPhase) * time);
  const fade = Math.min(1, time / 0.6, (seconds - time) / 0.8);
  pcm[index] = Math.max(-32767, Math.min(32767, Math.round((lead * 0.4 + drone + tabla * 0.28) * fade * 21000)));
}

const dataSize = pcm.byteLength;
const wav = Buffer.alloc(44 + dataSize);
wav.write("RIFF", 0);
wav.writeUInt32LE(36 + dataSize, 4);
wav.write("WAVEfmt ", 8);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(sampleRate, 24);
wav.writeUInt32LE(sampleRate * 2, 28);
wav.writeUInt16LE(2, 32);
wav.writeUInt16LE(16, 34);
wav.write("data", 36);
wav.writeUInt32LE(dataSize, 40);
for (let index = 0; index < pcm.length; index += 1) wav.writeInt16LE(pcm[index], 44 + index * 2);

mkdirSync(new URL("../public/audio/", import.meta.url), { recursive: true });
writeFileSync(new URL("../public/audio/india-insieme-demo.wav", import.meta.url), wav);
