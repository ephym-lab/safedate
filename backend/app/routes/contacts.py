from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import EmergencyContact
import uuid

bp = Blueprint('contacts', __name__)

@bp.route('', methods=['GET'])
def get_contacts():
    contacts = EmergencyContact.query.all()
    return jsonify([c.to_dict() for c in contacts]), 200

@bp.route('', methods=['POST'])
def add_contact():
    data = request.json
    contact_id = str(uuid.uuid4())
    contact = EmergencyContact(
        id=contact_id,
        name=data.get('name'),
        phone=data.get('phone'),
        relationship=data.get('relationship', '')
    )
    db.session.add(contact)
    db.session.commit()
    return jsonify(contact.to_dict()), 201

@bp.route('/<contact_id>', methods=['PUT'])
def update_contact(contact_id):
    contact = EmergencyContact.query.get_or_404(contact_id)
    data = request.json
    
    if 'name' in data:
        contact.name = data['name']
    if 'phone' in data:
        contact.phone = data['phone']
    if 'relationship' in data:
        contact.relationship = data['relationship']
        
    db.session.commit()
    return jsonify(contact.to_dict()), 200

@bp.route('/<contact_id>', methods=['DELETE'])
def delete_contact(contact_id):
    contact = EmergencyContact.query.get_or_404(contact_id)
    db.session.delete(contact)
    db.session.commit()
    return '', 204
