import africastalking
from flask import current_app
from app.models import Session, EmergencyContact, Settings
import math

def send_sms(to_numbers, message, use_sender_id=False):
    try:
        sms = africastalking.SMS
        
        sender_id = current_app.config.get('AFRICASTALKING_SENDER_ID') if use_sender_id else None
        
        # africastalking SDK expects a list of numbers e.g. ["+254711XXXYYY", "+254733YYYZZZ"]
        # In a sandbox or for demo purposes, you might want to print the message as well.
        print(f"Sending SMS to {to_numbers}: {message} (Sender ID: {sender_id or 'Default'})")
        if sender_id:
            response = sms.send(message, to_numbers, sender_id)
        else:
            response = sms.send(message, to_numbers)
        print(f"SMS send response: {response}")
        return response
    except Exception as e:
        print(f"Error sending SMS: {e}")
        return None

def trigger_fake_call(session_id):
    try:
        from app.models import Session, EmergencyContact
        import json
        
        session = Session.query.get(session_id)
        if not session or not session.isActive:
            print("Fake call requested for inactive or non-existent session.")
            return None

        contact_ids = json.loads(session.emergencyContacts) if session.emergencyContacts else []
        
        if contact_ids:
            contacts = EmergencyContact.query.filter(EmergencyContact.id.in_(contact_ids)).all()
        else:
            contacts = EmergencyContact.query.all()
        
        phone_numbers = [c.phone for c in contacts if c.phone]
        
        if phone_numbers:
            message = f"Hey, call me right now with a 'fake emergency'! I need a solid excuse to leave my current date immediately. Please hurry! (Safe Date App)"
            print(f"Triggering Fake Call SMS to contacts: {phone_numbers}")
            return send_sms(phone_numbers, message)
        else:
            print("No emergency contacts found to send fake call request.")
            return None
    except Exception as e:
        print(f"Error triggering fake call: {e}")
        return None

def trigger_escalation(session_id, reason, audio_url=None):
    from app.extensions import db
    from app.models import Event
    session = Session.query.get(session_id)
    if not session or not session.isActive:
        return

    # Trigger escalation logic: notify contacts
    import json
    contact_ids = json.loads(session.emergencyContacts) if session.emergencyContacts else []
    
    if contact_ids:
        contacts = EmergencyContact.query.filter(EmergencyContact.id.in_(contact_ids)).all()
    else:
        contacts = EmergencyContact.query.all()
    
    phone_numbers = [c.phone for c in contacts if c.phone]
    
    if phone_numbers:
        location_str = session.location
        import urllib.parse
        if ',' in session.location:
            try:
                lat, lng = map(float, session.location.split(','))
                location_str = f"https://maps.google.com/?q={lat},{lng}"
            except ValueError:
                encoded = urllib.parse.quote(session.location)
                location_str = f"https://maps.google.com/?q={encoded}"
        else:
            encoded = urllib.parse.quote(session.location)
            location_str = f"https://maps.google.com/?q={encoded}"
            
        message = f"URGENT: I might need help! Reason: {reason}. Location: {location_str}"
        if audio_url:
            message += f" Listen to alert: {audio_url}"
        send_sms(phone_numbers, message)

    # Log event
    event_data = {}
    if audio_url:
        event_data['audioUrl'] = audio_url

    event = Event(
        session_id=session_id, 
        type='alert', 
        description=f"Escalation triggered: {reason}",
        data=json.dumps(event_data) if event_data else None
    )
    db.session.add(event)
    
    session.status = 'escalated'
    db.session.commit()

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate the great circle distance between two points on the earth (specified in decimal degrees)"""
    # convert decimal degrees to radians
    lon1, lat1, lon2, lat2 = map(math.radians, [lon1, lat1, lon2, lat2])

    # haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    r = 6371000 # Radius of earth in meters
    return c * r
