from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import Session, Event, Settings
from app.utils import trigger_escalation, trigger_fake_call, send_sms
from datetime import datetime, timezone
import urllib.parse
import re

bp = Blueprint('sms', __name__)

@bp.route('/inbound', methods=['POST'])
def inbound_sms():
    # Africa's Talking sends inbound SMS data via form-urlencoded
    data = request.form
    sender = data.get('from')
    text = data.get('text', '').strip().lower()
    
    print(f"Received SMS from {sender}: {text}")
    
    # Find active session (in MVP assume user only has one active)
    active_session = Session.query.filter_by(isActive=True).first()
    
    if active_session:
        settings = Settings.query.first()
        
        # Verify the sender is the user if userPhone is set
        user_phone = settings.userPhone if settings else None
        if user_phone and sender != user_phone:
            print(f"Ignored SMS from {sender} (does not match userPhone {user_phone})")
            return '', 200

        # Guard against missing settings row; fall back to hardcoded default
        global_word = settings.duressWord if settings else 'butterfly'
        duress = (active_session.duressWord or global_word).lower().strip()
        
        print(f"[SMS] Checking reply '{text}' against duress word '{duress}'")
        
        # Use whole-word match to avoid false positives (e.g. "butterflies" != "butterfly")
        duress_triggered = bool(re.search(r'\b' + re.escape(duress) + r'\b', text))
        
        if text in ('okay', 'ok'):
            event = Event(session_id=active_session.id, type='check_in', description=f'Reply received: {text}')
            db.session.add(event)
            db.session.commit()
            
        elif text in ('end', 'stop', 'done'):
            active_session.isActive = False
            active_session.status = 'completed'
            active_session.endTime = datetime.now(timezone.utc)
            event = Event(session_id=active_session.id, type='ended', description=f'Session ended via SMS')
            db.session.add(event)
            db.session.commit()
            if sender:
                send_sms([sender], "Your safe date session has been marked as completed.", use_sender_id=True)
                
        elif text in ('arrived', 'here'):
            from app.routes.sessions import mark_arrived
            mark_arrived(active_session)
            event = Event(session_id=active_session.id, type='check_in', description='Arrived at location via SMS')
            db.session.add(event)
            db.session.commit()
            if sender:
                send_sms([sender], "You've been marked as arrived. We'll check in on you periodically.", use_sender_id=True)
                
        elif text in ('call', 'call me', 'fake call'):
            trigger_fake_call(active_session.id)
            event = Event(session_id=active_session.id, type='check_in', description=f'Fake call requested via SMS')
            db.session.add(event)
            db.session.commit()
            if sender:
                send_sms([sender], "Fake call request sent to your emergency contacts.", use_sender_id=True)

        elif text == 'help' or duress_triggered:
            event = Event(session_id=active_session.id, type='alert', description=f'Distress reply received: {text}')
            db.session.add(event)
            db.session.commit()
            trigger_escalation(active_session.id, 'Distress message received via SMS')
            
        elif text == 'status':
            event = Event(session_id=active_session.id, type='check_in', description=f'Status checked via SMS')
            db.session.add(event)
            db.session.commit()
            if sender:
                send_sms([sender], f"Active session '{active_session.matchName}' is currently {active_session.status}.", use_sender_id=True)

        else:
            event = Event(session_id=active_session.id, type='check_in', description=f'Unrecognized reply: {text}')
            db.session.add(event)
            db.session.commit()

    return '', 200