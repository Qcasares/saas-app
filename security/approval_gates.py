#!/usr/bin/env python3
"""
Security Layer: Approval Gates
Requires explicit approval before sensitive actions
"""

import json
import os
from typing import Dict, Callable, Optional
from datetime import datetime

# Actions that require approval
APPROVAL_REQUIRED_ACTIONS = {
    'email_send': {
        'description': 'Send email',
        'risk_level': 'high',
        'requires_approval': True,
        'auto_approve_if': None
    },
    'social_post': {
        'description': 'Post to social media (Twitter/X, LinkedIn, etc.)',
        'risk_level': 'high',
        'requires_approval': True,
        'auto_approve_if': None
    },
    'file_delete': {
        'description': 'Delete file or directory',
        'risk_level': 'medium',
        'requires_approval': True,
        'prefer_trash': True,
        'auto_approve_if': None
    },
    'file_overwrite': {
        'description': 'Overwrite existing file',
        'risk_level': 'medium',
        'requires_approval': True,
        'auto_approve_if': None
    },
    'video_pitch': {
        'description': 'Submit video idea pitch',
        'risk_level': 'low',
        'requires_approval': True,
        'requires_dedup_check': True,
        'auto_approve_if': 'dedup_passed'
    },
    'external_api_call': {
        'description': 'Call external API with user data',
        'risk_level': 'medium',
        'requires_approval': False,  # But logged
        'auto_approve_if': None
    },
    'config_change': {
        'description': 'Modify system configuration',
        'risk_level': 'high',
        'requires_approval': True,
        'auto_approve_if': None
    }
}

class ApprovalGate:
    def __init__(self, state_file: str = "~/.openclaw/security/approval_state.json"):
        self.state_file = os.path.expanduser(state_file)
        self.pending_approvals = {}
        self.load_state()
    
    def load_state(self):
        """Load pending approvals from disk"""
        if os.path.exists(self.state_file):
            with open(self.state_file, 'r') as f:
                self.pending_approvals = json.load(f)
    
    def save_state(self):
        """Save pending approvals to disk"""
        os.makedirs(os.path.dirname(self.state_file), exist_ok=True)
        with open(self.state_file, 'w') as f:
            json.dump(self.pending_approvals, f, indent=2)
    
    def request_approval(self, action_type: str, details: dict, 
                        callback: Optional[Callable] = None) -> dict:
        """
        Request approval for an action
        Returns a request ID and status
        """
        if action_type not in APPROVAL_REQUIRED_ACTIONS:
            return {'status': 'approved', 'reason': 'Action type not in approval list'}
        
        config = APPROVAL_REQUIRED_ACTIONS[action_type]
        
        # Check auto-approve conditions
        if config.get('auto_approve_if') == 'dedup_passed' and details.get('dedup_passed'):
            return {'status': 'approved', 'reason': 'Auto-approved: duplicate check passed'}
        
        if not config['requires_approval']:
            return {'status': 'approved', 'reason': 'No approval required for this action type'}
        
        # Create approval request
        request_id = f"{action_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{hash(str(details)) % 10000}"
        
        approval_request = {
            'id': request_id,
            'action_type': action_type,
            'description': config['description'],
            'risk_level': config['risk_level'],
            'details': details,
            'status': 'pending',
            'requested_at': datetime.now().isoformat(),
            'prefer_trash': config.get('prefer_trash', False)
        }
        
        self.pending_approvals[request_id] = approval_request
        self.save_state()
        
        # In real implementation, this would send a message to Telegram
        # For now, we return the request for manual approval
        return {
            'status': 'pending',
            'request_id': request_id,
            'message': f"Approval required for: {config['description']}",
            'action': 'Please review and approve/reject'
        }
    
    def approve(self, request_id: str) -> dict:
        """Approve a pending request"""
        if request_id not in self.pending_approvals:
            return {'error': 'Request not found'}
        
        self.pending_approvals[request_id]['status'] = 'approved'
        self.pending_approvals[request_id]['approved_at'] = datetime.now().isoformat()
        self.save_state()
        
        return {'status': 'approved', 'request_id': request_id}
    
    def reject(self, request_id: str, reason: str = "") -> dict:
        """Reject a pending request"""
        if request_id not in self.pending_approvals:
            return {'error': 'Request not found'}
        
        self.pending_approvals[request_id]['status'] = 'rejected'
        self.pending_approvals[request_id]['rejected_at'] = datetime.now().isoformat()
        self.pending_approvals[request_id]['reject_reason'] = reason
        self.save_state()
        
        return {'status': 'rejected', 'request_id': request_id}
    
    def get_pending(self) -> list:
        """Get all pending approval requests"""
        return [r for r in self.pending_approvals.values() if r['status'] == 'pending']
    
    def check_permission(self, action_type: str, context: dict = None) -> dict:
        """
        Quick check if action is allowed without full approval flow
        Used forTier 1/2 actions
        """
        context = context or {}
        
        # Tier 1: Silent action - no approval needed
        if context.get('tier') == 1:
            return {'allowed': True, 'reason': 'Tier 1 action'}
        
        # Tier 2: Do + Notify - proceed but log
        if context.get('tier') == 2:
            return {'allowed': True, 'notify': True, 'reason': 'Tier 2 action'}
        
        # Check specific action config
        if action_type in APPROVAL_REQUIRED_ACTIONS:
            config = APPROVAL_REQUIRED_ACTIONS[action_type]
            if config['requires_approval']:
                return {'allowed': False, 'requires_approval': True}
        
        return {'allowed': True}

# Global instance
approval_gate = ApprovalGate()

if __name__ == "__main__":
    # Test
    result = approval_gate.request_approval('email_send', {
        'to': 'test@example.com',
        'subject': 'Test email'
    })
    print("Approval request:", result)
    
    if result['status'] == 'pending':
        # Simulate approval
        approve_result = approval_gate.approve(result['request_id'])
        print("Approved:", approve_result)
