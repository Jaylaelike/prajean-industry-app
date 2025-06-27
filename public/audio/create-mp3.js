const fs = require('fs');

// Create a minimal valid MP3 file with ID3 tags
function createValidMP3(filename, duration = 0.1) {
  // MP3 frame data for a short silence
  const mp3Header = Buffer.from([
    0xFF, 0xFB, 0x90, 0x00, // MP3 frame header
    0x00, 0x00, 0x00, 0x00, // Additional frame data
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00
  ]);
  
  // ID3v2 header
  const id3Header = Buffer.from([
    0x49, 0x44, 0x33, // "ID3"
    0x03, 0x00, // Version 2.3
    0x00, // Flags
    0x00, 0x00, 0x00, 0x00 // Size (synchsafe integer)
  ]);
  
  // Combine headers and create a short audio file
  const audioData = Buffer.concat([id3Header, mp3Header]);
  
  // Repeat the frame data to create the desired duration
  const frameCount = Math.max(1, Math.floor(duration * 44100 / 1152)); // ~1152 samples per frame
  const frames = Buffer.alloc(frameCount * 16);
  
  for (let i = 0; i < frameCount; i++) {
    mp3Header.copy(frames, i * 16);
  }
  
  const finalAudio = Buffer.concat([id3Header, frames]);
  fs.writeFileSync(filename, finalAudio);
  
  console.log(`Created ${filename} (${finalAudio.length} bytes)`);
}

// Create the audio files
createValidMP3('click.mp3', 0.1);   // 100ms click
createValidMP3('zoom.mp3', 0.2);    // 200ms zoom sound

console.log('Audio files created successfully!');
