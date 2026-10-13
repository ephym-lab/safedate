from flask import Blueprint, send_from_directory, current_app
import os

bp = Blueprint('clips', __name__)

@bp.route('/<filename>')
def get_clip(filename):
    uploads_dir = os.path.join(current_app.root_path, 'uploads', 'clips')
    return send_from_directory(uploads_dir, filename)
