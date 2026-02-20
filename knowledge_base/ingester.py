#!/usr/bin/env python3
"""
Knowledge Base Ingester
Main handler for processing URLs from Telegram and other sources
"""

import sys
import json
import re
from typing import Dict, Optional

# Add knowledge_base to path
sys.path.insert(0, '/Users/quentincasares/.openclaw/workspace')

from knowledge_base.core import KnowledgeBase
from knowledge_base.youtube_extractor import YouTubeExtractor
from knowledge_base.twitter_extractor import TwitterExtractor
from knowledge_base.web_extractor import WebExtractor

class KnowledgeIngester:
    def __init__(self):
        self.kb = KnowledgeBase()
        self.youtube = YouTubeExtractor()
        self.twitter = TwitterExtractor()
        self.web = WebExtractor()
    
    def identify_source_type(self, url: str) -> str:
        """Identify what type of content a URL points to"""
        if re.search(r'youtube\.com|youtu\.be', url):
            return 'youtube'
        elif re.search(r'twitter\.com|x\.com', url):
            return 'tweet'
        elif url.endswith('.pdf'):
            return 'pdf'
        else:
            return 'article'
    
    def ingest_url(self, url: str, source_context: str = "unknown") -> Dict:
        """
        Main ingestion handler
        Processes URL based on type and stores in knowledge base
        """
        source_type = self.identify_source_type(url)
        
        print(f"📥 Ingesting {source_type}: {url}")
        
        if source_type == 'youtube':
            return self._ingest_youtube(url, source_context)
        elif source_type == 'tweet':
            return self._ingest_tweet(url, source_context)
        elif source_type == 'pdf':
            return self._ingest_pdf(url, source_context)
        else:
            return self._ingest_article(url, source_context)
    
    def _ingest_youtube(self, url: str, context: str) -> Dict:
        """Ingest YouTube video with transcript"""
        result = self.youtube.process_url(url)
        
        if 'error' in result:
            return {'success': False, 'error': result['error'], 'url': url}
        
        metadata = result.get('metadata', {})
        transcript = result.get('transcript', {})
        
        source_id = self.kb.add_source(
            url=url,
            source_type='youtube',
            title=metadata.get('title', 'Unknown Video'),
            content=transcript.get('full_text', ''),
            author=metadata.get('author', 'Unknown'),
            entities=self.web.extract_entities(transcript.get('full_text', '')).get('companies', [])
        )
        
        return {
            'success': True,
            'source_id': source_id,
            'type': 'youtube',
            'title': metadata.get('title'),
            'has_transcript': bool(transcript.get('full_text'))
        }
    
    def _ingest_tweet(self, url: str, context: str) -> Dict:
        """Ingest tweet or thread"""
        result = self.twitter.process_url(url)
        
        if 'error' in result:
            return {'success': False, 'error': result['error'], 'url': url}
        
        # Combine all tweets in thread
        tweets = result.get('tweets', [])
        if tweets and 'data' in tweets[0]:
            # API v2 format
            content = tweets[0]['data'].get('text', '')
            author_id = tweets[0]['data'].get('author_id', 'unknown')
        else:
            content = f"Tweet thread from {url}"
            author_id = 'unknown'
        
        source_id = self.kb.add_source(
            url=url,
            source_type='tweet',
            title=f"Tweet by @{author_id}",
            content=content,
            author=author_id,
            entities=self.web.extract_entities(content).get('companies', [])
        )
        
        return {
            'success': True,
            'source_id': source_id,
            'type': 'tweet',
            'is_thread': result.get('is_thread', False)
        }
    
    def _ingest_article(self, url: str, context: str) -> Dict:
        """Ingest web article"""
        result = self.web.extract(url)
        
        if 'error' in result:
            return {'success': False, 'error': result['error'], 'url': url}
        
        entities = self.web.extract_entities(result.get('content', ''))
        
        source_id = self.kb.add_source(
            url=url,
            source_type='article',
            title=result.get('title', 'Unknown Article'),
            content=result.get('content', ''),
            entities=entities.get('companies', []) + entities.get('people', [])
        )
        
        return {
            'success': True,
            'source_id': source_id,
            'type': 'article',
            'title': result.get('title')
        }
    
    def _ingest_pdf(self, url: str, context: str) -> Dict:
        """Ingest PDF (download + extract text)"""
        # TODO: PDF extraction implementation
        return {
            'success': False,
            'error': 'PDF ingestion not yet implemented',
            'url': url
        }
    
    def query(self, question: str, limit: int = 5) -> Dict:
        """Natural language query against knowledge base"""
        results = self.kb.search(question, limit=limit)
        
        return {
            'query': question,
            'results': results,
            'count': len(results),
            'sources': list(set(r['type'] for r in results))
        }
    
    def get_stats(self) -> Dict:
        """Get ingestion statistics"""
        return self.kb.get_stats()

if __name__ == "__main__":
    ingester = KnowledgeIngester()
    
    # Test with command line argument
    if len(sys.argv) > 1:
        url = sys.argv[1]
        result = ingester.ingest_url(url)
        print(json.dumps(result, indent=2))
    else:
        print("Usage: python ingester.py <url>")
        print("\nKnowledge Base Stats:")
        print(json.dumps(ingester.get_stats(), indent=2))
