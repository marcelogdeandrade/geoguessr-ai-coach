# GeoGuessr AI Coach

An AI-powered Chrome extension that helps you learn GeoGuessr by analyzing screenshots and teaching you location identification techniques.

<img width="1914" height="965" alt="image" src="https://github.com/user-attachments/assets/b7f92cbd-b1dd-4d68-b65b-b5b57027230a" />

---

## DISCLAIMER

**THIS TOOL IS FOR EDUCATIONAL USE ONLY.**

This extension is designed to help you learn location identification patterns in single-player practice sessions. Using it to gain an unfair advantage in competitive play violates the [GeoGuessr Terms of Service](https://www.geoguessr.com/terms) and may result in your account being banned.

Per GeoGuessr's Community Rules, the following is considered cheating:
- Using third-party software to gain an unfair advantage over other players
- Using external sources of information as assistance during competitive play

**The author of this tool accepts no responsibility for any consequences resulting from its misuse.**

**Recommended usage:** Review locations AFTER making your guess to understand what clues you missed, or use on practice maps to learn identification patterns.

---

## What it does

- **Analyzes your current GeoGuessr view** using Google's Gemini AI
- **Identifies the country** with confidence level and reasoning
- **Explains the clues** - road markings, signs, vegetation, driving side, and other "meta" indicators
- **Suggests alternatives** when the location is ambiguous
- **Teaches you patterns** with memorable tips for future games
- **Answers follow-up questions** so you can learn more about what you're seeing

## Installation

### 1. Get a Gemini API Key (Free)

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click "Create API Key"
3. Copy your key

### 2. Install the Extension

#### Option A: Download a Release (Recommended)

1. Go to the [Releases page](https://github.com/marcelogdeandrade/geoguessr-ai-coach/releases)
2. Download the latest `geoguessr-ai-coach-vX.X.X.zip`
3. Extract the zip file to a folder

#### Option B: Build from Source

```bash
# Clone the repo
git clone https://github.com/marcelogdeandrade/geoguessr-ai-coach.git
cd geoguessr-ai-coach

# Install dependencies
bun install

# Build
bun run build
```

### 3. Load in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `geoguessr-ai-coach` folder

### 4. Configure

1. Click the extension icon in Chrome
2. Click the gear icon (Settings)
3. Paste your Gemini API key
4. Click Save

## Usage

1. Go to [GeoGuessr](https://www.geoguessr.com) and start a practice game
2. Click the extension icon to open the side panel
3. Click **Review Map** to analyze the current view
4. Read the analysis and learn from the clues
5. Ask follow-up questions like:
   - "What other clues should I look for?"
   - "How do I tell this apart from Sweden?"
   - "What does the road marking mean?"

### Features

- **Hide Answer**: Click the eye icon to blur the result until you're ready
- **Model Selection**: Choose between Gemini models in Settings
- **Multiplayer Disabled**: Automatically disables on multiplayer games

## Development

```bash
# Watch mode (auto-rebuild on changes)
bun run watch

# Single build
bun run build
```

After making changes, go to `chrome://extensions` and click the refresh icon on the extension.

## How it Works

The extension captures a screenshot of your current tab and sends it to Google's Gemini AI with a specialized prompt that focuses on GeoGuessr "meta" clues:

- License plate colors and formats
- Road line colors (white vs yellow center lines)
- Bollard and road sign styles
- Google Street View camera artifacts
- Vegetation and landscape patterns
- Driving side indicators

The AI returns structured data including the predicted country, confidence level, specific clues found, alternative possibilities, and a learning tip.

## Tech Stack

- Chrome Extension (Manifest V3)
- TypeScript + [Bun](https://bun.sh)
- [Vercel AI SDK](https://sdk.vercel.ai) with Google Gemini
- Side Panel API

## Privacy

- Your API key is stored locally in Chrome's sync storage
- Screenshots are sent directly to Google's Gemini API
- No data is collected or stored by this extension

## License

MIT
