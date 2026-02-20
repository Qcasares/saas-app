#!/usr/bin/env python3
"""
Security Layer: Data Protection
Auto-redacts API keys, tokens, and credentials from outbound messages
"""

import re
import json
import os
from typing import List, Tuple

# Patterns for sensitive data detection
SENSITIVE_PATTERNS = [
    # API Keys
    (r'sk-[a-zA-Z0-9]{48}', 'OPENAI_API_KEY'),
    (r'sk-ant-[a-zA-Z0-9]{32}', 'ANTHROPIC_API_KEY'),
    (r'sk_live_[a-zA-Z0-9]{24,}', 'STRIPE_SECRET_KEY'),
    (r'sk_test_[a-zA-Z0-9]{24,}', 'STRIPE_TEST_KEY'),
    (r'AIza[0-9A-Za-z_-]{35}', 'GOOGLE_API_KEY'),
    
    # Bearer Tokens (Twitter, etc.)
    (r'AAAAAAAAAAAAAAAAAAAA[0-9A-Za-z%]{30,}', 'BEARER_TOKEN'),
    
    # JWT Tokens (simplified pattern)
    (r'eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*', 'JWT_TOKEN'),
    
    # AWS Keys
    (r'AKIA[0-9A-Z]{16}', 'AWS_ACCESS_KEY'),
    (r'[0-9a-zA-Z/+]{40}', 'AWS_SECRET_KEY'),  # Generic secret pattern
    
    # Generic API keys
    (r'api[_-]?key[_-]?[:\s]*["\']?[a-zA-Z0-9]{32,}["\']?', 'API_KEY'),
    (r'token[_-]?[:\s]*["\']?[a-zA-Z0-9]{32,}["\']?', 'TOKEN'),
    (r'secret[_-]?[:\s]*["\']?[a-zA-Z0-9]{32,}["\']?', 'SECRET'),
    
    # Database connection strings
    (r'postgres(ql)?://[^\s\"\']+', 'DATABASE_URL'),
    (r'mongodb(\+srv)?://[^\s\"\']+', 'MONGODB_URL'),
    (r'redis://[^\s\"\']+', 'REDIS_URL'),
    
    # Email addresses (in certain contexts)
    (r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', 'EMAIL'),
    
    # Phone numbers (UK format)
    (r'\+44\s?7\d{3}\s?\d{6}', 'PHONE_UK'),
    
    # Credit cards (basic pattern - should not be stored anyway)
    (r'\b(?:\d[ -]*?){13,16}\b', 'CREDIT_CARD'),
]

def redact_sensitive_data(text: str, context: str = "general") -> Tuple[str, List[dict]]:
    """
    Redact sensitive data from text
    Returns redacted text and list of what was redacted
    """
    redacted = text
    findings = []
    
    for pattern, label in SENSITIVE_PATTERNS:
        matches = list(re.finditer(pattern, redacted))
        # Process matches in reverse to preserve positions
        for match in reversed(matches):
            original = match.group()
            # Create a redacted version
            if len(original) <= 8:
                redacted_version = f"[REDACTED:{label}]"
            else:
                # Show first/last 4 chars for identification
                redacted_version = f"{original[:4]}...[REDACTED:{label}]...{original[-4:]}"
            
            start, end = match.span()
            redacted = redacted[:start] + redacted_version + redacted[end:]
            
            findings.append({
                'type': label,
                'position': (start, end),
                'original_length': len(original)
            })
    
    return redacted, findings

def should_allow_in_context(text: str, context: str) -> bool:
    """
    Determine if content should be allowed in a given context
    - Financial data: DMs only
    - Credentials: Never in group chats
    """
    # Check for financial data
    financial_patterns = [
        r'\$[\d,]+\.?\d*',
        r'£[\d,]+\.?\d*',
        r'€[\d,]+\.?\d*',
        r'balance:?",?\s*[\d,]+',
        r'account:?",?\s*\d{4,}',
    ]
    
    has_financial = any(re.search(p, text) for p in financial_patterns)
    
    if has_financial and context not in ['dm', 'private', 'direct']:
        return False
    
    # Check for credentials
    cred_patterns = [
        r'sk-[a-zA-Z0-9]',
        r'api[_-]?key',
        r'token[_-]?[:\s]*[a-zA-Z0-9]{16,}',
        r'secret[_-]?[:\s]*[a-zA-Z0-9]{16,}',
    ]
    
    has_credentials = any(re.search(p, text, re.IGNORECASE) for p in cred_patterns)
    
    if has_credentials and context in ['group', 'public', 'channel']:
        return False
    
    return True

def sanitize_for_telegram(text: str, is_group: bool = False) -> str:
    """Sanitize text before sending to Telegram"""
    redacted, findings = redact_sensitive_data(text)
    
    if is_group and not should_allow_in_context(redacted, 'group'):
        # Block if contains sensitive data in group context
        raise ValueError("Content contains sensitive data not suitable for group chat")
    
    return redacted

def sanitize_for_slack(text: str, is_public_channel: bool = False) -> str:
    """Sanitize text before sending to Slack"""
    redacted, findings = redact_sensitive_data(text)
    
    if is_public_channel and not should_allow_in_context(redacted, 'public'):
        raise ValueError("Content contains sensitive data not suitable for public Slack channel")
    
    return redacted

def check_env_file_content(content: str) -> List[dict]:
    """Check if content looks like an .env file that shouldn't be committed"""
    issues = []
    
    # Check for .env patterns
    if re.search(r'^[A-Z_]+=.+$', content, re.MULTILINE):
        issues.append({
            'type': 'env_file_detected',
            'severity': 'high',
            'message': 'Content appears to be an .env file with environment variables'
        })
    
    # Check for common secret variable names
    secret_vars = ['API_KEY', 'SECRET', 'TOKEN', 'PASSWORD', 'PRIVATE_KEY', 'AWS_']
    for var in secret_vars:
        if var in content:
            issues.append({
                'type': 'potential_secret',
                'variable': var,
                'severity': 'high'
            })
    
    return issues

if __name__ == "__main__":
    # Test
    test = """
    My API key is sk-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
    Contact me at +44 7525 011144
    Database: postgresql://user:pass@host/db
    """
    
    redacted, findings = redact_sensitive_data(test)
    print("Original:", test)
    print("\nRedacted:", redacted)
    print("\nFindings:", findings)
