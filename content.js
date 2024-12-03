document.addEventListener("focusin", function(event) {
    // the focused element is `event.target`
    if (event.target.classList.contains("ql-editor")) {
        commentBox = event.target.closest(".comments-comment-box--cr")
        if (commentBox && !commentBox.classList.contains("comments-comment-box--reply")) {

            const parentForm = event.target.closest(".comments-comment-texteditor");
        
            if (parentForm && !parentForm.classList.contains("buttons-appended")) {
                // add appended class to add buttons only on the first event trigger
                parentForm.classList.add("buttons-appended");

                // Load buttons from storage
                chrome.storage.sync.get("buttons", (data) => {
                    const buttons = data.buttons || [];
                    buttons.forEach((button) => {
                        const newButton = document.createElement("button");
                        newButton.classList.add("rounded-button");
                        newButton.innerText = `${button.name}`;

                        newButton.addEventListener("click", function (event) {
                            processButtonClicked(event, button.prompt, parentForm);
                    });

                    parentForm.appendChild(newButton);
                    });

                    let addButton = document.createElement("button");
                    addButton.classList.add("rounded-button");
                    addButton.innerText = "+";
                    addButton.title = "Create New Tone";

                    // Append the button to the parent form
                    parentForm.appendChild(addButton);

                    // Add event listener to open the dashboard
                    addButton.addEventListener("click", function () {
                        // Open the dashboard
                        chrome.runtime.sendMessage({ type: "open-dashboard" });
                    });
                });
            } else {
                console.log("No parent with the class 'comments-comment-texteditor' found for the focused element.");
            }
        } else {
            console.log("Not add post into sub comment")
        }
    }
});

let link = document.createElement("link");
link.setAttribute("rel", "stylesheet");
link.setAttribute("href", chrome.runtime.getURL("content.css"));
document.head.appendChild(link);

// global in content.js
let loading = false

function processButtonClicked(event, prompt, parentForm) {
    // check if we already loading the response
    if (loading) {
        console.log('already loading');

        return;
    }

    // disable all other buttons to avoid multiple comments creation simultaneously
    document.querySelectorAll(".rounded-button").forEach(function(button) {
        if (button.id !== "expertBtn") {
            button.setAttribute("disabled", true);
            button.classList.add("disabled");
        }
    });

    // add pulse animation to the clicked button
    event.currentTarget.classList.add("loading-animation");

    // extract full text of the parent post
    let parent = event.currentTarget.closest(".feed-shared-update-v2");
    let elements = parent?.getElementsByClassName("feed-shared-update-v2__description") || null;
    // check for article instead of post
    if (parent === null) {
        parent = event.currentTarget.closest(".scaffold-layout__content");
        elements = parent?.getElementsByClassName("reader-content-blocks-container") || null;
    }
    // check for post on popup image
    if (parent === null) {
        parent = event.currentTarget.closest(".feed-shared-update-detail-viewer__overflow-content");
        elements = parent?.getElementsByClassName("feed-shared-update-v2__description") || null;
    }

    let text = elements[0].innerText;
    const textWithoutSeeMore = text.replace(/…see more/g, "").replace("/..selengkapnya/g", "");

    // save current state of the app
    loading = true
    processButton = event.currentTarget
    processParent = parentForm

    // send the event
    chrome.runtime.sendMessage({
        type: "generate-comment",
        prompt: prompt,
        event: event,
        parentForm: parentForm,
        text: textWithoutSeeMore,
    });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type == "generate-comment-response") {
        // stop loading process and enable all buttons
        loading = false;
        processButton.classList.remove("loading-animation");

        document.querySelectorAll(".rounded-button").forEach(function(button) {
            button.removeAttribute("disabled");
            button.classList.remove("disabled");
        });

        if (request.error) {
            showErrorPopup(request.error);
            sendResponse({result: "Error", data: request.error});
            return;
        }

        emulateWriting(processParent, request.comment);
        sendResponse({ success: true, data: "Succesfully writing a comment" });
    } else if (request.type === "update-buttons") {
        chrome.storage.sync.get("buttons", (data) => {
            const buttons = data.buttons || [];
            updateButtons(buttons); // Call the dynamic button update function
        });
    } else if (request.type === "generate-post-response") {
        // Re-enable the textarea and button after response
        const promptTextarea = document.querySelector('.ai-prompt-textarea');
        const generateButton = document.querySelector(".ai-generate-button")

        promptTextarea.disabled = false;
        generateButton.disabled = false;
        generateButton.classList.remove('loading');
        generateButton.textContent = 'Generate';

        if (request.error) {
            console.log("Error generating post:", request.error);
            alert('Failed to generate content. Please try again.');
            return;
        }
        // Use the target selector to find and update the content
        const targetEditor = document.querySelector(request.targetSelector);
        if (targetEditor) {
            // targetEditor.innerHTML = request.post;
            emulateWritingPost(targetEditor, request.post, () => {
                console.log("Post content updated successfully.");
            })
        } else {
            console.error("Target editor not found:", request.targetSelector);
        }
    } else if (request.type === "generate-recommendation-response") {
        // Re-enable the textarea and button after response
        const recommendationForm = document.querySelector('#recommendationForm');
        const generateButton = document.querySelector("#generateRecommendationBtn")

        recommendationForm.disabled = false;
        generateButton.disabled = false;
        generateButton.classList.remove('loading');
        generateButton.textContent = 'Generate';

        if (request.error) {
            console.log("Error generating post:", request.error);
            alert('Failed to generate content. Please try again.');
            return;
        }
        // Use the target selector to find and update the content
        const targetEditor = document.querySelector(request.targetSelector);
        if (targetEditor) {
            targetEditor.value = request.text;
        } else {
            console.error("Target editor not found:", request.targetSelector);
        }
      }  else {
        console.log('unknown request type', request.type);
    }
});

