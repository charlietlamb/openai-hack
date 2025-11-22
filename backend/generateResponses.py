import json
import os
from openai import BaseModel, OpenAI
import string
from concurrent.futures import ThreadPoolExecutor, as_completed 
from pathlib import Path
import redis

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ============================================
# REDIS CACHE SETUP
# ============================================
# Redis is an in-memory database - super fast for caching data
# Install with: pip install redis
# Make sure Redis server is running: redis-server

# Redis connection - supports both local development and Vercel (Upstash)
redis_url = os.getenv("REDIS_URL")
if redis_url:
    # For Upstash Redis or Redis with URL format: redis://host:port
    redis_client = redis.from_url(redis_url, decode_responses=True)
else:
    # Fallback to localhost for local development
    redis_client = redis.Redis(
        host='localhost',  # Redis server location
        port=6379,         # Default Redis port
        db=0,              # Database number (Redis has 16 databases by default)
        decode_responses=True  # Automatically convert bytes to strings
    )

def init_character_cache(char_id):
    """
    Initialize a character in Redis cache with default values.
    
    Args:
        char_id (int): Character ID
    """
    key = f"character:{char_id}"
    redis_client.hset(key, mapping={
        'id': char_id,
        'chat': '',  # Empty string initially
        'answer': 'false'  # Store as string ('true' or 'false')
    })

def get_character_data(char_id):
    """
    Retrieve character data from Redis.
    
    Returns:
        dict with keys: id (int), chat (str), answer (bool)
    """
    key = f"character:{char_id}"
    data = redis_client.hgetall(key)
    
    if not data:
        return None
    
    return {
        'id': int(data['id']),
        'chat': data['chat'],
        'answer': data['answer'].lower() == 'true'
    }

def update_character_chat(char_id, chat_text):
    """
    Update the chat field for a character.
    
    Args:
        char_id (int): Character ID
        chat_text (str): The conversation/response text
    """
    key = f"character:{char_id}"
    redis_client.hset(key, 'chat', chat_text)

def update_character_answer(char_id, answer):
    """
    Update the answer field for a character.
    
    Args:
        char_id (int): Character ID
        answer (bool): True for yes, False for no
    """
    key = f"character:{char_id}"
    redis_client.hset(key, 'answer', 'true' if answer else 'false')

def get_all_characters_data():
    """
    Get all character data from Redis.
    
    Returns:
        list of dicts with character data
    """
    keys = redis_client.keys('character:*')
    characters = []
    
    for key in keys:
        data = redis_client.hgetall(key)
        characters.append({
            'id': int(data['id']),
            'chat': data['chat'],
            'answer': data['answer'].lower() == 'true'
        })
    
    return sorted(characters, key=lambda x: x['id'])

def clear_all_characters():
    """Clear all character data from Redis cache."""
    keys = redis_client.keys('character:*')
    if keys:
        redis_client.delete(*keys)

def cleanAnswers():

    for i in range(1, 1001):

        # ID should be padded on the left with 0s.
        char_id = str(i)
        while (len(char_id) < 4): char_id = "0" + char_id

        # Empty the answer and short-answer files
        dir_path = f"char_x1000/character_{char_id}"
        full_path = os.path.join(dir_path, "answer.txt")
        short_path = os.path.join(dir_path, "short-answer.txt")

        # Empty the files
        open(full_path, 'w').close()
        open(short_path, 'w').close()

def query_gpt(prompt, model = "gpt-3.5-turbo"):
    response = client.chat.completions.create(model=model,
    messages=[
        {"role": "system", "content": prompt}
    ],
    max_tokens=150,       # limit the response length
    temperature=0.8       # randomness of output
    )

    # Extract the assistant’s reply
    message = response.choices[0].message.content
    return message

class CharacterResponse(BaseModel):
    class Config:
        extra = "forbid"  # This sets additionalProperties to false
    
    name: str
    persona: str
    
