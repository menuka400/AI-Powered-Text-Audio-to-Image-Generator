const API_URL = 'https://be30-35-198-254-190.ngrok-free.app/';

class ImageGenerator {
    constructor() {
        this.initializeElements();
        this.initializeEventListeners();
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.audioStream = null;
        this.mp3Encoder = null;
    }

    initializeElements() {
        this.recordButton = document.getElementById('recordButton');
        this.sendTextButton = document.getElementById('sendTextButton');
        this.textInput = document.getElementById('textInput');
        this.statusDiv = document.getElementById('status');
        this.transcriptionDiv = document.getElementById('transcription');
        this.generatedImage = document.getElementById('generatedImage');
        this.chatHistory = document.getElementById('chatHistory');
        this.loadingSpinner = document.querySelector('.loading-spinner');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
    }

    initializeEventListeners() {
        this.sendTextButton.addEventListener('click', () => this.generateFromText());
        this.recordButton.addEventListener('click', () => this.toggleRecording());
        this.textInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.generateFromText();
        });

        // Add clear history button listener
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());

        // Add image load event listener
        this.generatedImage.addEventListener('load', () => {
            this.hideLoading();
            this.generatedImage.classList.add('visible');
        });
    }

    clearHistory() {
        while (this.chatHistory.firstChild) {
            this.chatHistory.removeChild(this.chatHistory.firstChild);
        }
        this.updateStatus('History cleared!');
    }

    showLoading() {
        this.loadingSpinner.classList.add('visible');
        this.generatedImage.classList.remove('visible');
    }

    hideLoading() {
        this.loadingSpinner.classList.remove('visible');
    }

    updateStatus(message, isError = false) {
        this.statusDiv.textContent = message;
        this.statusDiv.style.color = isError ? '#dc2626' : '#666';
        
        // Add animation effect
        this.statusDiv.style.animation = 'none';
        this.statusDiv.offsetHeight; // Trigger reflow
        this.statusDiv.style.animation = 'fadeIn 0.3s ease-out';
    }

    async generateFromText() {
        const text = this.textInput.value.trim();
        if (!text) {
            this.updateStatus('Please enter a description', true);
            this.textInput.classList.add('shake');
            setTimeout(() => this.textInput.classList.remove('shake'), 500);
            return;
        }

        this.showLoading();
        this.updateStatus('Generating image...');
        this.sendTextButton.disabled = true;

        try {
            const response = await fetch(`${API_URL}/transcribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text })
            });

            const data = await response.json();
            
            if (data.image) {
                this.generatedImage.src = `data:image/png;base64,${data.image}`;
                this.updateChatHistory(text, data.image);
                this.textInput.value = '';
                this.updateStatus('Image Generated Successfully!');
            } else {
                this.updateStatus(data.error || 'Failed to generate image', true);
                this.hideLoading();
            }
        } catch (error) {
            this.updateStatus(`Error: ${error.message}`, true);
            console.error('Generation error:', error);
            this.hideLoading();
        } finally {
            this.sendTextButton.disabled = false;
        }
    }

    async toggleRecording() {
        if (!this.isRecording) {
            await this.startRecording();
        } else {
            await this.stopRecording();
        }
    }

    async startRecording() {
        try {
            this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioChunks = [];
            this.mp3Encoder = new lamejs.Mp3Encoder(1, 44100, 128);
            
            this.mediaRecorder = new MediaRecorder(this.audioStream);
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => this.processAudio();
            this.mediaRecorder.start();
            
            this.isRecording = true;
            this.recordButton.innerHTML = '<i class="fas fa-stop"></i> Stop Recording';
            this.recordButton.classList.add('recording');
            this.updateStatus('Recording...');
        } catch (err) {
            this.updateStatus(`Recording error: ${err.message}`, true);
            console.error('Recording error:', err);
        }
    }

    async stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
            this.audioStream.getTracks().forEach(track => track.stop());
            
            this.isRecording = false;
            this.recordButton.innerHTML = '<i class="fas fa-microphone"></i> Record';
            this.recordButton.classList.remove('recording');
            this.updateStatus('Processing audio...');
        }
    }

    async processAudio() {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        
        const fileReader = new FileReader();
        fileReader.onloadend = async () => {
            const arrayBuffer = fileReader.result;
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            try {
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                const samples = audioBuffer.getChannelData(0);
                const mp3Buffer = this.encodeMP3(samples);
                
                const base64Audio = btoa(String.fromCharCode.apply(null, new Uint8Array(mp3Buffer)));
                
                this.showLoading();
                
                const response = await fetch(`${API_URL}/transcribe`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        audio: base64Audio,
                        filename: 'recorded_audio.mp3'
                    })
                });

                const data = await response.json();
                
                if (data.image) {
                    this.generatedImage.src = `data:image/png;base64,${data.image}`;
                    if (data.text) {
                        this.transcriptionDiv.textContent = `Transcribed: ${data.text}`;
                        this.transcriptionDiv.style.animation = 'fadeIn 0.3s ease-out';
                    }
                    this.updateChatHistory(data.text || 'Audio Input', data.image);
                    this.updateStatus('Image Generated Successfully!');
                } else {
                    this.updateStatus(data.error || 'Failed to generate image', true);
                    this.hideLoading();
                }
            } catch (error) {
                this.updateStatus(`Error processing audio: ${error.message}`, true);
                console.error('Audio processing error:', error);
                this.hideLoading();
            }
        };
        
        fileReader.readAsArrayBuffer(audioBlob);
    }

    encodeMP3(samples) {
        const sampleBlockSize = 1152;
        const mp3Buffers = [];
        
        for (let i = 0; i < samples.length; i += sampleBlockSize) {
            const sampleChunk = samples.subarray(i, i + sampleBlockSize);
            const int16Samples = new Int16Array(sampleChunk.length);
            
            for (let j = 0; j < sampleChunk.length; j++) {
                int16Samples[j] = sampleChunk[j] < 0 
                    ? sampleChunk[j] * 0x8000 
                    : sampleChunk[j] * 0x7FFF;
            }
            
            const mp3Chunk = this.mp3Encoder.encodeBuffer(int16Samples);
            if (mp3Chunk.length > 0) {
                mp3Buffers.push(mp3Chunk);
            }
        }
        
        const finalMp3Chunk = this.mp3Encoder.flush();
        if (finalMp3Chunk.length > 0) {
            mp3Buffers.push(finalMp3Chunk);
        }
        
        return mp3Buffers.reduce((acc, val) => {
            const tmp = new Uint8Array(acc.length + val.length);
            tmp.set(acc, 0);
            tmp.set(val, acc.length);
            return tmp;
        }, new Uint8Array(0));
    }

    updateChatHistory(text, imageBase64) {
        const chatEntry = document.createElement('div');
        chatEntry.className = 'chat-entry';
        chatEntry.innerHTML = `
            <p><strong>Input:</strong> ${text}</p>
            <img src="data:image/png;base64,${imageBase64}" 
                 alt="Generated Image" 
                 style="max-width: 100%; border-radius: 8px; margin-top: 10px;">
        `;
        
        // Add with animation
        chatEntry.style.opacity = '0';
        this.chatHistory.prepend(chatEntry);
        
        // Trigger reflow for animation
        chatEntry.offsetHeight;
        chatEntry.style.opacity = '1';
        chatEntry.style.animation = 'slideIn 0.3s ease-out forwards';
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    window.imageGenerator = new ImageGenerator();
});