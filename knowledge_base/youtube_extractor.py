#!/usr/bin/env python3
"""
YouTube Video Transcript Extractor
Downloads transcripts and metadata from YouTube videos
"""

import re
import json
from typing import Optional, Dict
import urllib.request
import urllib.parse

class YouTubeExtractor:
    def __init__(self):
        self.base_url = "https://www.youtube.com/watch"
    
    def extract_video_id(self, url: str) -> Optional[str]:
        """Extract video ID from various YouTube URL formats"""
        patterns = [
            r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([a-zA-Z0-9_-]{11})',
            r'youtube\.com/shorts/([a-zA-Z0-9_-]{11})',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        return None
    
    def get_transcript(self, video_id: str) -> Optional[list]:
        """Get transcript using youtube-transcript-api"""
        try:
            from youtube_transcript_api import YouTubeTranscriptApi
            
            transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
            
            # Format transcript
            formatted = []
            full_text = []
            
            for entry in transcript_list:
                formatted.append({
                    'text': entry['text'],
                    'start': entry['start'],
                    'duration': entry['duration']
                })
                full_text.append(entry['text'])
            
            return {
                'segments': formatted,
                'full_text': ' '.join(full_text),
                'language': 'en'  # Default, could detect from API
            }
            
        except Exception as e:
            return {'error': str(e), 'segments': [], 'full_text': ''}
    
    def get_metadata(self, video_id: str) -> Dict:
        """Get video metadata using yt-dlp or oEmbed"""
        try:
            # Try oEmbed first (no API key needed)
            oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
            
            with urllib.request.urlopen(oembed_url, timeout=10) as response:
                data = json.loads(response.read().decode())
                
            return {
                'title': data.get('title', 'Unknown'),
                'author': data.get('author_name', 'Unknown'),
                'thumbnail': data.get('thumbnail_url', ''),
                'video_id': video_id,
                'url': f"https://www.youtube.com/watch?v={video_id}"
            }
            
        except Exception as e:
            return {
                'title': 'Unknown',
                'author': 'Unknown',
                'video_id': video_id,
                'url': f"https://www.youtube.com/watch?v={video_id}",
                'error': str(e)
            }
    
    def process_url(self, url: str) -> Dict:
        """Process a YouTube URL - extract metadata + transcript"""
        video_id = self.extract_video_id(url)
        
        if not video_id:
            return {'error': 'Invalid YouTube URL', 'url': url}
        
        metadata = self.get_metadata(video_id)
        transcript = self.get_transcript(video_id)
        
        return {
            'video_id': video_id,
            'url': url,
            'metadata': metadata,
            'transcript': transcript,
            'content_type': 'youtube'
        }

if __name__ == "__main__":
    yt = YouTubeExtractor()
    
    # Test
    test_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    result = yt.process_url(test_url)
    
    print(json.dumps(result, indent=2))
