from flask import Blueprint, request, jsonify
from app.extensions import db, scheduler
from app.models import Session, Event, Settings
from app.utils import calculate_distance, trigger_escalation, send_sms
from datetime import datetime, timezone, timedelta
import uuid
import json

bp = Blueprint('sessions', __name__)

def check_in_job(session_id):
    with scheduler.app.app_context():
        session = Session.query.get(session_id)
        if not session or not session.isActive:
            return

        settings = Settings.query.first()
        duress = session.duressWord or (settings.duressWord if settings else 'butterfly')
        
        # Log the check-in event
        event = Event(session_id=session_id, type='check_in', description='Periodic check-in sent')
        db.session.add(event)
        db.session.commit()
        
        print(f"Periodic check-in for session {session_id}")
        
        if settings and settings.userPhone:
            message = "Safe Date Check-in: Are you okay? Reply OK, HELP, or CALL."
            from app.utils import send_sms
            send_sms([settings.userPhone], message, use_sender_id=True)
        
        # Schedule a timeout job if no reply in 10 minutes
        run_date = datetime.now(timezone.utc) + timedelta(minutes=10)
        scheduler.add_job(
            id=f"timeout_{session_id}_{datetime.now().timestamp()}",
            func=timeout_job,
            args=[session_id],
            trigger='date',
            run_date=run_date
        )

def timeout_job(session_id):
    with scheduler.app.app_context():
        session = Session.query.get(session_id)
        if not session or not session.isActive:
            return
        
        # In a real app, we would check if a reply was received since the last check-in.
        # We can look at the latest event.
        latest_event = Event.query.filter_by(session_id=session_id).order_by(Event.timestamp.desc()).first()
        if latest_event and latest_event.type == 'check_in':
            # No reply received since check-in
            trigger_escalation(session_id, 'No reply to check-in')

@bp.route('', methods=['GET'])
def get_sessions():
    sessions = Session.query.order_by(Session.createdAt.desc()).all()
    return jsonify([s.to_dict() for s in sessions]), 200

@bp.route('', methods=['POST'])
def create_session():
    data = request.json
    session_id = str(uuid.uuid4())
    
    session = Session(
        id=session_id,
        matchName=data.get('matchName', ''),
        platform=data.get('platform', ''),
        location=data.get('location', ''),
        date=data.get('date', ''),
        time=data.get('time', ''),
        notes=data.get('notes', ''),
        isActive=True,
        emergencyContacts=json.dumps(data.get('emergencyContacts', [])),
        duressWord=data.get('duressWord', ''),
        soundDetectionEnabled=data.get('soundDetectionEnabled', False)
    )
    
    db.session.add(session)
    event = Event(session_id=session_id, type='started', description='Session created')
    db.session.add(event)
    
    db.session.commit()
    return jsonify(session.to_dict()), 201

@bp.route('/<session_id>', methods=['GET'])
def get_session(session_id):
    session = Session.query.get_or_404(session_id)
    events = Event.query.filter_by(session_id=session_id).order_by(Event.timestamp.asc()).all()
    
    session_dict = session.to_dict()
    session_dict['events'] = [e.to_dict() for e in events]
    return jsonify(session_dict), 200

@bp.route('/<session_id>', methods=['PATCH'])
def update_session(session_id):
    session = Session.query.get_or_404(session_id)
    data = request.json
    
    if 'isActive' in data:
        session.isActive = data['isActive']
    if 'status' in data:
        session.status = data['status']
        
    if not session.isActive:
        session.endTime = datetime.now(timezone.utc)
        event = Event(session_id=session_id, type='ended', description=f'Session {session.status}')
        db.session.add(event)
        
    db.session.commit()
    return jsonify(session.to_dict()), 200

@bp.route('/<session_id>', methods=['DELETE'])
def delete_session(session_id):
    session = Session.query.get_or_404(session_id)
    Event.query.filter_by(session_id=session_id).delete()
    db.session.delete(session)
    db.session.commit()
    return '', 204

