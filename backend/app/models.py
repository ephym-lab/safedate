from datetime import datetime, timezone
from app.extensions import db

class Session(db.Model):
    __tablename__ = 'sessions'
    id = db.Column(db.String(50), primary_key=True)
    matchName = db.Column(db.String(100), nullable=False)
    platform = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(255), nullable=False)
    date = db.Column(db.String(50), nullable=False)
    time = db.Column(db.String(50), nullable=False)
    notes = db.Column(db.Text, nullable=True)
    isActive = db.Column(db.Boolean, default=True)
    startTime = db.Column(db.DateTime, nullable=True)
    endTime = db.Column(db.DateTime, nullable=True)
    createdAt = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    duressWord = db.Column(db.String(100), nullable=True)
    soundDetectionEnabled = db.Column(db.Boolean, default=False)
    status = db.Column(db.String(50), default='scheduled')
    
    # Store contacts as a comma-separated list of IDs for simplicity in SQLite 
    # instead of association table to match frontend string[] behavior quickly
    emergencyContacts = db.Column(db.Text, default='[]')

    def to_dict(self):
        import json
        return {
            'id': self.id,
            'matchName': self.matchName,
            'platform': self.platform,
            'location': self.location,
            'date': self.date,
            'time': self.time,
            'notes': self.notes or '',
            'isActive': self.isActive,
            'startTime': self.startTime.isoformat() if self.startTime else None,
            'endTime': self.endTime.isoformat() if self.endTime else None,
            'createdAt': self.createdAt.isoformat() if self.createdAt else None,
            'duressWord': self.duressWord,
            'soundDetectionEnabled': self.soundDetectionEnabled,
            'status': self.status,
            'emergencyContacts': json.loads(self.emergencyContacts) if self.emergencyContacts else []
        }

class EmergencyContact(db.Model):
    __tablename__ = 'emergency_contacts'
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(50), nullable=False)
    relationship = db.Column(db.String(100), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'phone': self.phone,
            'relationship': self.relationship or ''
        }

class Event(db.Model):
    __tablename__ = 'events'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    session_id = db.Column(db.String(50), db.ForeignKey('sessions.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    type = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(255), nullable=False)
    data = db.Column(db.Text, nullable=True) # JSON string

    def to_dict(self):
        import json
        return {
            'session_id': self.session_id,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'type': self.type,
            'description': self.description,
            'data': json.loads(self.data) if self.data else None
        }

class Settings(db.Model):
    __tablename__ = 'settings'
    id = db.Column(db.Integer, primary_key=True)
    duressWord = db.Column(db.String(100), default='butterfly')
    soundDetectionEnabled = db.Column(db.Boolean, default=False)
    userPhone = db.Column(db.String(50), nullable=True)
    
    def to_dict(self):
        return {
            'duressWord': self.duressWord,
            'soundDetectionEnabled': self.soundDetectionEnabled,
            'userPhone': self.userPhone or ''
        }
