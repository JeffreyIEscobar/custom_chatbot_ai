#!/bin/bash

const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const fileButton = document.getElementById('fileButton');
const fileInput = document.getElementById('fileInput');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');
const historyContainer = document.getElementById('historyContainer');

let currentSessionId = null;

sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
fileButton.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);
sidebarToggle.addEventListener('click', toggleSidebar);

function sendMessage() {
    const message = userInput.value.trim();
    if (message !== '') {
        if (!currentSessionId) {
            currentSessionId = generateSessionId(message);
        }
        
        appendMessage(message, 'user-message');
        fetchResponse(message);
        userInput.value = '';
    }
}

function generateSessionId(firstQuestion) {
    return firstQuestion.slice(0, 100);
}

function copyToClipboard(text, copyButton) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text).then(() => {
            console.log("Text copied to clipboard");
            copyButton.innerHTML = '<img src="static/img/checkmark-icon.svg" alt="Checkmark icon" class="checkmark-icon"> Copied!';
            setTimeout(() => {
                copyButton.innerHTML = '<img src="static/img/copy-icon.svg" alt="Copy icon" class="copy-icon"> Copy code';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    } else {
        let textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            console.log('Fallback: Text copied to clipboard');
            copyButton.innerHTML = '<img src="static/img/checkmark-icon.svg" alt="Checkmark icon" class="checkmark-icon"> Copied!';
            setTimeout(() => {
                copyButton.innerHTML = '<img src="static/img/copy-icon.svg" alt="Copy icon" class="copy-icon"> Copy code';
            }, 2000);
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
        }
        document.body.removeChild(textArea);
    }
}

function appendMessage(message, className) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${className}`;

    if (className === 'bot-message' && message.includes('```')) {
        const language = message.split('```')[1].split('\n')[0].trim();
        const codeContent = message.split('```')[1].split('\n').slice(1).join('\n').trim();

        const codeHeader = document.createElement('div');
        codeHeader.className = 'code-header';
        codeHeader.textContent = language;

        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.innerHTML = '<img src="static/img/copy-icon.svg" alt="Copy icon" class="copy-icon"> Copy code';

        copyButton.addEventListener('click', () => {
            console.log("Copy button clicked!");
            copyToClipboard(codeContent, copyButton);
        });

        codeHeader.appendChild(copyButton);

        const pre = document.createElement('pre');
        const codeBlock = document.createElement('code');
        codeBlock.className = `language-${language}`;
        codeBlock.textContent = codeContent;
        pre.appendChild(codeBlock);

        messageDiv.appendChild(codeHeader);
        messageDiv.appendChild(pre);

        hljs.highlightElement(codeBlock);
    } else {
        messageDiv.textContent = message;
    }

    chatContainer.appendChild(messageDiv);
    scrollToBottom();
}

async function fetchResponse(message) {
    appendMessage('Thinking...', 'bot-message thinking');
    try {
        console.log('Sending request to server:', {
            user_input: message,
            session_id: currentSessionId
        });

        const response = await fetch('/get_response', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_input: message, session_id: currentSessionId }),
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        chatContainer.removeChild(chatContainer.lastChild);
        appendMessage(data.response, 'bot-message');
    } catch (error) {
        console.error('Error:', error);
        chatContainer.removeChild(chatContainer.lastChild);
        appendMessage('Sorry, I encountered an error. Please try again.', 'bot-message error');
    }
}

async function fetchChatHistory() {
    try {
        const response = await fetch('/sessions');
        const sessions = await response.json();

        historyContainer.innerHTML = '';
        const ul = document.createElement('ul');
        sessions.forEach(session => {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = '#';
            link.textContent = session.slice(0, 100);
            link.addEventListener('click', () => loadSession(session));
            listItem.appendChild(link);
            historyContainer.appendChild(listItem);
        });
    } catch (error) {
        console.error('Error fetching chat history:', error);
    }
}

async function loadSession(sessionId) {
    try {
        currentSessionId = sessionId;
        const response = await fetch(`/chat_history?session_id=${sessionId}`);
        const chatHistory = await response.json();

        chatContainer.innerHTML = '';
        chatHistory.forEach(entry => {
            appendMessage(`[${entry.timestamp}] ${entry.user_input}`, 'user-message');
            appendMessage(entry.bot_response, 'bot-message');
        });
    } catch (error) {
        console.error('Error loading session:', error);
    }
}

function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        appendMessage(`File selected: ${file.name}`, 'user-message');
    }
}

function toggleSidebar() {
    sidebar.classList.toggle('visible');
    document.querySelector('.App').classList.toggle('sidebar-open');
    
    if (sidebar.classList.contains('visible')) {
        sidebarToggle.style.display = 'none';
        fetchChatHistory();
    } else {
        sidebarToggle.style.display = 'block';
    }
}

function closeSidebar() {
    sidebar.classList.remove('visible');
    document.querySelector('.App').classList.remove('sidebar-open');
    sidebarToggle.style.display = 'block';
}

sidebarToggle.addEventListener('click', toggleSidebar);

const closeButton = document.createElement('button');
closeButton.innerHTML = '<i class="fas fa-times"></i>';
closeButton.className = 'sidebar-close';
closeButton.addEventListener('click', closeSidebar);

const sidebarHeader = document.createElement('div');
sidebarHeader.className = 'sidebar-header';
sidebarHeader.innerHTML = '<h2>Chat History</h2>';
sidebarHeader.prepend(closeButton);

sidebar.prepend(sidebarHeader);

function init() {
    userInput.focus();
    sendButton.addEventListener('click', sendMessage);
}

init();
