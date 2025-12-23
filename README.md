# GeoGuessr AI Coach

An AI-powered Chrome extension that helps you learn GeoGuessr by analyzing screenshots and teaching you location identification techniques.

## What it does

- **Analyzes your current GeoGuessr view** using Google's Gemini AI
- **Identifies the country** with confidence level and reasoning
- **Explains the clues** - road markings, signs, vegetation, driving side, and other "meta" indicators
- **Suggests alternatives** when the location is ambiguous
- **Teaches you patterns** with memorable tips for future games
- **Answers follow-up questions** so you can learn more about what you're seeing

## Screenshots

The extension opens as a side panel in Chrome, so you can analyze while you play:

1. Click "Review Map" to capture and analyze the current view
2. See the predicted country with key clues
3. Ask follow-up questions to learn more

## Installation

### 1. Get a Gemini API Key (Free)

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click "Create API Key"
3. Copy your key

### 2. Install the Extension

```bash
# Clone the repo
git clone https://github.com/yourusername/geoguessr-ai-coach.git
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

1. Go to [GeoGuessr](https://www.geoguessr.com) and start a game
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
- **Multiplayer Safe**: Automatically disables on competitive multiplayer games

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
