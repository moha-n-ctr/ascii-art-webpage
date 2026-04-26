# ASCII Camera Vision 📸

A high-performance, real-time web application that converts your live webcam feed into dynamic ASCII art. 

![ASCII Camera Preview](./public/preview.png) *(Note: Add a screenshot of your app here)*

## ✨ Features

- **Real-Time Processing**: Instantaneous webcam-to-ASCII conversion using optimized Canvas API manipulation.
- **Multiple Character Sets**: 
  - Simple Gradient (` .:-=+*#%@`)
  - Complex Detailed (` .'\`^\\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$`)
  - Binary (`01`)
  - ASCII Blocks (` ░▒▓█`)
- **Customizable Image Controls**:
  - **Font Size**: Change the resolution of the ASCII grid on the fly.
  - **Gain (Noise)**: Add stylized visual noise and brightness.
  - **Intensity**: Adjust the luminance power curve for sharper mapping.
  - **Contrast**: Deepen shadows and pop highlights.
- **Color Modes**:
  - **Matrix Green**: The classic terminal hacker look.
  - **Original Colors**: Retain your webcam's natural colors.
  - **Grayscale**: A classic monochromatic style.
- **Premium Glassmorphism UI**: A sleek, modern floating control panel.

## 🚀 Getting Started

This project is designed to be as accessible as possible. You can run it in two different ways depending on your needs.

### Option 1: The Quick Way (Standalone HTML)
You don't need Node.js, NPM, or any server to run this project.
1. Download or clone this repository.
2. Open the `index.html` file directly in any modern web browser (Chrome, Firefox, Safari, Edge).
3. Allow camera permissions when prompted.
4. Enjoy!

### Option 2: The Next.js Way (For Development)
If you wish to modify the React source code and build upon the Next.js framework:
1. Ensure you have [Node.js](https://nodejs.org/) installed.
2. Clone the repository and navigate to the project directory:
   ```bash
   git clone <your-repo-url>
   cd "ASCII art"
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛠️ Built With

- **Vanilla HTML/CSS/JS** (Standalone version)
- **React.js 19**
- **Next.js 16**
- **HTML5 Canvas API**
- **WebRTC (getUserMedia API)** for camera access

## 🔒 Privacy
This application runs **100% locally** in your browser. No video data, images, or personal information is ever recorded, saved, or sent to any server.

## 📄 License
This project is open-source and available under the MIT License. Feel free to fork, modify, and use it in your own projects!
