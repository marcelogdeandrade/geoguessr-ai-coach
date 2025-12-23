// Options page logic

const apiKeyInput = document.getElementById("apiKey");
const modelSelect = document.getElementById("modelSelect");
const saveBtn = document.getElementById("saveBtn");
const status = document.getElementById("status");
const toggleBtn = document.getElementById("toggleVisibility");

// Load saved settings
chrome.storage.sync.get(["geminiApiKey", "selectedModel"], (result) => {
  if (result.geminiApiKey) {
    apiKeyInput.value = result.geminiApiKey;
  }
  if (result.selectedModel) {
    modelSelect.value = result.selectedModel;
  }
});

// Toggle visibility
toggleBtn.addEventListener("click", () => {
  if (apiKeyInput.type === "password") {
    apiKeyInput.type = "text";
    toggleBtn.textContent = "Hide key";
  } else {
    apiKeyInput.type = "password";
    toggleBtn.textContent = "Show key";
  }
});

// Save settings
saveBtn.addEventListener("click", async () => {
  const apiKey = apiKeyInput.value.trim();
  const selectedModel = modelSelect.value;

  if (!apiKey) {
    showStatus("Please enter an API key", "error");
    return;
  }

  // Test the API key
  saveBtn.disabled = true;
  saveBtn.textContent = "Testing...";

  try {
    const isValid = await testApiKey(apiKey);
    if (isValid) {
      chrome.storage.sync.set({ geminiApiKey: apiKey, selectedModel: selectedModel }, () => {
        showStatus("Settings saved successfully!", "success");
      });
    } else {
      showStatus("Invalid API key. Please check and try again.", "error");
    }
  } catch (e) {
    showStatus(`Error: ${e.message}`, "error");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save";
  }
});

// Test API key with a simple request
async function testApiKey(apiKey) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Say 'ok'" }] }],
      }),
    }
  );
  return response.ok;
}

function showStatus(message, type) {
  status.textContent = message;
  status.className = `status ${type}`;
}
