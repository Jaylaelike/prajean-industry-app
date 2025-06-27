#!/bin/bash

# Create simple audio files using system sounds or synthetic audio
# This script creates placeholder audio files for the map interactions

# Create click sound (short beep)
ffmpeg -f lavfi -i "sine=frequency=800:duration=0.1" -c:a libmp3lame -b:a 128k /tmp/click.mp3 2>/dev/null

# Create zoom sound (ascending tone)
ffmpeg -f lavfi -i "sine=frequency=600:duration=0.2" -c:a libmp3lame -b:a 128k /tmp/zoom.mp3 2>/dev/null

# If ffmpeg is not available, we'll create the files using a different method
if [ ! -f /tmp/click.mp3 ]; then
    echo "ffmpeg not found, creating minimal audio files"
    # Create minimal MP3 files (will be replaced with actual audio)
    touch /tmp/click.mp3
    touch /tmp/zoom.mp3
fi

echo "Audio files created successfully"
