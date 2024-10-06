document.addEventListener('DOMContentLoaded', function () {
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const themeToggle = document.getElementById('themeToggle');
    const chatList = document.getElementById('chatList');
    const newChatBtn = document.getElementById('newChatBtn');
    const chatHeader = document.querySelector('.chat-header h1');

    const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
    const API_URL = 'https://spark-api-open.xf-yun.com/v1/chat/completions';
    // 使用环境变量获取API密钥
    const API_KEY = process.env.SPARK_API_KEY || '';
    const MODEL_NAME = '4.0Ultra';

    let chats = loadChats();
    let currentChatId = null;

    function loadChats() {
        const savedChats = localStorage.getItem('chats');
        return savedChats ? JSON.parse(savedChats) : [];
    }

    function saveChats() {
        localStorage.setItem('chats', JSON.stringify(chats));
    }

    function createIconAvatar(isUser) {
        const avatarDiv = document.createElement('div');
        avatarDiv.classList.add('avatar', 'icon-avatar');
        const icon = document.createElement('i');
        icon.classList.add('fas', isUser ? 'fa-user' : 'fa-robot');
        avatarDiv.appendChild(icon);
        return avatarDiv;
    }

    function addMessage(content, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(isUser ? 'user-message' : 'ai-message');

        const messageInfoDiv = document.createElement('div');
        messageInfoDiv.classList.add('message-info');

        const avatarDiv = createIconAvatar(isUser);
        messageInfoDiv.appendChild(avatarDiv);

        const nameSpan = document.createElement('span');
        nameSpan.classList.add('message-name');
        nameSpan.textContent = isUser ? '用户' : MODEL_NAME;
        messageInfoDiv.appendChild(nameSpan);

        const contentDiv = document.createElement('div');
        contentDiv.classList.add('message-content');
        contentDiv.textContent = content;

        messageDiv.appendChild(messageInfoDiv);
        messageDiv.appendChild(contentDiv);

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addLoadingMessage() {
        const loadingDiv = document.createElement('div');
        loadingDiv.classList.add('message', 'ai-message', 'loading-message');

        const avatarDiv = createIconAvatar(false);

        const loadingContent = document.createElement('div');
        loadingContent.classList.add('message-content');
        loadingContent.innerHTML = '<div class="loading-animation"><div></div><div></div><div></div></div>';

        loadingDiv.appendChild(avatarDiv);
        loadingDiv.appendChild(loadingContent);

        chatMessages.appendChild(loadingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return loadingDiv;
    }

    function removeLoadingMessage(loadingDiv) {
        if (loadingDiv && loadingDiv.parentNode) {
            loadingDiv.parentNode.removeChild(loadingDiv);
        }
    }

    function displaySavedMessages() {
        const currentChat = chats.find(chat => chat.id === currentChatId);
        if (currentChat) {
            currentChat.messages.forEach(msg => {
                addMessage(msg.content, msg.role === 'user');
            });
        }
    }

    async function sendMessage() {
        const message = userInput.value.trim();
        if (message) {
            addMessage(message, true);
            userInput.value = '';

            const currentChat = chats.find(chat => chat.id === currentChatId);
            currentChat.messages.push({
                role: 'user',
                content: message
            });

            const loadingMessage = addLoadingMessage();

            try {
                console.log('Sending request to API...');
                const response = await fetch(CORS_PROXY + API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${API_KEY}`
                    },
                    body: JSON.stringify({
                        model: MODEL_NAME,
                        messages: currentChat.messages,
                        stream: false
                    })
                });

                console.log('Response status:', response.status);

                if (!response.ok) {
                    throw new Error(`API 请求失败: ${response.status}`);
                }

                const data = await response.json();
                console.log('API response:', data);

                const aiResponse = data.choices[0].message.content;

                removeLoadingMessage(loadingMessage);
                addMessage(aiResponse);

                currentChat.messages.push({
                    role: 'assistant',
                    content: aiResponse
                });

                saveChats();
            } catch (error) {
                console.error('错误:', error);
                removeLoadingMessage(loadingMessage);
                addMessage('抱歉，发生了一个错误。请稍后再试。', false);
            }
        }
    }

    function createNewChat() {
        console.log('Creating new chat...');
        const chatId = Date.now().toString();
        const newChatName = `AI 聊天助手 ${chats.length + 1}`;
        const newChat = {
            id: chatId,
            name: newChatName,
            messages: []
        };
        chats.push(newChat);
        saveChats();
        renderChatList();
        switchToChat(chatId);
        console.log('New chat created:', newChat);
    }

    function renderChatList() {
        console.log('Rendering chat list...');
        chatList.innerHTML = '';
        chats.forEach(chat => {
            const li = document.createElement('li');
            li.classList.add('chat-list-item');
            li.dataset.chatId = chat.id;
            li.innerHTML = `
                <span class="edit-icon" title="编辑"><i class="fas fa-edit"></i></span>
                <span class="chat-name">${chat.name}</span>
                <div class="chat-actions">
                    <button class="delete-chat" title="删除"><i class="fas fa-trash"></i></button>
                </div>
            `;
            const chatName = li.querySelector('.chat-name');
            li.querySelector('.edit-icon').addEventListener('click', (e) => {
                e.stopPropagation();
                chatName.contentEditable = 'true';
                chatName.focus();
            });
            chatName.addEventListener('blur', () => {
                chatName.contentEditable = 'false';
                updateChatName(chat.id, li);
            });
            chatName.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    chatName.blur();
                }
            });
            li.addEventListener('click', (e) => {
                if (e.target !== chatName && !e.target.closest('.chat-actions')) {
                    switchToChat(chat.id);
                }
            });
            li.querySelector('.delete-chat').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteChat(chat.id);
            });
            chatList.appendChild(li);
        });
        console.log('Chat list rendered:', chats);
    }

    function updateChatName(chatId, listItem) {
        const chat = chats.find(c => c.id === chatId);
        const newName = listItem.querySelector('.chat-name').textContent.trim();
        if (newName && newName !== chat.name) {
            chat.name = newName;
            saveChats();
            if (currentChatId === chatId) {
                chatHeader.querySelector('.chat-title').textContent = chat.name;
            }
        } else {
            listItem.querySelector('.chat-name').textContent = chat.name;
        }
    }

    function switchToChat(chatId) {
        console.log('Switching to chat:', chatId);
        currentChatId = chatId;
        const chat = chats.find(c => c.id === chatId);
        if (!chat) {
            console.error('Chat not found:', chatId);
            return;
        }
        chatMessages.innerHTML = '';
        displaySavedMessages();
        document.querySelectorAll('.chat-list-item').forEach(item => {
            item.classList.toggle('active', item.dataset.chatId === chatId);
        });
        chatHeader.innerHTML = `
            <span class="edit-icon" title="编辑"><i class="fas fa-edit"></i></span>
            <span class="chat-title">${chat.name}</span>
        `;
        setupChatHeaderListeners();
        console.log('Switched to chat:', chatId, 'with messages:', chat.messages);
    }

    function setupChatHeaderListeners() {
        const chatTitle = chatHeader.querySelector('.chat-title');
        const editIcon = chatHeader.querySelector('.edit-icon');

        editIcon.addEventListener('click', () => {
            chatTitle.contentEditable = 'true';
            chatTitle.focus();
        });

        chatTitle.addEventListener('blur', () => {
            chatTitle.contentEditable = 'false';
            if (currentChatId) {
                const chat = chats.find(c => c.id === currentChatId);
                const newName = chatTitle.textContent.trim();
                if (newName && newName !== chat.name) {
                    chat.name = newName;
                    saveChats();
                    renderChatList();
                } else {
                    chatTitle.textContent = chat.name;
                }
            }
        });

        chatTitle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                chatTitle.blur();
            }
        });
    }

    function deleteChat(chatId) {
        chats = chats.filter(c => c.id !== chatId);
        saveChats();
        renderChatList();
        if (currentChatId === chatId) {
            if (chats.length > 0) {
                switchToChat(chats[0].id);
            } else {
                createNewChat();
            }
        }
    }

    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    themeToggle.addEventListener('click', function () {
        document.body.classList.toggle('dark-theme');
        const icon = themeToggle.querySelector('i');
        icon.classList.toggle('fa-moon');
        icon.classList.toggle('fa-sun');
    });

    newChatBtn.addEventListener('click', createNewChat);

    // 初始化
    renderChatList();
    if (chats.length === 0) {
        createNewChat();
    } else {
        switchToChat(chats[0].id);
    }
    setupChatHeaderListeners();
});