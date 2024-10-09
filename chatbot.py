#!/bin/bash

import os
import json
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import openai
from openai import OpenAIError
from datetime import datetime

load_dotenv()

app = Flask(__name__)
CORS(app)

api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    raise ValueError("No OpenAI API key found. Please set the OPENAI_API_KEY environment variable.")

client = openai.OpenAI(api_key=api_key)

CHAT_HISTORY_FILE = "chat_history.json"

if not os.path.exists(CHAT_HISTORY_FILE):
    with open(CHAT_HISTORY_FILE, 'w') as file:
        json.dump([], file)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_response', methods=['POST'])
def get_response():
    try:
        data = request.get_json()
        user_input = data.get('user_input')
        session_id = data.get('session_id')

        if not user_input or not session_id:
            return jsonify({'error': 'No user input or session ID provided'}), 400

        response = ask_openai(user_input)
        save_chat_history(session_id, user_input, response)
        return jsonify({'response': response})

    except Exception as e:
        app.logger.error(f"An error occurred: {str(e)}")
        return jsonify({'error': 'An internal server error occurred'}), 500

def ask_openai(question):
    try:
        messages = [
            {'role': 'system', 'content': 'You are a helpful AI assistant.'},
            {'role': 'user', 'content': question}
        ]
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=12000,
            n=1,
            stop=None,
            temperature=0.7,
        )
        return response.choices[0].message.content.strip()

    except OpenAIError as e:
        app.logger.error(f"OpenAI API error: {str(e)}")
        raise Exception("Failed to get response from OpenAI")

def save_chat_history(session_id, user_input, bot_response):
    # saves chat history to json file
    try:
        with open(CHAT_HISTORY_FILE, 'r') as file:
            chat_history = json.load(file)

        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        chat_history.append({
            'session_id': session_id,
            'timestamp': timestamp,
            'user_input': user_input,
            'bot_response': bot_response
        })

        with open(CHAT_HISTORY_FILE, 'w') as file:
            json.dump(chat_history, file, indent=4)
    except Exception as e:
        app.logger.error(f"Failed to save chat history: {str(e)}")

@app.route('/chat_history', methods=['GET'])
def chat_history():
    try:
        session_id = request.args.get('session_id')
        with open(CHAT_HISTORY_FILE, 'r') as file:
            chat_history = json.load(file)
        
        if session_id:
            chat_history = [entry for entry in chat_history if entry.get('session_id') == session_id]
        
        return jsonify(chat_history)
    except Exception as e:
        app.logger.error(f"Error fetching chat history: {str(e)}")
        return jsonify([]), 500

@app.route('/sessions', methods=['GET'])
def sessions():
    try:
        with open(CHAT_HISTORY_FILE, 'r') as file:
            chat_history = json.load(file)
        
        sessions = list(set(entry['session_id'] for entry in chat_history if 'session_id' in entry))
        return jsonify(sessions)
    except Exception as e:
        app.logger.error(f"Error fetching sessions: {str(e)}")
        return jsonify([]), 500

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=5003)
