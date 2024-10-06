document.addEventListener('DOMContentLoaded', function() {
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const newChatButton = document.getElementById('newChat');
    const clearChatButton = document.getElementById('clearChat');
    const exportChatButton = document.getElementById('exportChat');
    const settingsButton = document.getElementById('settingsButton');
    const themeToggle = document.getElementById('themeToggle');
    const chatList = document.getElementById('chatList');
    const loading = document.getElementById('loading');

    const API_URL = 'https://chatproxy.megestus.workers.dev/';

    let conversationHistory = [];
    let currentChatId = null;
    let chats = [];

    function addMessage(content, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(isUser ? 'user-message' : 'ai-message');
        messageDiv.textContent = content;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function sendMessage() {
        const message = userInput.value.trim();
        if (message) {
            addMessage(message, true);
            userInput.value = '';
            
            conversationHistory.push({
                role: 'user',
                content: message
            });

            loading.style.display = 'block';

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        messages: conversationHistory
                    })
                });

                if (!response.ok) {
                    throw new Error('API 请求失败');
                }

                const data = await response.json();
                const aiResponse = data.response;
                addMessage(aiResponse);

                conversationHistory.push({
                    role: 'assistant',
                    content: aiResponse
                });

                if (conversationHistory.length > 10) {
                    conversationHistory = conversationHistory.slice(-10);
                }
            } catch (error) {
                console.error('错误:', error);
                addMessage('抱歉，发生了一个错误。请稍后再试。', false);
            } finally {
                loading.style.display = 'none';
            }
        }
    }

    function createNewChat() {
        const chatId = Date.now();
        const chatName = `对话 ${chats.length + 1}`;
        const newChat = { id: chatId, name: chatName, messages: [] };
        chats.push(newChat);
        addChatToList(newChat);
        switchToChat(chatId);
    }

    function addChatToList(chat) {
        const li = document.createElement('li');
        li.textContent = chat.name;
        li.dataset.chatId = chat.id;
        li.onclick = () => switchToChat(chat.id);
        chatList.appendChild(li);
    }

    function switchToChat(chatId) {
        currentChatId = chatId;
        chatMessages.innerHTML = '';
        const chat = chats.find(c => c.id === chatId);
        if (chat) {
            chat.messages.forEach(msg => addMessage(msg.content, msg.role === 'user'));
        }
        conversationHistory = chat ? chat.messages : [];
    }

    function clearChat() {
        chatMessages.innerHTML = '';
        conversationHistory = [];
        if (currentChatId) {
            const currentChat = chats.find(chat => chat.id === currentChatId);
            if (currentChat) {
                currentChat.messages = [];
            }
        }
    }

    function exportChat() {
        // 实现导出对话功能
        console.log('Export chat');
    }

    function openSettings() {
        // 实现打开设置功能
        console.log('Open settings');
    }

    function toggleTheme() {
        document.body.classList.toggle('dark-theme');
        const icon = themeToggle.querySelector('i');
        icon.classList.toggle('fa-moon');
        icon.classList.toggle('fa-sun');
    }

    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    newChatButton.addEventListener('click', createNewChat);
    clearChatButton.addEventListener('click', clearChat);
    exportChatButton.addEventListener('click', exportChat);
    settingsButton.addEventListener('click', openSettings);
    themeToggle.addEventListener('click', toggleTheme);

    // 初始化
    createNewChat();
});