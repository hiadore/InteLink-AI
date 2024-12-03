const toneName = document.getElementById("tone-name");
const tonePrompt = document.getElementById("tone-prompt");
const addToneButton = document.getElementById("add-tone");
const toneList = document.getElementById("tone-list");
const saveToneButton = document.getElementById("save-tone");
const cancelEditButton = document.getElementById("cancel-edit");
const toneEditor = document.getElementById("tone-editor");
const editorTitle = document.getElementById("editor-title");

let editingTone = null; // Track tone being edited

// Select modal elements
const deleteModal = document.getElementById("delete-confirmation-modal");
const confirmDeleteButton = document.getElementById("confirm-delete");
const cancelDeleteButton = document.getElementById("cancel-delete");

let toneToDelete = null; // Temporarily store the tone to be deleted
let divToDelete = null; // Temporarily store the UI element to be removed

// Load existing tones on page load and initialize buttons
chrome.storage.sync.get("buttons", (data) => {
    let buttons = data.buttons;
    buttons.forEach(addToneToUI);
});

// Show the editor for adding a new tone
addToneButton.addEventListener("click", () => {
    showEditor();
});

// Save tone to storage and update UI
saveToneButton.addEventListener("click", () => {
    const name = toneName.value.trim();
    const prompt = tonePrompt.value.trim();

    if (!name || !prompt) {
        alert("Please fill out all fields!");
        return;
    }

    const newTone = { name, prompt };

    chrome.storage.sync.get("buttons", (data) => {
        let tones = data.buttons || [];

        if (editingTone) {
            // Update existing tone
            tones = tones.map((tone) =>
                tone.name === editingTone.name ? newTone : tone
            );
        } else {
            // Add new tone
            tones.push(newTone);
        }

        chrome.storage.sync.set({ buttons: tones }, () => {
            // Notify content.js that tones have been updated
            chrome.runtime.sendMessage({ type: "update-buttons", tones });

            if (editingTone) {
                updateToneInUI(editingTone, newTone);
            } else {
                addToneToUI(newTone);
            }


            hideEditor();
            toneName.value = "";
            tonePrompt.value = "";
            editingTone = null;
        });
    });
});

// Cancel editing/adding tone
cancelEditButton.addEventListener("click", () => {
    hideEditor();
    toneName.value = "";
    tonePrompt.value = "";
    editingTone = null;
});

// Add a tone to the UI
function addToneToUI(tone) {
    const div = document.createElement("div");
    div.classList.add("tone-item");

    const toneLabel = document.createElement("strong");
    toneLabel.textContent = tone.name;

    const toneActions = document.createElement("div");

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.classList.add("edit-tone");
    editBtn.addEventListener("click", () => editTone(tone, div));

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.classList.add("delete-tone");
    deleteBtn.addEventListener("click", () => deleteTone(tone, div));

    toneActions.appendChild(editBtn);
    toneActions.appendChild(deleteBtn);

    div.appendChild(toneLabel);
    div.appendChild(toneActions);

    toneList.appendChild(div);
}

// Edit a tone
function editTone(tone, div) {
    showEditor("Edit Tone");
    toneName.value = tone.name;
    tonePrompt.value = tone.prompt;
    editingTone = tone;
}

function deleteTone(tone, div) {
    // Store tone and div globally
    toneToDelete = tone;
    divToDelete = div;

    // Show the modal
    deleteModal.style.display = "flex";
}

// Handle confirmation of delete action
confirmDeleteButton.addEventListener("click", () => {
    if (!toneToDelete || !divToDelete) return;

    chrome.storage.sync.get("buttons", (data) => {
        const tones = data.buttons.filter((t) => t.name !== toneToDelete.name);
        chrome.storage.sync.set({ buttons: tones }, () => {
            toneList.removeChild(divToDelete);

            // Notify content.js to refresh the comment boxes
            chrome.runtime.sendMessage({ type: "update-buttons" });

            // Reset temporary variables and hide modal
            toneToDelete = null;
            divToDelete = null;
            deleteModal.style.display = "none";
        });
    });
});

// Handle cancellation of delete action
cancelDeleteButton.addEventListener("click", () => {
    // Reset temporary variables and hide modal
    toneToDelete = null;
    divToDelete = null;
    deleteModal.style.display = "none";
});

// Update a tone in the UI after editing
function updateToneInUI(oldTone, newTone) {
    const toneItems = toneList.querySelectorAll(".tone-item");
    toneItems.forEach((item) => {
        if (item.querySelector("strong").textContent === oldTone.name) {
            item.querySelector("strong").textContent = newTone.name;
        }
    });
}

// Show the editor
function showEditor(title = "Add New Tone") {
    editorTitle.textContent = title;
    toneEditor.style.display = "block";
    toneList.style.display = "none";
    addToneButton.style.display = "none";
}

// Hide the editor
function hideEditor() {
    toneEditor.style.display = "none";
    toneList.style.display = "block";
    addToneButton.style.display = "block";
}
