#!/usr/bin/env python3
"""
Knowledge Base RAG System
Ingests URLs, YouTube videos, tweets, PDFs with vector embeddings
"""

import sqlite3
import json
import hashlib
from datetime import datetime
from typing import Optional, List, Dict
import re

DB_PATH = "~/.openclaw/workspace/db/knowledge_base.db"

def init_db():
    """Initialize knowledge base database"""
    conn = sqlite3.connect(os.path.expanduser(DB_PATH))
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS knowledge_sources (
            id TEXT PRIMARY KEY,
            url TEXT UNIQUE,
            source_type TEXT, -- article, youtube, tweet, pdf
            title TEXT,
            content TEXT,
            content_summary TEXT,
            author TEXT,
            published_at DATETIME,
            ingested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_accessed DATETIME,
            access_count INTEGER DEFAULT 0,
            entities TEXT, -- JSON array of extracted entities
            tags TEXT, -- JSON array
            vector_embedding_id TEXT -- reference to embedding storage
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS knowledge_embeddings (
            id TEXT PRIMARY KEY,
            source_id TEXT,
            chunk_text TEXT,
            chunk_index INTEGER,
            embedding BLOB, -- vector embedding bytes
            FOREIGN KEY (source_id) REFERENCES knowledge_sources(id) ON DELETE CASCADE
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS entity_links (
            id TEXT PRIMARY KEY,
            entity_name TEXT,
            entity_type TEXT, -- person, company, concept
            source_id TEXT,
            context TEXT,
            FOREIGN KEY (source_id) REFERENCES knowledge_sources(id) ON DELETE CASCADE
        )
    ''')
    
    # Indexes for performance
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_sources_type ON knowledge_sources(source_type)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_sources_url ON knowledge_sources(url)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_sources_ingested ON knowledge_sources(ingested_at)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_entities_name ON entity_links(entity_name)')
    
    conn.commit()
    conn.close()

def generate_id(url: str) -> str:
    """Generate unique ID from URL"""
    return hashlib.sha256(url.encode()).hexdigest()[:16]

class KnowledgeBase:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = os.path.expanduser(db_path)
        init_db()
    
    def add_source(self, url: str, source_type: str, title: str, content: str,
                   author: str = None, published_at: str = None, 
                   entities: List[str] = None) -> str:
        """Add a new source to the knowledge base"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        source_id = generate_id(url)
        
        # Check if already exists
        cursor.execute("SELECT id FROM knowledge_sources WHERE url = ?", (url,))
        if cursor.fetchone():
            # Update existing
            cursor.execute('''
                UPDATE knowledge_sources 
                SET content = ?, title = ?, last_accessed = ?
                WHERE url = ?
            ''', (content, title, datetime.now().isoformat(), url))
        else:
            # Insert new
            cursor.execute('''
                INSERT INTO knowledge_sources 
                (id, url, source_type, title, content, author, published_at, entities)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (source_id, url, source_type, title, content, author, 
                  published_at, json.dumps(entities or [])))
        
        conn.commit()
        conn.close()
        
        return source_id
    
    def search(self, query: str, source_type: str = None, 
               time_weight: bool = True, limit: int = 10) -> List[Dict]:
        """Search knowledge base (semantic search placeholder)"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Simple keyword search for now (replace with vector search later)
        keywords = query.lower().split()
        
        sql = '''
            SELECT id, url, source_type, title, content_summary, 
                   author, ingested_at, access_count
            FROM knowledge_sources
            WHERE (title LIKE ? OR content LIKE ?)
        '''
        
        if source_type:
            sql += " AND source_type = ?"
            params = [f'%{query}%', f'%{query}%', source_type]
        else:
            params = [f'%{query}%', f'%{query}%']
        
        if time_weight:
            sql += " ORDER BY (julianday('now') - julianday(ingested_at)) * -0.1 + access_count * 0.01 DESC"
        else:
            sql += " ORDER BY access_count DESC"
        
        sql += " LIMIT ?"
        params.append(limit)
        
        cursor.execute(sql, params)
        results = cursor.fetchall()
        
        conn.close()
        
        return [
            {
                'id': r[0],
                'url': r[1],
                'type': r[2],
                'title': r[3],
                'summary': r[4],
                'author': r[5],
                'ingested': r[6],
                'relevance': r[7]
            }
            for r in results
        ]
    
    def get_by_entity(self, entity_name: str) -> List[Dict]:
        """Get all sources mentioning a specific entity"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT s.id, s.url, s.source_type, s.title, e.context
            FROM knowledge_sources s
            JOIN entity_links e ON s.id = e.source_id
            WHERE e.entity_name = ?
        ''', (entity_name,))
        
        results = cursor.fetchall()
        conn.close()
        
        return [
            {'id': r[0], 'url': r[1], 'type': r[2], 'title': r[3], 'context': r[4]}
            for r in results
        ]
    
    def get_stats(self) -> Dict:
        """Get knowledge base statistics"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM knowledge_sources")
        total = cursor.fetchone()[0]
        
        cursor.execute("SELECT source_type, COUNT(*) FROM knowledge_sources GROUP BY source_type")
        by_type = dict(cursor.fetchall())
        
        cursor.execute("SELECT COUNT(*) FROM entity_links")
        entities = cursor.fetchone()[0]
        
        conn.close()
        
        return {'total_sources': total, 'by_type': by_type, 'total_entities': entities}

if __name__ == "__main__":
    import os
    
    kb = KnowledgeBase()
    
    # Test
    kb.add_source(
        url="https://example.com/ai-article",
        source_type="article",
        title="The Future of AI",
        content="AI is transforming how we work...",
        author="John Doe",
        entities=["OpenAI", "machine learning", "automation"]
    )
    
    print("Stats:", kb.get_stats())
    print("Search 'AI':", kb.search("AI"))
