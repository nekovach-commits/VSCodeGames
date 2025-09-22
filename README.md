# TRS-80 Model 100 Retro Terminal

A web-based emulation of the iconic TRS-80 Model 100 portable computer display, featuring authentic blocky LCD graphics and keyboard input.

## 🖥️ Features

- **Authentic TRS-80 Model 100 LCD Display**
  - 40 characters × 10 lines display
  - 4×4 pixel blocks with 1 pixel gaps
  - Authentic LCD green color scheme
  - Complete background pixel matrix
  - Blinking block cursor

- **Responsive Design**
  - Automatic scaling for different screen sizes
  - High-DPI display support (perfect for e-readers like Kindle)
  - Maintains crisp pixel appearance at all scales
  - Real 1:1 pixel mapping option

- **Full Keyboard Support**
  - All letters A-Z and numbers 0-9
  - Special characters: `.,!?:;-_()[]+=*/\`
  - **ENTER**: New line
  - **TAB**: 4-space indent
  - **BACKSPACE**: Delete characters
    - **ESC**: Clear all text

## 🚀 Live Demo

[Try it live on GitHub Pages!](https://your-username.github.io/VSCodeGames/)

Perfect for testing on:
- Desktop browsers
- Mobile devices
- E-readers (Kindle Colorsoft, etc.)
- Tablets

## 🛠️ Technical Details

### Architecture
- **Modular Design**: Clean separation of concerns
- **display.js**: Canvas management and graphics rendering
- **font.js**: 5×7 pixel font system with authentic TRS-80 character set
- **input.js**: Keyboard handling and text management
- **main.js**: System controller coordinating all modules

### Display Specifications
- **Resolution**: 248×88 pixels (40×10 character grid)
- **Block Size**: 4×4 pixels with 1 pixel gaps
- **Character Matrix**: 5×7 pixels per character
- **Colors**: Authentic LCD green (`#c8d4b8` background, `#1a3d1a` text)

### Browser Compatibility
- Modern browsers with HTML5 Canvas support
- Optimized for crisp pixel rendering
- No external dependencies

## 📱 Perfect for E-Readers

This project was specifically designed to work great on e-readers like the Kindle Colorsoft:
- Automatic high-DPI scaling
- Optimized color contrast for e-ink displays
- Touch-friendly interface
- Lightweight and fast loading

## 🎮 Usage

1. Open `index.html` in any modern web browser
2. Click anywhere on the screen to focus
3. Start typing to see authentic blocky pixel text
4. Use keyboard shortcuts for navigation

### Developer Console Commands

The system exposes a global `TRS80` object for debugging and scripting:

```javascript
// Get system information
TRS80.getSystemInfo()

// Print text programmatically
TRS80.print("HELLO WORLD")
TRS80.println("NEW LINE")

// Clear screen
TRS80.clearScreen()

// Get/set current text
TRS80.getText()
TRS80.setText("CUSTOM TEXT")
```

## 🔧 Development

### Project Structure
```
VSCodeGames/
├── index.html          # Main HTML file
├── style.css          # TRS-80 Model 100 styling
├── README.md          # This file
└── js/
    ├── display.js     # Display and graphics engine
    ├── font.js        # Pixel font system
    ├── input.js       # Keyboard input handler
    └── main.js        # Main system controller
```

### Future Expansion Plans
The modular architecture makes it easy to add:
- MS BASIC 1.0 interpreter
- Graphics commands
- File system simulation
- Sound effects
- Additional character sets

## 📚 About the TRS-80 Model 100

The TRS-80 Model 100 was a pioneering portable computer released by Tandy in 1983. It featured:
- 8×40 character LCD display
- Built-in software including BASIC interpreter
- Exceptional battery life
- Full-size keyboard
- RS-232 and parallel ports

This web emulation captures the distinctive look and feel of the original's LCD display system.

## 🔄 Version History

- **v1.0**: Initial release with authentic LCD display and keyboard input
- Modular architecture ready for expansion
- Responsive design for modern devices

## 📄 License

This project is open source. Feel free to use, modify, and distribute.

---

*Relive the golden age of portable computing! 🖥️✨*

## Usage
1. Open `index.html` in your browser (or deploy to GitHub Pages).
2. The top half will fill with blocky graphics sized to your screen.
3. The bottom half is reserved for keyboard input or text.

## Customization
- Edit `main.js` to add your own character set, input handling, or graphics.
- Adjust block size/gap in `main.js` for different retro effects.

## GitHub Pages
- To deploy, push this folder to a GitHub repository and enable GitHub Pages in repository settings.

---

*Inspired by the TRS-80 Model 100 and classic retro computers.*
