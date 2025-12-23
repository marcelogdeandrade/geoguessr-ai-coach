// GeoGuessr AI Coach - Side Panel (using AI SDK)

import { generateObject, generateText, CoreMessage } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";

// Available models
const MODELS = {
  "gemini-2.5-flash": "gemini-2.5-flash",
  "gemini-2.5-pro": "gemini-2.5-pro",
  "gemini-3-flash-preview": "gemini-3-flash-preview",
};

// Schema for analysis response
const analysisSchema = z.object({
  country: z.string().describe("The most likely country"),
  region: z.string().optional().describe("Region if identifiable"),
  confidence: z.number().min(0).max(100).describe("Confidence percentage"),
  clues: z
    .array(
      z.object({
        type: z.string().describe("Type of clue: road, sign, vegetation, meta, etc."),
        description: z.string().describe("Description citing the specific meta rule"),
      })
    )
    .describe("Key clues identified"),
  alternatives: z
    .array(
      z.object({
        country: z.string(),
        confidence: z.number(),
      })
    )
    .describe("Alternative possibilities"),
  metaTip: z.string().describe("A specific META RULE to memorize"),
});

// System prompt with GeoGuessr meta knowledge
const SYSTEM_PROMPT = `You are an expert GeoGuessr analyst specializing in META CLUES - the specific technical patterns that identify countries.

LICENSE PLATE METAS:
- White front + yellow rear = UK, Cyprus, Gibraltar
- Yellow both plates = Netherlands, Luxembourg
- Blue EU strip on left = Europe (check country code)
- Long narrow plates = European, Wide short = American style

ROAD LINE METAS:
- WHITE center lines: UK, Ireland, Australia, NZ, Japan, Nordic, Asia
- YELLOW center lines: USA, Canada, Latin America, Germany, Switzerland
- RED edge lines: Iceland, Faroe Islands

BOLLARD/POST METAS:
- Orange-topped posts = Netherlands
- Red reflectors = Finland, Yellow = Sweden, White = Norway
- Green-backed signs = Ireland, Red-backed chevrons = UK

GOOGLE STREET VIEW METAS:
- Black/white bars at top = Kenya, Uganda, Senegal (African trekker)
- Rifts (vertical lines) = Russia, parts of South America

VEGETATION METAS:
- Eucalyptus = Australia, Portugal, South America
- Birch forests = Russia, Nordic
- Red soil = Brazil, Africa, Australia

DRIVING SIDE:
- LEFT: UK, Japan, Australia, NZ, India, South Africa, Thailand, Indonesia
- RIGHT: Most of the world

Always cite SPECIFIC meta rules, not generic observations.`;

// State
let isHidden = false;
let chatHistory: CoreMessage[] = [];
let currentImageBase64: string | null = null;
let lastAnalysis: z.infer<typeof analysisSchema> | null = null;

// Get settings from storage
async function getSettings(): Promise<{ apiKey: string | null; model: string }> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["geminiApiKey", "selectedModel"], (result) => {
      resolve({
        apiKey: result.geminiApiKey || null,
        model: result.selectedModel || "gemini-2.5-flash",
      });
    });
  });
}

// Analyze image using AI SDK
async function analyzeImage(apiKey: string, model: string, imageBase64: string) {
  const google = createGoogleGenerativeAI({ apiKey });

  const { object } = await generateObject({
    model: google(model),
    schema: analysisSchema,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Analyze this GeoGuessr screenshot and identify the location:" },
          {
            type: "image",
            image: imageBase64,
          },
        ],
      },
    ],
  });

  return object;
}

// DOM Elements
const analyzeBtn = document.getElementById("analyzeBtn");
const hideToggle = document.getElementById("hideToggle");
const settingsBtn = document.getElementById("settingsBtn");
const initialState = document.getElementById("initialState");
const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const resultState = document.getElementById("resultState");
const errorMessage = document.getElementById("errorMessage");
const statusBar = document.getElementById("statusBar");
const statusText = document.getElementById("statusText");
const statusSettingsLink = document.getElementById("statusSettingsLink");
const chatSection = document.getElementById("chatSection");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput") as HTMLInputElement | null;
const chatSendBtn = document.getElementById("chatSendBtn");

// Verify critical elements exist
if (!analyzeBtn || !hideToggle || !settingsBtn || !initialState ||
    !loadingState || !errorState || !resultState || !errorMessage || !statusBar || !statusText) {
  console.error("Critical DOM elements missing - some features may not work");
}

