// 常量和全局变量
const API_URL = 'https://spark-api-open.xf-yun.com/v1/chat/completions';
const API_KEY = 'LbofYuIcCrBNLlteuvPO:pdpQAlCHpqfbzefUxfHY';

let isDarkTheme = false;
let currentChatId = null;
let chats = [];
let originalHTML = '';

// API 相关函数
async function fetchAIResponse(message) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
    };

    const data = {
        "model": "4.0Ultra",
        "messages": [
            {
                "role": "user",
                "content": message
            }
        ],
        "stream": false,
        "temperature": 0.7,
        "max_tokens": 4096
    };

    try {
        console.log('Sending request to API:', data);
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data)
        });

        console.log('Response status:', response.status);
        const responseText = await response.text();
        console.log('Response text:', responseText);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
        }

        const result = JSON.parse(responseText);
        
        if (result.code !== 0) {
            throw new Error(`API error! code: ${result.code}, message: ${result.message}`);
        }

        if (!result.choices || result.choices.length === 0) {
            throw new Error('No response from AI');
        }

        return result.choices[0].message.content;
    } catch (error) {
        console.error('Error in fetchAIResponse:', error);
        throw error;
    }
}

// 聊天相关函数
async function sendMessage() {
    const userInput = document.getElementById('userInput');
    const loading = document.getElementById('loading');

    if (userInput.value.trim() !== '') {
        addMessage('user', userInput.value);
        
        const userMessage = userInput.value;
        userInput.value = '';
        loading.style.display = 'block';

        try {
            console.log('Sending message to AI:', userMessage);
            const response = await fetchAIResponse(userMessage);
            console.log('Received response from AI:', response);
            addMessage('ai', response);
        } catch (error) {
            console.error('Error in sendMessage:', error);
            addMessage('ai', `抱歉，我遇到了一些问题：${error.message}`);
        } finally {
            loading.style.display = 'none';
        }
    }
}

function addMessage(sender, text) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender === 'user' ? 'user-message' : 'ai-message');
    
    const icon = sender === 'user' ? '👤' : '🤖';
    const time = new Date().toLocaleTimeString();
    
    messageDiv.innerHTML = `
        ${icon} <strong>${sender === 'user' ? '用户' : 'AI'}:</strong> ${text}
        <span class="message-time">${time}</span>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    if (currentChatId !== null) {
        const currentChat = chats.find(chat => chat.id === currentChatId);
        if (currentChat) {
            currentChat.messages.push({ sender, text, time });
        }
    }
}

// 对话管理函数
function createNewChat() {
    const chatId = Date.now();
    const chatName = `对话 ${chats.length + 1}`;
    const newChat = { id: chatId, name: chatName, messages: [] };
    chats.push(newChat);
    addChatToList(newChat);
    switchToChat(chatId);
}

function addChatToList(chat) {
    const chatList = document.getElementById('chatList');
    const li = document.createElement('li');
    li.innerHTML = `
        <span class="chat-name" contenteditable="false">${chat.name}</span>
        <div class="chat-actions">
            <button class="edit-name-btn" title="编辑名称"><i class="fas fa-pencil-alt"></i></button>
            <button class="delete-chat-btn" title="删除对话"><i class="fas fa-trash-alt"></i></button>
        </div>
    `;
    li.dataset.chatId = chat.id;
    const chatName = li.querySelector('.chat-name');
    chatName.ondblclick = (e) => {
        e.stopPropagation();
        toggleEditMode(chat.id);
    };
    chatName.onclick = () => switchToChat(chat.id);
    li.querySelector('.edit-name-btn').onclick = (e) => {
        e.stopPropagation();
        toggleEditMode(chat.id);
    };
    li.querySelector('.delete-chat-btn').onclick = (e) => {
        e.stopPropagation();
        deleteChat(chat.id);
    };
    chatList.appendChild(li);
}

function switchToChat(chatId) {
    if (currentChatId === chatId) return;

    currentChatId = chatId;
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '';
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
        chat.messages.forEach(msg => addMessage(msg.sender, msg.text));
    }

    const chatItems = document.querySelectorAll('#chatList li');
    chatItems.forEach(item => {
        item.classList.toggle('active', item.dataset.chatId === chatId.toString());
    });
}

function deleteChat(chatId) {
    chats = chats.filter(chat => chat.id !== chatId);
    const chatItem = document.querySelector(`#chatList li[data-chat-id="${chatId}"]`);
    chatItem.remove();

    if (currentChatId === chatId) {
        if (chats.length > 0) {
            switchToChat(chats[0].id);
        } else {
            currentChatId = null;
            createNewChat();
        }
    }
}