function emulateWriting(parentElement, text) {
    let input = parentElement.querySelector(".ql-editor.ql-blank p");
    if (input === null) {
        input = parentElement.querySelector(".ql-editor p");
        input.innerText = "";
    }
    let i = 0;
    let interval = setInterval(() => {
        if (i < text.length) {
            input.innerText += text[i];
            i++;
            for (let j = 0; j < 10; j++) {
                if (i < text.length) {
                    input.innerText += text[i];
                    i++;
                }
            }
        } else {
            clearInterval(interval);
            // we need to remove `ql-blank` style from the section by LinkedIn div processing logic
            input.parentElement.classList.remove("ql-blank");
        }
    }, 10);
}

function emulateWritingPost(editor, text, callback) {
    const input = editor.querySelector(".ql-editor");
    if (!input) {
        console.error("Editor input not found!");
        return;
    }

    // Clear editor before typing
    input.innerHTML = ""; 

    const lines = text.split("\n"); // Split the text into lines for paragraphs
    let lineIndex = 0;
    let charIndex = 0;

    function typeCharacter() {
        if (lineIndex < lines.length) {
            const line = lines[lineIndex];
            let currentParagraph = input.children[lineIndex];

            // Create a new paragraph if it doesn't exist
            if (!currentParagraph) {
                currentParagraph = document.createElement("p");
                input.appendChild(currentParagraph);
            }

            // Type the character for the current line
            currentParagraph.innerText += line.charAt(charIndex);
            charIndex++;

            // Scroll to ensure the newly typed content is visible
            currentParagraph.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });

            // If the entire line is typed, move to the next line
            if (charIndex >= line.length) {
                charIndex = 0; // Reset character index
                lineIndex++; // Move to the next line
            }

            setTimeout(typeCharacter, Math.random() * 15 + 5); // Simulate human-like typing speed
        } else {
            // Ensure all lines are wrapped in <p> tags
            for (let i = lineIndex; i < lines.length; i++) {
                if (!input.children[i]) {
                    const emptyParagraph = document.createElement("p");
                    input.appendChild(emptyParagraph);
                }
            }

            if (callback) callback(); // Call the callback when done
        }
    }

    typeCharacter();
}

function updateButtons(buttons) {
    // Select all comment boxes
    const commentBoxes = document.querySelectorAll(".comments-comment-texteditor");

    // For each comment box, remove all existing buttons and refresh
    commentBoxes.forEach((parentForm) => {
        // Remove existing buttons
        const existingButtons = parentForm.querySelectorAll(".rounded-button");
        existingButtons.forEach((button) => button.remove());

        // Add updated buttons dynamically
        buttons.forEach((button) => {
            const newButton = document.createElement("button");
            newButton.classList.add("rounded-button");
            newButton.innerText = `${button.name}`;

            newButton.addEventListener("click", function (event) {
                processButtonClicked(event, button.prompt, parentForm);
            });

            parentForm.appendChild(newButton);
        });
    });
}

