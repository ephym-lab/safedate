import os
from dotenv import load_dotenv
import africastalking

load_dotenv()

username = os.getenv('AT_USERNAME', 'sandbox')
api_key = os.getenv('AT_API_KEY')
sender_id = os.getenv('AT_SENDER_ID')

print(f"Username: {username}")
print(f"API Key: {api_key[:5]}...{api_key[-5:] if api_key else ''}")
print(f"Sender ID: {sender_id}")

africastalking.initialize(username, api_key)
sms = africastalking.SMS

to_number = '+254756752279'
message = "Test SMS from script!"

try:
    if sender_id:
        response = sms.send(message, [to_number], sender_id)
    else:
        response = sms.send(message, [to_number])
    print(response)
except Exception as e:
    print(f"Error: {e}")