// UI 相关函数
function toggleTheme() {
    isDarkTheme = !isDarkTheme;
    document.body.classList.toggle('dark-theme', isDarkTheme);
    const themeIcon = document.querySelector('#themeToggle i');
    themeIcon.classList.toggle('fa-moon', !isDarkTheme);
    themeIcon.classList.toggle('fa-sun', isDarkTheme);
}

function clearChat() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '';
    if (currentChatId !== null) {
        const currentChat = chats.find(chat => chat.id === currentChatId);
        if (currentChat) {
            currentChat.messages = [];
        }
    }
}

function toggleEditMode(chatId) {
    const chatItem = document.querySelector(`#chatList li[data-chat-id="${chatId}"]`);
    const chatName = chatItem.querySelector('.chat-name');
    const editBtn = chatItem.querySelector('.edit-name-btn i');

    if (chatName.contentEditable === 'true') {
        saveChatName(chatId, chatName.textContent.trim());
        exitEditMode(chatName, editBtn);
    } else {
        chatName.contentEditable = 'true';
        editBtn.classList.replace('fa-pencil-alt', 'fa-check');
        chatName.focus();
        
        const range = document.createRange();
        range.selectNodeContents(chatName);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        chatName.onkeydown = handleEnterKey;
        chatName.onblur = () => {
            saveChatName(chatId, chatName.textContent.trim());
            exitEditMode(chatName, editBtn);
        };
    }
}

function handleEnterKey(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        event.target.blur();
    }
}

function exitEditMode(chatName, editBtn) {
    chatName.contentEditable = 'false';
    editBtn.classList.replace('fa-check', 'fa-pencil-alt');
    chatName.onkeydown = null;
    chatName.onblur = null;
}

function saveChatName(chatId, newName) {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
        chat.name = newName;
    }
}

function handleSidebarOption(option) {
    const appContainer = document.querySelector('.app-container');
    if (!appContainer) return;

    if (option === 'chats') {
        appContainer.innerHTML = originalHTML;
        
        const sidebar = document.querySelector('.sidebar');
        const chatContainer = document.querySelector('.chat-container');
        
        if (sidebar) sidebar.style.display = 'block';
        if (chatContainer) chatContainer.style.display = 'flex';
        
        addEventListeners();
        
        const chatList = document.getElementById('chatList');
        if (chatList) {
            chatList.innerHTML = '';
            chats.forEach(chat => addChatToList(chat));
        }
        
        if (chats.length === 0) {
            createNewChat();
        } else if (currentChatId) {
            switchToChat(currentChatId);
        } else if (chats.length > 0) {
            switchToChat(chats[0].id);
        }
    } else {
        appContainer.innerHTML = `<h2>${option === 'option2' ? '选项2' : '选项3'}的内容</h2>`;
    }
}

// 初始化和事件监听
function addEventListeners() {
    document.getElementById('userInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    document.querySelector('.send-button').addEventListener('click', sendMessage);
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('clearChat').addEventListener('click', clearChat);
    document.getElementById('newChat').addEventListener('click', createNewChat);
    document.getElementById('exportChat').addEventListener('click', exportChat);
    document.getElementById('settingsButton').addEventListener('click', openSettings);

    const sidebarOptions = document.querySelectorAll('.floating-sidebar li');
    sidebarOptions.forEach(option => {
        option.addEventListener('click', () => {
            sidebarOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            handleSidebarOption(option.dataset.option);
        });
    });
}

function initializeApp() {
    originalHTML = document.querySelector('.app-container').innerHTML;
    if (chats.length === 0) {
        createNewChat();
    }
    
    addEventListeners();
    handleSidebarOption('chats');
}


window.addEventListener('DOMContentLoaded', initializeApp);

// 待实现功能
function exportChat() {
    console.log('Export chat function called');
    // 实现导出对话的功能
}

function openSettings() {
    console.log('Open settings function called');
    // 实现打开设置的功能
}