function showErrorPopup(errorMessage) {
    // Create the popup container
    const popup = document.createElement("div");
    popup.style.position = "fixed";
    popup.style.bottom = "20px"; // Position 20px above the bottom
    popup.style.left = "50%"; // Center horizontally
    popup.style.transform = "translateX(-50%)"; // Adjust for horizontal centering
    popup.style.zIndex = "9999";
    popup.style.backgroundColor = "#f8d7da";
    popup.style.color = "#721c24";
    popup.style.padding = "15px 20px";
    popup.style.border = "1px solid #f5c6cb";
    popup.style.borderRadius = "10px";
    popup.style.boxShadow = "0 4px 15px rgba(0,0,0,0.2)";
    popup.style.fontFamily = "Arial, sans-serif";
    popup.style.fontSize = "16px";
    popup.style.maxWidth = "400px";
    popup.style.textAlign = "center";
    popup.style.wordBreak = "break-word";

    // Add the error message
    popup.textContent = errorMessage;

    // Add a close button
    const closeButton = document.createElement("button");
    closeButton.textContent = "X";
    closeButton.style.position = "absolute";
    closeButton.style.top = "10px";
    closeButton.style.right = "15px";
    closeButton.style.background = "transparent";
    closeButton.style.border = "none";
    closeButton.style.fontSize = "16px";
    closeButton.style.cursor = "pointer";
    closeButton.style.color = "#721c24";

    closeButton.addEventListener("click", () => {
        document.body.removeChild(popup);
    });

    popup.appendChild(closeButton);
    document.body.appendChild(popup);

    // Automatically remove the popup after 5 seconds
    setTimeout(() => {
        if (popup.parentNode) {
            document.body.removeChild(popup);
        }
    }, 5000);
}

// Function to inject the UI into the post editor
function injectPostEditorUI() {
    const editorContainer = document.querySelector('.share-creation-state__text-editor .editor-content');
    
    if (!editorContainer) {
        console.log('Editor container not found.');
        return;
    }

    // Check if the AI prompt container is already present
    if (editorContainer.previousSibling && editorContainer.previousSibling.classList?.contains('ai-prompt-container')) {
        console.log('AI Prompt already injected.');
        return;
    }

    console.log('Injecting AI Prompt UI.');

    // Create the AI prompt container
    const aiPromptContainer = document.createElement('div');
    aiPromptContainer.classList.add('ai-prompt-container');

    // Add a resizable textarea for the AI prompt
    const promptTextarea = document.createElement('textarea');
    promptTextarea.placeholder = 'Write a LinkedIn post to celebrate a [personal milestone], such as [giving kudos, launching a project, a work anniversary, a job update, achieving a new certification, or reaching an educational milestone]. Keep the tone [humble yet engaging], and ensure the post is [concise and professional], ideally around 250 words. Highlight the milestone, share key takeaways, and express gratitude to specific individuals or teams, if applicable. Optionally, include a [call-to-action] to encourage interaction from your network. Feel free to include relevant [emojis and hashtags] for better engagement.';
    promptTextarea.classList.add('ai-prompt-textarea');

    // Automatically resize the textarea based on input
    promptTextarea.addEventListener('input', () => {
        promptTextarea.style.height = 'auto'; // Reset height
        promptTextarea.style.height = `${promptTextarea.scrollHeight}px`; // Adjust to content
    });

    // Add a button to generate content
    const generateButton = document.createElement('button');
    generateButton.textContent = 'Generate';
    generateButton.classList.add('ai-generate-button');

    // Append the textarea and button to the container
    aiPromptContainer.appendChild(promptTextarea);
    aiPromptContainer.appendChild(generateButton);

    // Insert the container above the editor
    editorContainer.insertAdjacentElement('beforebegin', aiPromptContainer);

    // Add click event for the Generate button
    generateButton.addEventListener('click', () => {
        const userPrompt = promptTextarea.value.trim();
        if (!userPrompt) {
            alert('Please enter a prompt.');
            return;
        }

        // Disable the textarea and button during loading
        promptTextarea.disabled = true;
        generateButton.disabled = true;
        generateButton.classList.add('loading');
        generateButton.textContent = 'Generating...';

        // Call AI generation logic
        const selector = '.editor-content'; // Unique selector for the target editor
        chrome.runtime.sendMessage(
            { type: 'generate-post', prompt: userPrompt, targetSelector: selector }
        );
    });
}

