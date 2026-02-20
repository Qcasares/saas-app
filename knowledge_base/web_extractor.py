#!/usr/bin/env python3
"""
Web Article Extractor
Uses firecrawl to extract clean content from web pages
"""

import json
from typing import Dict, Optional

class WebExtractor:
    def __init__(self):
        self.firecrawl_available = self._check_firecrawl()
    
    def _check_firecrawl(self) -> bool:
        """Check if firecrawl skill is available"""
        import shutil
        return shutil.which('firecrawl') is not None
    
    def extract(self, url: str) -> Dict:
        """Extract article content from URL"""
        
        if self.firecrawl_available:
            return self._extract_with_firecrawl(url)
        else:
            return self._extract_basic(url)
    
    def _extract_with_firecrawl(self, url: str) -> Dict:
        """Use firecrawl CLI for extraction"""
        import subprocess
        
        try:
            result = subprocess.run(
                ['firecrawl', 'scrape', url, '--format', 'markdown'],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                return {
                    'url': url,
                    'content': result.stdout,
                    'content_type': 'article',
                    'method': 'firecrawl'
                }
            else:
                return {
                    'error': result.stderr,
                    'url': url,
                    'content_type': 'article'
                }
                
        except Exception as e:
            return {
                'error': str(e),
                'url': url,
                'content_type': 'article'
            }
    
    def _extract_basic(self, url: str) -> Dict:
        """Basic extraction using urllib (fallback)"""
        import urllib.request
        from html.parser import HTMLParser
        
        class TextExtractor(HTMLParser):
            def __init__(self):
                super().__init__()
                self.text = []
                self.in_script = False
            
            def handle_starttag(self, tag, attrs):
                if tag in ['script', 'style']:
                    self.in_script = True
            
            def handle_endtag(self, tag):
                if tag in ['script', 'style']:
                    self.in_script = False
            
            def handle_data(self, data):
                if not self.in_script:
                    self.text.append(data.strip())
        
        try:
            req = urllib.request.Request(
                url,
                headers={'User-Agent': 'Mozilla/5.0 (compatible; Bot/1.0)'}
            )
            
            with urllib.request.urlopen(req, timeout=15) as response:
                html = response.read().decode('utf-8', errors='ignore')
                
                # Extract title
                title_match = html.search(r'<title>([^<]+)</title>', html, re.IGNORECASE)
                title = title_match.group(1) if title_match else 'Unknown'
                
                # Extract text
                parser = TextExtractor()
                parser.feed(html)
                text = '\n'.join(parser.text)
                
                return {
                    'url': url,
                    'title': title,
                    'content': text[:10000],  # Limit size
                    'content_type': 'article',
                    'method': 'basic'
                }
                
        except Exception as e:
            return {
                'error': str(e),
                'url': url,
                'content_type': 'article'
            }
    
    def extract_entities(self, text: str) -> Dict[str, list]:
        """Basic entity extraction from text"""
        import re
        
        entities = {
            'people': [],
            'companies': [],
            'concepts': []
        }
        
        # Simple pattern matching for companies
        company_patterns = [
            r'\b(OpenAI|Google|Microsoft|Apple|Meta|Amazon|Twitter|X\.com|LinkedIn|Tesla|SpaceX)\b',
            r'\b(Alpha Bank|HSBC|Barclays|Volante|MTC|Dufrain)\b'
        ]
        
        for pattern in company_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            entities['companies'].extend(matches)
        
        # Remove duplicates
        entities['companies'] = list(set(entities['companies']))
        
        return entities

if __name__ == "__main__":
    extractor = WebExtractor()
    
    # Test
    test_url = "https://example.com/article"
    result = extractor.extract(test_url)
    
    print(json.dumps(result, indent=2))
