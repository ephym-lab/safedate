from flask import Flask
from flask_cors import CORS
from app.extensions import db, scheduler
import africastalking
from config import Config
import os

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    CORS(app)
    db.init_app(app)

    # Initialize Africa's Talking
    africastalking.initialize(
        app.config['AFRICASTALKING_USERNAME'],
        app.config['AFRICASTALKING_API_KEY']
    )

    # Start APScheduler
    scheduler.app = app
    if not scheduler.running:
        scheduler.start()

    # Register blueprints
    from app.routes.sessions import bp as sessions_bp
    from app.routes.contacts import bp as contacts_bp
    from app.routes.settings import bp as settings_bp
    from app.routes.sms import bp as sms_bp
    from app.routes.clips import bp as clips_bp
    from app.routes.events import bp as events_bp

    app.register_blueprint(sessions_bp, url_prefix='/api/sessions')
    app.register_blueprint(contacts_bp, url_prefix='/api/contacts')
    app.register_blueprint(settings_bp, url_prefix='/api/settings')
    app.register_blueprint(sms_bp, url_prefix='/api/sms')
    app.register_blueprint(clips_bp, url_prefix='/api/clips')
    app.register_blueprint(events_bp, url_prefix='/api/events')

    with app.app_context():
        db.create_all()
        # Initialize default settings if empty
        from app.models import Settings
        if not Settings.query.first():
            default_settings = Settings()
            db.session.add(default_settings)
            db.session.commit()

    return app