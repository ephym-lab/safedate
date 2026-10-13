from flask import Blueprint, request, jsonify
from app.models import Event
from app.extensions import db

bp = Blueprint('events', __name__)

@bp.route('', methods=['GET'])
def get_events():
    """Return all events, optionally filtered by type and/or session_id."""
    event_type  = request.args.get('type')
    session_id  = request.args.get('session_id')
    query = Event.query.order_by(Event.timestamp.desc())
    if event_type:
        query = query.filter_by(type=event_type)
    if session_id:
        query = query.filter_by(session_id=session_id)
    events = query.all()
    return jsonify([e.to_dict() for e in events]), 200