def createNamePersona_x100():
    # Path to the JSON file
    json_path = Path(__file__).parent.parent / "frontend" / "public" / "characters" / "data" / "all-characters.json"
    
    # Load the JSON file once
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    for char_id in range(1, 101):
        # Format the character ID with leading zeros
        char_id_str = str(char_id)
        while len(char_id_str) < 4:
            char_id_str = "0" + char_id_str
        
        char_key = f"character_{char_id_str}"
        
        # Get character description
        description = data["characters"][char_key]["description"]
        
        # Create the prompt - make it more concise to fit in token limit
        prompt = f"{description}\n\nCreate a brief character profile with a name and a 2-3 sentence persona based on the description above."

        # Retry logic for API calls
        max_retries = 3
        for attempt in range(max_retries):
            try:
                # Make API call
                response = client.chat.completions.create(
                    model="gpt-4o-2024-08-06",
                    messages=[
                        {"role": "system", "content": prompt}
                    ],
                    response_format={
                        "type": "json_schema",
                        "json_schema": {
                            "name": "character_response",
                            "strict": True,
                            "schema": CharacterResponse.model_json_schema()
                        }
                    },
                    max_tokens=800,
                    temperature=0.8
                )
                
                # Parse the response
                result = json.loads(response.choices[0].message.content)
                
                # Update the character data with name and persona
                data["characters"][char_key]["name"] = result["name"]
                data["characters"][char_key]["persona"] = result["persona"]
                
                print(f"Updated {char_key}: {result['name']}")
                break  # Success, exit retry loop
                
            except json.JSONDecodeError as e:
                print(f"JSON decode error for {char_key} (attempt {attempt + 1}/{max_retries}): {e}")
                if attempt == max_retries - 1:
                    print(f"Failed to update {char_key} after {max_retries} attempts. Skipping.")
                    data["characters"][char_key]["name"] = "Unknown"
                    data["characters"][char_key]["persona"] = "Character generation failed."
            except Exception as e:
                print(f"Unexpected error for {char_key}: {e}")
                if attempt == max_retries - 1:
                    data["characters"][char_key]["name"] = "Unknown"
                    data["characters"][char_key]["persona"] = "Character generation failed."
    
    # Save the updated JSON file
    print(f"Saving updated file to {json_path}...")
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print("Done!")

def considerQuestion(question, char_id):
    # ID should be padded on the left with 0s.
    char_id = str(char_id)
    while (len(char_id) < 4): char_id = "0" + char_id

    with (
        open(f'char_x1000/character_{char_id}/description.txt', 'r') as desc_f,
        open('prompts/introduction.txt', 'r') as intro_f,
        open('prompts/pre.txt', 'r') as pre_f,
        open('prompts/post.txt', 'r') as post_f,
    ):
        character_description = desc_f.read()
        introduction_prompt = intro_f.read()
        pre_prompt = pre_f.read()
        post_prompt = post_f.read()

    response_1 = query_gpt(character_description + introduction_prompt)
    prompt_2 = character_description + introduction_prompt + response_1 + pre_prompt + question + post_prompt
    response_2 = query_gpt(prompt_2)

    print(response_2)

    return response_2

def getAnswer(prompt):
    short = prompt[-60:]
    print(short)
    if "yes" in short or "Yes" in short:
        return True
    else:
        return False
    
def writeOut(answer, char_id):
    # ID should be padded on the left with 0s.
    char_id = str(char_id)
    while (len(char_id) < 4): char_id = "0" + char_id

    # Build the directory path
    dir_path = f"char_x1000/character_{char_id}"
    os.makedirs(dir_path, exist_ok=True)

    # Paths for the full and short answer files
    full_path = os.path.join(dir_path, "answer.txt")
    short_path = os.path.join(dir_path, "short-answer.txt")

    # Write full answer
    # with open(full_path, "w", encoding="utf-8") as f:
    #     f.write(answer)

    # Generate and write short answer
    short_answer = getAnswer(answer)
    if short_answer: short_answer = "Yes"
    else: short_answer = "No"
    print(short_answer)
    with open(short_path, "w", encoding="utf-8") as f:
        f.write(short_answer)

def process_character(char_id, question):
    """
    Process a single character's response to a question.
    Now also updates Redis cache with the conversation and answer.
    """
    answer = considerQuestion(question, char_id)
    ans_yes = getAnswer(answer)
    # writeOut(answer, char_id)
    
    # Update Redis cache with the character's response
    update_character_chat(char_id, answer)
    update_character_answer(char_id, ans_yes)
    
    return ans_yes

def promptCharacters(question, num):
    count_yes = 0
    count_no  = 0

    # Use ThreadPoolExecutor to parallelize API calls
    # max_workers can be adjusted based on API rate limits
    with ThreadPoolExecutor(max_workers=500) as executor:
        # Submit all tasks
        future_to_char = {
            executor.submit(process_character, i, question): i 
            for i in range(1, num+1)
        }
        
        # Process results as they complete
        for future in as_completed(future_to_char):
            char_id = future_to_char[future]
            try:
                ans_yes = future.result()
                if ans_yes:
                    count_yes += 1
                else:
                    count_no += 1
                print(f"Character {char_id} completed: {'Yes' if ans_yes else 'No'}")
            except Exception as exc:
                print(f"Character {char_id} generated an exception: {exc}")
                count_no += 1  # Count errors as "No" votes
    
    # Return results as a dictionary
    return {
        'yes_count': count_yes,
        'no_count': count_no,
        'total': num
    }