@bp.route('/<session_id>/location', methods=['POST'])
def receive_location(session_id):
    session = Session.query.get_or_404(session_id)
    if not session.isActive or session.status == 'arrived':
        return jsonify({'message': 'Ignored'}), 200
        
    data = request.json
    user_lat = data.get('lat')
    user_lon = data.get('lng')
    
    # Simple geofencing assuming session.location is 'lat,lng'
    try:
        if ',' in session.location:
            target_lat, target_lon = map(float, session.location.split(','))
            dist = calculate_distance(user_lat, user_lon, target_lat, target_lon)
            if dist <= 150:
                mark_arrived(session)
    except Exception as e:
        print(f"Geofencing error: {e}")
        
    return jsonify({'message': 'Location logged'}), 200

def mark_arrived(session):
    session.status = 'arrived'
    session.startTime = datetime.now(timezone.utc)
    event = Event(session_id=session.id, type='check_in', description='Arrived at location')
    db.session.add(event)
    db.session.commit()
    
    # Schedule periodic check-ins every 45 mins
    # NOTE: APScheduler needs app context during jobs
    scheduler.add_job(
        id=f"checkin_{session.id}",
        func=check_in_job,
        args=[session.id],
        trigger='interval',
        minutes=45
    )

@bp.route('/<session_id>/escalate', methods=['POST'])
def manual_escalate(session_id):
    data = request.json
    reason = data.get('reason', 'Manual escalation triggered')
    trigger_escalation(session_id, reason)
    return jsonify({'message': 'Escalated'}), 200

@bp.route('/<session_id>/check-in', methods=['POST'])
def manual_check_in(session_id):
    session = Session.query.get_or_404(session_id)
    if session.isActive:
        check_in_job(session.id)
    return jsonify({'message': 'Check-in sent'}), 200

@bp.route('/<session_id>/simulate-arrival', methods=['POST'])
def simulate_arrival(session_id):
    session = Session.query.get_or_404(session_id)
    if session.isActive and session.status != 'arrived':
        mark_arrived(session)
    return jsonify(session.to_dict()), 200

@bp.route('/<session_id>/simulate-distress', methods=['POST'])
def simulate_distress(session_id):
    trigger_escalation(session_id, 'Simulated distress sound detected')
    session = Session.query.get(session_id)
    return jsonify(session.to_dict()), 200

def fake_call_job(session_id):
    with scheduler.app.app_context():
        from app.utils import trigger_fake_call
        trigger_fake_call(session_id)

@bp.route('/<session_id>/fake-call', methods=['POST'])
def fake_call(session_id):
    data = request.json or {}
    delay_minutes = data.get('delayMinutes', 1)
    
    run_date = datetime.now(timezone.utc) + timedelta(minutes=delay_minutes)
    scheduler.add_job(
        id=f"fake_call_{session_id}_{datetime.now().timestamp()}",
        func=fake_call_job,
        args=[session_id],
        trigger='date',
        run_date=run_date
    )
    
    return jsonify({'message': f'Fake call scheduled in {delay_minutes} minute(s)'}), 200

@bp.route('/<session_id>/sound-alert', methods=['POST'])
def sound_alert(session_id):
    from flask import current_app
    import os
    
    if request.is_json:
        data = request.json
    else:
        data = request.form

    session = Session.query.get_or_404(session_id)
    if session.status == 'escalated':
        return jsonify({'message': 'Session is already escalated, ignoring duplicate alert'}), 200


    detected_class = data.get('detected_class', 'Unknown')
    confidence = data.get('confidence', 0.0)
    
    reason = f"Distress sound detected: {detected_class} ({confidence} confidence)"
    
    audio_url = None
    if 'audio' in request.files:
        file = request.files['audio']
        if file.filename != '':
            filename = f"{uuid.uuid4()}.webm"
            uploads_dir = os.path.join(current_app.root_path, 'uploads', 'clips')
            os.makedirs(uploads_dir, exist_ok=True)
            file.save(os.path.join(uploads_dir, filename))
            
            # Use PUBLIC_URL if set, else fallback to the user's ngrok URL, else request host
            public_url = current_app.config.get('PUBLIC_URL') or os.environ.get('PUBLIC_URL') or 'https://f4af-41-72-206-78.ngrok-free.app'
            host = public_url.rstrip('/')
            audio_url = f"{host}/api/clips/{filename}"
            
    trigger_escalation(session_id, reason, audio_url)
    
    return jsonify({'message': 'Alert received and escalated'}), 200