// State management
function showState(state: HTMLElement) {
  [initialState, loadingState, errorState, resultState].forEach((el) => {
    el?.classList.remove("active");
  });
  state.classList.add("active");
}

// Check API key and update UI
async function checkApiKey(): Promise<string | null> {
  const { apiKey } = await getSettings();

  if (apiKey) {
    statusBar?.classList.remove("error");
    return apiKey;
  } else {
    statusBar?.classList.add("error");
    if (statusText) {
      statusText.textContent = "API key not configured";
    }
    return null;
  }
}

// Toggle hide/show
function toggleHidden() {
  isHidden = !isHidden;
  hideToggle?.classList.toggle("active", isHidden);
  resultState?.classList.toggle("result-hidden", isHidden);
}

// Main analyze function
async function analyze() {
  const apiKey = await checkApiKey();

  if (!apiKey) {
    showError("Please set your API key in settings");
    return;
  }

  // Clear previous chat
  clearChat();

  if (analyzeBtn) {
    (analyzeBtn as HTMLButtonElement).disabled = true;
  }
  if (loadingState) {
    showState(loadingState);
  }

  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.url?.includes("geoguessr.com")) {
      throw new Error("Not on a GeoGuessr page");
    }

    if (tab.url.includes("/multiplayer")) {
      throw new Error("Disabled on multiplayer games");
    }

    // Capture screenshot
    const dataUrl = await chrome.tabs.captureVisibleTab(null as any, {
      format: "jpeg",
      quality: 85,
    });

    // Remove data URL prefix for AI SDK
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");

    // Get selected model from settings
    const { model } = await getSettings();

    // Analyze with AI SDK
    const analysis = await analyzeImage(apiKey, model, base64Data);
    showResult(analysis);
  } catch (error: any) {
    console.error("Analysis error:", error);
    showError(error.message || "Analysis failed");
  } finally {
    if (analyzeBtn) {
      (analyzeBtn as HTMLButtonElement).disabled = false;
    }
  }
}

// Show error
function showError(message: string) {
  if (errorMessage) {
    errorMessage.textContent = message;
  }
  if (errorState) {
    showState(errorState);
  }
}

// Show result
function showResult(analysis: z.infer<typeof analysisSchema>) {
  // Store analysis for chat context
  lastAnalysis = analysis;

  const countryEl = document.getElementById("countryName");
  if (countryEl) {
    countryEl.textContent = analysis.country;
  }

  const conf = analysis.confidence;
  const confEl = document.getElementById("confidence");
  if (confEl) {
    confEl.textContent = `${conf}%`;
    confEl.className = `confidence ${conf >= 70 ? "high" : conf >= 40 ? "medium" : "low"}`;
  }

  const regionEl = document.getElementById("region");
  if (regionEl) {
    regionEl.textContent = analysis.region || "";
  }

  const cluesEl = document.getElementById("clues");
  if (cluesEl) {
    cluesEl.innerHTML = analysis.clues
      .slice(0, 5)
      .map(
        (clue) => `
        <div class="clue">
          <span class="clue-type">${clue.type}</span>
          <span class="clue-desc">${clue.description}</span>
        </div>
      `
      )
      .join("");
  }

  const altEl = document.getElementById("alternatives");
  if (altEl) {
    altEl.textContent =
      analysis.alternatives.length > 0
        ? analysis.alternatives.map((a) => `${a.country} (${a.confidence}%)`).join(", ")
        : "None";
  }

  const tipEl = document.getElementById("tip");
  if (tipEl) {
    tipEl.textContent = analysis.metaTip;
  }

  // Apply hidden state if active
  resultState?.classList.toggle("result-hidden", isHidden);

  if (resultState) {
    showState(resultState);
  }

  // Show chat section
  chatSection?.classList.add("active");
}

// Simple markdown-like rendering
function renderText(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\n/g, '<br>');
}

