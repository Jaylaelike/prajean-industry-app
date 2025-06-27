# Audio Files for Map Interactions

This directory contains audio files used for map interactions:

## Required Files

1. **click.mp3** - Sound played when clicking on map markers or locations
   - Recommended: Short click sound (0.1-0.3 seconds)
   - Format: MP3, OGG, or WAV
   - Size: Keep under 50KB for fast loading

## Usage

- Click sounds are automatically played when users interact with map markers
- Volume is automatically adjusted based on zoom level (zoom in = louder, zoom out = quieter)
- Users can disable audio or adjust volume using the audio controls panel

## Adding Audio Files

To add your own audio files:

1. Place MP3, OGG, or WAV files in this directory
2. Update the `DEFAULT_AUDIO_CONFIG.clickSound` path in `lib/longdo-map.ts`
3. Ensure files are optimized for web (small size, appropriate quality)

## Audio Generation

You can create simple click sounds using:
- Online tools like freesound.org
- Audio editing software like Audacity
- Web Audio API (programmatically generated sounds are also supported)