# ============================================
# SERVER CODE - Flask API
# ============================================

from flask import Flask, request, jsonify
from flask_cors import CORS

# Create a Flask app (this is your web server)
app = Flask(__name__)
CORS(app)  # Allow requests from your frontend (important for web apps)

# Route 1: Handle "question" requests
# This endpoint receives a question and asks multiple characters
@app.route('/api/question', methods=['POST'])
def handle_question():
    """
    Expects JSON like:
    {
        "question": "Should I buy these shoes?"
    }
    """
    try:
        # Get the data sent from the frontend
        data = request.json
        question = data.get('question')

        # Validate input
        if not question:
            return jsonify({'error': 'Question is required'}), 400
        
        # Call your existing function to get responses from characters (100 characters)
        results = promptCharacters(question, 100)
        
        # Update cache with results - the promptCharacters function
        # should now also update the cache (see modified process_character)
        
        # Get all cached character data
        cached_data = get_all_characters_data()
        
        # Send back the results as JSON
        return jsonify({
            'success': True,
            'question': question,
            'results': results,
            'characters': cached_data  # Include all character data from cache
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Route 2: Handle "conversation" requests
# This endpoint can be used for back-and-forth conversation with characters
@app.route('/api/conversation', methods=['POST'])
def handle_conversation():
    """
    Expects JSON like:
    {
        "message": "What do you think about this?",
        "character_id": 1,
        "conversation_history": [...]  # Optional: previous messages
    }
    """
    try:
        # Get the data sent from the frontend
        data = request.json
        message = data.get('message')
        character_id = data.get('character_id', 1)
        conversation_history = data.get('conversation_history', [])
        
        # Validate input
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Get response from a single character
        response = considerQuestion(message, character_id)
        answer = getAnswer(response)
        
        # Update Redis cache with conversation and answer
        update_character_chat(character_id, response)
        update_character_answer(character_id, answer)
        
        # Get updated character data from cache
        character_data = get_character_data(character_id)
        
        # Send back the response
        return jsonify({
            'success': True,
            'character_id': character_id,
            'message': message,
            'response': response,
            'answer': answer,
            'cached_data': character_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Health check endpoint (useful to test if server is running)
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Server is running'}), 200


# Route 3: Get all cached character data
@app.route('/api/characters', methods=['GET'])
def get_characters():
    """
    Get all character data from Redis cache.
    Useful for checking the current state of all characters.
    """
    try:
        characters = get_all_characters_data()
        return jsonify({
            'success': True,
            'count': len(characters),
            'characters': characters
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Route 4: Get specific character data
@app.route('/api/characters/<int:char_id>', methods=['GET'])
def get_character(char_id):
    """
    Get data for a specific character from Redis cache.
    """
    try:
        character = get_character_data(char_id)
        if not character:
            return jsonify({'error': 'Character not found'}), 404
        
        return jsonify({
            'success': True,
            'character': character
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Main entry point - start the server
if __name__ == '__main__':
    # Test Redis connection
    try:
        redis_client.ping()
        print("✓ Redis connection successful")
    except redis.ConnectionError:
        print("✗ Redis connection failed! Make sure Redis server is running:")
        print("  Install: sudo apt install redis-server (Ubuntu) or brew install redis (Mac)")
        print("  Start: redis-server")
        exit(1)
    
    # Initialize all 100 characters in Redis at startup
    print("\nInitializing 100 characters in Redis cache...")
    clear_all_characters()  # Clear any old data first
    for i in range(1, 101):
        init_character_cache(i)
    print(f"✓ Initialized {len(get_all_characters_data())} characters")
    
    print("\nStarting Flask server on http://localhost:5037")
    print("Available endpoints:")
    print("  POST /api/question - Ask the village a question")
    print("  POST /api/conversation - Have a conversation with a character")
    print("  GET  /api/characters - Get all cached character data")
    print("  GET  /api/characters/<id> - Get specific character data")
    print("  GET  /api/health - Check if server is running")
    
    # Start the server
    app.run(debug=True, host='0.0.0.0', port=5037)