// Add message to chat UI
function addChatMessage(content: string, role: "user" | "assistant", isLoading = false) {
  if (!chatMessages) return;

  const messageEl = document.createElement("div");
  messageEl.className = `chat-message ${role}${isLoading ? " loading" : ""}`;

  if (isLoading) {
    messageEl.textContent = content;
  } else {
    messageEl.innerHTML = renderText(content);
  }

  chatMessages.appendChild(messageEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  return messageEl;
}

// Send chat message
async function sendChatMessage() {
  if (!chatInput || !chatInput.value.trim()) return;

  const userMessage = chatInput.value.trim();
  chatInput.value = "";

  // Disable input while processing
  chatInput.disabled = true;
  if (chatSendBtn) {
    (chatSendBtn as HTMLButtonElement).disabled = true;
  }

  // Add user message to UI
  addChatMessage(userMessage, "user");

  // Add loading indicator
  const loadingEl = addChatMessage("Thinking...", "assistant", true);

  try {
    const apiKey = await checkApiKey();
    if (!apiKey) {
      throw new Error("API key not configured");
    }

    const { model } = await getSettings();
    const google = createGoogleGenerativeAI({ apiKey });

    // Build context with the analysis
    const contextMessage = lastAnalysis
      ? `Previous analysis of the GeoGuessr screenshot:\n- Country: ${lastAnalysis.country}\n- Region: ${lastAnalysis.region || "Unknown"}\n- Confidence: ${lastAnalysis.confidence}%\n- Clues: ${lastAnalysis.clues.map(c => `${c.type}: ${c.description}`).join("; ")}\n- Alternatives: ${lastAnalysis.alternatives.map(a => `${a.country} (${a.confidence}%)`).join(", ") || "None"}`
      : "";

    // Add to history
    chatHistory.push({
      role: "user",
      content: userMessage,
    });

    // Generate response
    const { text } = await generateText({
      model: google(model),
      system: `You are a GeoGuessr expert. Answer briefly (2-3 sentences max). Use bullet points for lists.\n\n${contextMessage}`,
      messages: chatHistory,
    });

    // Add assistant response to history
    chatHistory.push({
      role: "assistant",
      content: text,
    });

    // Update UI
    if (loadingEl) {
      loadingEl.innerHTML = renderText(text);
      loadingEl.classList.remove("loading");
    }
  } catch (error: any) {
    console.error("Chat error:", error);
    if (loadingEl) {
      loadingEl.textContent = `Error: ${error.message || "Failed to get response"}`;
      loadingEl.classList.remove("loading");
    }
  } finally {
    // Re-enable input
    if (chatInput) {
      chatInput.disabled = false;
      chatInput.focus();
    }
    if (chatSendBtn) {
      (chatSendBtn as HTMLButtonElement).disabled = false;
    }
  }
}

// Clear chat history
function clearChat() {
  chatHistory = [];
  if (chatMessages) {
    chatMessages.innerHTML = "";
  }
  chatSection?.classList.remove("active");
}

// Event listeners
settingsBtn?.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

statusSettingsLink?.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

hideToggle?.addEventListener("click", toggleHidden);

analyzeBtn?.addEventListener("click", analyze);

// Chat event listeners
chatSendBtn?.addEventListener("click", sendChatMessage);

chatInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendChatMessage();
  }
});

// Check if on multiplayer page
async function checkMultiplayer() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url?.includes("/multiplayer")) {
      showMultiplayerDisabled();
      return true;
    }
  } catch (e) {
    // Ignore errors
  }
  return false;
}

// Show disabled state for multiplayer
function showMultiplayerDisabled() {
  if (analyzeBtn) {
    (analyzeBtn as HTMLButtonElement).disabled = true;
  }
  if (initialState) {
    const hint = initialState.querySelector(".initial-hint");
    if (hint) {
      hint.innerHTML = `
        <svg class="globe-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="4" y1="4" x2="20" y2="20"></line>
        </svg>
        <p>Disabled on multiplayer games</p>
      `;
    }
  }
}

// Listen for tab URL changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    if (changeInfo.url.includes("/multiplayer")) {
      showMultiplayerDisabled();
    } else if (changeInfo.url.includes("geoguessr.com")) {
      // Re-enable if navigating away from multiplayer
      if (analyzeBtn) {
        (analyzeBtn as HTMLButtonElement).disabled = false;
      }
      if (initialState) {
        const hint = initialState.querySelector(".initial-hint");
        if (hint) {
          hint.innerHTML = `
            <svg class="globe-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <p>Analyze the current GeoGuessr view</p>
          `;
        }
      }
    }
  }
});

// Listen for storage changes (e.g., when API key is set in options)
chrome.storage.onChanged.addListener((changes) => {
  if (changes.geminiApiKey) {
    checkApiKey();
  }
});

// Initialize
checkApiKey();
checkMultiplayer();
