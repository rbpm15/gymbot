document.addEventListener('DOMContentLoaded', () => {
    // Hamburger Menu (Mobile Placeholder logic)
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
            navLinks.style.flexDirection = 'column';
            navLinks.style.position = 'absolute';
            navLinks.style.top = '70px';
            navLinks.style.left = '0';
            navLinks.style.width = '100%';
            navLinks.style.background = 'var(--glass-bg)';
            navLinks.style.backdropFilter = 'blur(10px)';
            navLinks.style.padding = '20px 0';
            navLinks.style.textAlign = 'center';
        });
    }

    // Chatbot Logic
    const chatToggle = document.getElementById('chatToggle');
    const chatClose = document.getElementById('chatClose');
    const chatContainer = document.getElementById('chatContainer');
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    const chatMessages = document.getElementById('chatMessages');
    const quickActions = document.getElementById('quickActions');
    const quickBtns = document.querySelectorAll('.quick-btn');
    
    // Tooltip Elements
    const chatTooltip = document.getElementById('chatTooltip');
    const tooltipClose = document.getElementById('tooltipClose');

    // Toggle Chat
    chatToggle.addEventListener('click', () => {
        chatContainer.classList.add('active');
        chatToggle.style.transform = 'scale(0)';
        if (chatTooltip) {
            chatTooltip.style.display = 'none';
        }
    });

    chatClose.addEventListener('click', () => {
        chatContainer.classList.remove('active');
        chatToggle.style.transform = 'scale(1)';
    });

    // Tooltip interaction
    if (chatTooltip) {
        chatTooltip.style.cursor = 'pointer'; // Make it clear it is clickable
        chatTooltip.addEventListener('click', () => {
            chatContainer.classList.add('active');
            chatToggle.style.transform = 'scale(0)';
            chatTooltip.style.display = 'none';
        });
    }

    if (tooltipClose && chatTooltip) {
        tooltipClose.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent opening the chat when closing the tooltip
            chatTooltip.style.display = 'none';
        });
    }

    // Send Message
    // Send Message
    const sendMessage = async (text) => {
        if (!text.trim()) return;

        // Add user message to UI
        addMessage(text, 'user-message');
        chatInput.value = '';

        // Hide quick actions once user starts chatting
        if (quickActions) {
            quickActions.style.display = 'none';
        }

        // Show loading sequence
        const loader = showLoadingSequence();

        let isDone = false;
        let timeoutIds = [];

        const cleanup = () => {
            isDone = true;
            timeoutIds.forEach(clearTimeout);
            loader.remove();
        };

        try {
            // Start fetch in background
            const fetchPromise = fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: text })
            });

            // Schedule the steps (will only run if fetch hasn't completed yet)
            const scheduleStep = (stepNumber, delay) => {
                const tId = setTimeout(() => {
                    if (!isDone) {
                        loader.transitionToStep(stepNumber);
                    }
                }, delay);
                timeoutIds.push(tId);
            };

            // Schedule steps: 2 at 700ms, 3 at 1400ms, 4 at 2100ms
            scheduleStep(2, 700);
            scheduleStep(3, 1400);
            scheduleStep(4, 2100);

            // Wait for API response
            const response = await fetchPromise;

            // Once API response is here, we show it immediately!
            cleanup();

            if (!response.ok) {
                try {
                    const errData = await response.json();
                    addMessage(`Error del servidor: ${errData.error}`, 'bot-message');
                } catch (e) {
                    addMessage('Lo siento, el servidor no está respondiendo. Intenta de nuevo más tarde.', 'bot-message');
                }
                return;
            }

            const data = await response.json();
            await addBotMessageProgressively(data.reply);
        } catch (error) {
            console.error('Error:', error);
            cleanup();
            addMessage('Hubo un error de conexión.', 'bot-message');
        }
    };

    // UI Helpers
    const formatMarkdown = (text) => {
        if (!text) return '';
        // Replace escaped or literal newlines
        let html = text.replace(/\\n/g, '\n');
        
        // Replace bold text: **text** -> <strong>text</strong>
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Convert bullet points (* or -) into line breaks with nice bullets
        html = html.replace(/(?:\s|^)\*\s/g, '<br>• ');
        html = html.replace(/(?:\s|^)-\s/g, '<br>• ');
        
        // Replace remaining newlines with <br>
        html = html.replace(/\n/g, '<br>');
        
        // Remove redundant leading line breaks
        html = html.replace(/^(<br>)+/, '');
        
        return html;
    };

    const addMessage = (text, className) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${className}`;
        msgDiv.innerHTML = className === 'bot-message' ? formatMarkdown(text) : text;
        chatMessages.appendChild(msgDiv);
        scrollToBottom();
    };

    const addBotMessageProgressively = async (text) => {
        if (!text) return;
        
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message bot-message';
        chatMessages.appendChild(msgDiv);
        scrollToBottom();

        // Split text by double newlines or single newlines that form paragraph blocks
        const rawParagraphs = text.replace(/\\n/g, '\n').split(/\n\s*\n/);
        
        for (let i = 0; i < rawParagraphs.length; i++) {
            if (!rawParagraphs[i].trim()) continue;

            if (i > 0) {
                const spacer = document.createElement('div');
                spacer.style.height = '10px';
                msgDiv.appendChild(spacer);
            }

            const pSpan = document.createElement('span');
            pSpan.style.opacity = '0';
            pSpan.style.display = 'block';
            pSpan.style.transition = 'opacity 0.4s ease';
            pSpan.innerHTML = formatMarkdown(rawParagraphs[i]);
            msgDiv.appendChild(pSpan);
            
            // Force reflow
            pSpan.offsetHeight;
            pSpan.style.opacity = '1';
            
            scrollToBottom();
            
            if (i < rawParagraphs.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 400));
            }
        }
    };

    const showLoadingSequence = () => {
        const id = 'loading-' + Date.now();
        const seqDiv = document.createElement('div');
        seqDiv.className = 'loading-sequence';
        seqDiv.id = id;
        
        seqDiv.innerHTML = `
            <div class="loading-step visible active" id="${id}-step1">
                <span class="step-icon spinner"></span>
                <span class="step-text">Analizando tu solicitud...</span>
            </div>
            <div class="loading-step" id="${id}-step2">
                <span class="step-icon"></span>
                <span class="step-text">Identificación de detalles clave</span>
            </div>
            <div class="loading-step" id="${id}-step3">
                <span class="step-icon"></span>
                <span class="step-text">Encontrar información relevante</span>
            </div>
            <div class="loading-step" id="${id}-step4">
                <span class="step-icon"></span>
                <span class="step-text">Revisando la información recopilada</span>
            </div>
        `;
        
        chatMessages.appendChild(seqDiv);
        scrollToBottom();

        let currentStep = 1;

        return {
            id,
            getCurrentStep: () => currentStep,
            transitionToStep: (stepNumber) => {
                // Mark previous step as completed
                const prevId = `${id}-step${stepNumber - 1}`;
                const prevEl = document.getElementById(prevId);
                if (prevEl) {
                    prevEl.className = 'loading-step visible completed';
                    const icon = prevEl.querySelector('.step-icon');
                    if (icon) {
                        icon.className = 'step-icon check';
                        icon.innerHTML = '✓';
                    }
                    const textEl = prevEl.querySelector('.step-text');
                    if (textEl) {
                        textEl.textContent = textEl.textContent.replace('...', '');
                    }
                }

                // Set current step as active
                const currId = `${id}-step${stepNumber}`;
                const currEl = document.getElementById(currId);
                if (currEl) {
                    currEl.className = 'loading-step visible active';
                    const icon = currEl.querySelector('.step-icon');
                    if (icon) {
                        if (stepNumber === 4) {
                            icon.className = 'step-icon sparkle';
                            icon.innerHTML = '✦';
                        } else {
                            icon.className = 'step-icon spinner';
                            icon.innerHTML = '';
                        }
                    }
                    const textEl = currEl.querySelector('.step-text');
                    if (textEl && !textEl.textContent.endsWith('...')) {
                        textEl.textContent += '...';
                    }
                    scrollToBottom();
                }
                currentStep = stepNumber;
            },
            remove: () => {
                const el = document.getElementById(id);
                if (el) el.remove();
            }
        };
    };

    const scrollToBottom = () => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    // Event Listeners
    chatSend.addEventListener('click', () => {
        sendMessage(chatInput.value);
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage(chatInput.value);
        }
    });

    quickBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const query = btn.getAttribute('data-query');
            sendMessage(query);
        });
    });

    // Modal de Registro Logic
    const registrationModal = document.getElementById('registrationModal');
    const modalClose = document.getElementById('modalClose');
    const registrationForm = document.getElementById('registrationForm');
    const modalSuccess = document.getElementById('modalSuccess');
    const regPlan = document.getElementById('regPlan');
    const selectedPlanInput = document.getElementById('selectedPlanInput');
    const choosePlanBtns = document.querySelectorAll('.plan-card button');

    if (choosePlanBtns && registrationModal) {
        choosePlanBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const planCard = btn.closest('.plan-card');
                const planName = planCard.querySelector('h3').textContent;
                
                // Show form, hide success message, clear form fields first
                registrationForm.style.display = 'block';
                modalSuccess.classList.remove('active');
                registrationForm.reset();

                // Then pre-populate plan in the modal form
                regPlan.value = planName;
                selectedPlanInput.value = planName;
                
                // Show modal
                registrationModal.classList.add('active');
            });
        });
    }

    if (modalClose && registrationModal) {
        modalClose.addEventListener('click', () => {
            registrationModal.classList.remove('active');
        });
        
        // Close modal on click outside modal-content
        registrationModal.addEventListener('click', (e) => {
            if (e.target === registrationModal) {
                registrationModal.classList.remove('active');
            }
        });
    }

    if (registrationForm && modalSuccess) {
        registrationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Gather input values
            const name = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const phone = document.getElementById('regPhone').value;
            const plan = selectedPlanInput.value;
            
            // Show loading state on submit button
            const submitBtn = registrationForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = 'Enviando...';
            submitBtn.disabled = true;

            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, email, phone, plan })
                });

                if (!response.ok) {
                    throw new Error('El servidor respondió con un error.');
                }

                // Hide form and show success message
                registrationForm.style.display = 'none';
                modalSuccess.classList.add('active');
                
                // Auto close after 3 seconds
                setTimeout(() => {
                    registrationModal.classList.remove('active');
                }, 3000);
            } catch (error) {
                console.error("Error submitting registration:", error);
                alert("Hubo un problema al guardar tus datos. Inténtalo de nuevo.");
            } finally {
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }
});
