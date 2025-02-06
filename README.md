# AI-Powered Text & Audio to Image Generator 🎨✨

Transform your words and voice into stunning AI-generated images! This project uses AI to generate images from text descriptions or recorded speech.

## 🚀 Features
- 🎙️ **Voice-to-Image**: Convert your speech into AI-generated images.
- 📝 **Text-to-Image**: Enter a description and get an AI-generated image.
- 🏛️ **History Tracking**: View past generations with a clear history feature.
- 🔄 **Smooth Animations**: Engaging UI with modern animations.

## 📸 Preview
![App Screenshot](assets/images/screenshot.png)

![System Architecture](https://github.com/user-attachments/assets/92dead17-dd78-4f8d-9143-46f559f0e7c6)



## 📦 Tech Stack
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Python (Google Colab)
- **AI Model**: DALL·E / Custom Model
- **Libraries Used**:
  - [lamejs](https://github.com/zhuker/lamejs) (MP3 Encoding)
  - Font Awesome (Icons)

## 🛠 Setup Instructions
### Step 1: Run the Backend (Google Colab)
1. Open [Google Colab](https://colab.research.google.com/).
2. Enable the backend and run the necessary scripts.
3. Generate an Ngrok URL.

### Step 2: Configure the Frontend
1. Copy the Ngrok URL.
2. Open `assets/js/script.js`.
3. Replace `API_URL` with the generated Ngrok URL.

```javascript
const API_URL = 'https://your-ngrok-url.ngrok-free.app/';
```

4. Save the file.

### Step 3: Run the Application
1. Open `index.html` in your browser.
2. Start generating images from text or voice!

## 🎨 UI Components
- **Glassmorphism Design** ✨
- **Hover & Click Effects** 🎭
- **Loading Spinners** 🔄
- **Typewriter Animation** ⌨️

## 🏆 Contribution
Feel free to fork the project and submit a PR!

## 📜 License
MIT License

---

Made with ❤️ by **M.H. Jayasuriya**

