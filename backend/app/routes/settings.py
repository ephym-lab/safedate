from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import Settings

bp = Blueprint('settings', __name__)

@bp.route('', methods=['GET'])
def get_settings():
    settings = Settings.query.first()
    return jsonify(settings.to_dict()), 200

@bp.route('/duress-word', methods=['PUT'])
def update_duress_word():
    data = request.json
    settings = Settings.query.first()
    settings.duressWord = data.get('duressWord', settings.duressWord)
    db.session.commit()
    return jsonify({'message': 'Updated successfully'}), 200

@bp.route('/sound-detection', methods=['PUT'])
def update_sound_detection():
    data = request.json
    settings = Settings.query.first()
    settings.soundDetectionEnabled = data.get('enabled', settings.soundDetectionEnabled)
    db.session.commit()
    return jsonify({'message': 'Updated successfully'}), 200

@bp.route('/user-phone', methods=['PUT'])
def update_user_phone():
    data = request.json
    settings = Settings.query.first()
    settings.userPhone = data.get('userPhone', settings.userPhone)
    db.session.commit()
    return jsonify({'message': 'Updated successfully'}), 200
