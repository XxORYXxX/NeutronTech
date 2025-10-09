// Toggle the chat window (show/hide)
document.querySelector('.chat-float-icon').onclick = function() {
    const chatWindow = document.querySelector('.chat-window');
    if (chatWindow.style.display === 'flex') {
        chatWindow.style.display = 'none';
    } else {
        chatWindow.style.display = 'flex';
    }
};

// Close the chat window
document.querySelector('.chat-close').onclick = function() {
    document.querySelector('.chat-window').style.display = 'none';
};

// Send a message on a button click
document.querySelector('.chat-send').onclick = sendMessage;

// Send a message on an Enter key
document.querySelector('.userInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') sendMessage();
});

async function sendMessage() {
    const inputElem = document.querySelector('.userInput');
    const chatbox = document.querySelector('.chatbox');
    const input = inputElem.value.trim();
    if (!input) return;
    
    chatbox.innerHTML += `<p><b>You:</b> ${input}</p>`;
    inputElem.value = '';
    
    // Add typing indicator
    const typingId = 'bot-typing';
    chatbox.innerHTML += `<p id="${typingId}"><i>Bot is typing...</i></p>`;
    chatbox.scrollTop = chatbox.scrollHeight;
    
    try {
        const res = await fetch('http://localhost:3000/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: input }),
        });
        const data = await res.json();
        
        // Remove the typing indicator
        const typingElem = document.getElementById(typingId);
        if (typingElem) typingElem.remove();
        
        chatbox.innerHTML += `<p><b>Bot:</b> ${data.reply}</p>`;
        chatbox.scrollTop = chatbox.scrollHeight;
    } catch (error) {
        console.error('Error:', error);
        const typingElem = document.getElementById(typingId);
        if (typingElem) typingElem.remove();
        chatbox.innerHTML += `<p><b>Bot:</b> Client error. Please try again.</p>`;
        chatbox.scrollTop = chatbox.scrollHeight;
    }
}