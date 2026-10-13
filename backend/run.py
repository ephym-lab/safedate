from app import create_app

app = create_app()

if __name__ == '__main__':
    # run with use_reloader=False if using APScheduler inside the same process to prevent double execution
    # Bind on 0.0.0.0 so browsers resolving localhost as ::1 (IPv6) can still reach the API
    app.run(debug=True, use_reloader=False, host='0.0.0.0', port=5001)