// Function to create the LinkedIn recommendation form
function createRecommendationForm() {
    // Initially, only show the 'Generate Recommendation with AI' button
    const buttonHtml = `
        <button id="generateRecommendationAI" 
                style="padding: 10px 20px; background-color: #0073b1; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
            🤖 AI Assist
        </button>
    `;

    // Append the button HTML to the container
    const container = document.querySelector('#multiline-text-form-component-profileEditFormElement-WRITE-RECOMMENDATION-recommendation-1-recommendationText-error');
    container.insertAdjacentHTML('beforebegin', buttonHtml);

    // Add an event listener for the button to show the form when clicked
    document.getElementById('generateRecommendationAI').addEventListener('click', () => {
        // Create the form HTML (hidden initially)
        const formHtml = `
            <div id="recommendationForm" style="padding: 20px; border: 1px solid #ccc; margin-top: 20px;">
                <h4>Complete the form below, and let 🤖 AI take care of the rest!</h4>
                <div>
                    <label for="recipientName">Name</label>
                    <input type="text" id="recipientName" placeholder="Enter the person's name" required>
                </div>
                <div>
                    <label for="relationship">Relationship/Role</label>
                    <input type="text" id="relationship" placeholder="e.g., Colleague, Manager, Team Member" required>
                </div>
                <div>
                    <label for="keySkills">Key Skills</label>
                    <input type="text" id="keySkills" placeholder="e.g., Leadership, Problem-solving" required>
                </div>
                <div>
                    <label for="achievements">Notable Achievements</label>
                    <textarea id="achievements" rows="3" placeholder="Insert notable achievements" required></textarea>
                </div>
                <div>
                    <label for="personalityTraits">Personality Traits</label>
                    <input type="text" id="personalityTraits" placeholder="e.g., Proactive, Empathetic" required>
                </div>
                <button id="generateRecommendationBtn" style="padding: 10px 20px; background-color: #0073b1; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin-top: 16px">
                        Generate
                    </button>
            </div>
        `;

        // Insert the form HTML below the button
        container.insertAdjacentHTML('beforebegin', formHtml);

        // Hide the original button after form appears
        document.getElementById('generateRecommendationAI').style.display = 'none';

        // // Add functionality for the "Generate Recommendation" button (e.g., generating AI recommendation)
        document.getElementById('generateRecommendationBtn').addEventListener('click', generateRecommendation);
    });
  }
  
  // Function to generate the recommendation text
  function generateRecommendation() {
    const recipientName = document.getElementById('recipientName').value;
    const relationship = document.getElementById('relationship').value;
    const keySkills = document.getElementById('keySkills').value;
    const achievements = document.getElementById('achievements').value;
    const personalityTraits = document.getElementById('personalityTraits').value;

    // Disable form and button during loading
    const recommendationForm = document.querySelector('#recommendationForm');
    const generateButton = document.querySelector("#generateRecommendationBtn")

    recommendationForm.disabled = true;
    generateButton.disabled = true;
    generateButton.classList.add('loading');
    generateButton.textContent = 'Generating...';
  
    const selector = ".artdeco-text-input__textarea"
    chrome.runtime.sendMessage(
        {
            type: "generate-recommendation",
            data: {
                name: recipientName,
                relationship: relationship,
                keySkills: keySkills,
                achievements: achievements,
                personalityTraits: personalityTraits
            },
            targetSelector: selector
        }
    );
  
  }

// Observer to detect when the post editor is added to the DOM
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.querySelector('.share-creation-state__text-editor .editor-content')) {
                injectPostEditorUI();
            } else if (node.nodeType === 1 && node.querySelector("#multiline-text-form-component-profileEditFormElement-WRITE-RECOMMENDATION-recommendation-1-recommendationText")) {
                // Check if the recommendation form already exists
                if (!document.getElementById('generateRecommendationAI')) {
                    createRecommendationForm(); // Only create the form if it doesn't exist
                }
            }
        });
    });
});

// Start observing the body for changes
observer.observe(document.body, { childList: true, subtree: true });
