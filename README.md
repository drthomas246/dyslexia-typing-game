# English learning app for students with ADHD and dyslexia

## Overview

- A typing game that allows you to practice quickly and accurately typing English words and phrases.
- Includes Japanese translation hints, suitable for beginners to advanced learners.
- In learning mode, both Japanese and English hints are displayed when questions are asked.
- Questions are read aloud automatically, allowing you to use the game for listening practice as well.

## Main Features

- **Random Questions**: Questions are randomly selected from a registered list.
- **Learning Mode**: Japanese translations and English words are displayed simultaneously from the start.
- **Voice Synthesis**: Automatic voice synthesis using the Web Speech API.
- **Score Tracking**: Measures the number of correct answers, mistakes, and elapsed time.
- **Responsive Design**: Play comfortably on PCs and tablets.
- **Can be used from elementary school middle grades** Only kanji learned up to the third grade of elementary school are used.

## System Requirements

- **Browser**: Google Chrome latest version recommended (Speech Synthesis API compatible browser)
- **Node.js**: v18 or higher (for local development)
- **OS**: Windows / macOS / Linux / chromebook

## Installation Method

```bash
# Clone the repository
git clone https://github.com/drthomas246/dyslexia-typing-game.git
cd dyslexia-typing-game
# Install dependencies
npm install
# Start the development server
npm run dev
```

## Usage

1. Click the “Start” button on the screen.
2. Type the given word using the keyboard.
3. If you answer correctly, you will proceed to the next question.
4. If you enable learning mode, the Japanese translation and English will be displayed from the beginning.
5. The given word will be read aloud automatically (supported browsers only)

## Settings

- Create a file with questions and translations based on `src/lib/texts/qa_test.ts`.
- Import the file you created above into App.tsx and place the button.
- Change audio settings (language code, speed, voice quality) using the `useSpeech` hook.
- UI themes and colors can be changed in `src/styles`.

## For Developers

- Implemented using React + TypeScript.
- State management uses React Hooks.
- Uses `SpeechSynthesisUtterance` for voice playback.

## License

Copyright (c) 2025 Yamahara Yoshihiro
This software is provided for personal, non-commercial use only.
Redistribution or modification without permission is prohibited.

The images in this app here are courtesy of [いらすとや](https://www.irasutoya.com/).
The monster and background images used here were created using [Gemini](https://gemini.google.com/).

---

### Summary

- Features: Random questions, learning mode, voice synthesis, score calculation
- Technology: React + TypeScript + Web Speech API
- Recommended environment: Latest version of Chrome / Node.js v18+
- Customization: Question list, voice settings, and theme colors can be changed
