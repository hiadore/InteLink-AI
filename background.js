// Listen for the extension being installed
chrome.runtime.onInstalled.addListener(() => {
    const initialButtons = [
      {
        name: "📊 Analyst",
        prompt:
          "Respond to the following LinkedIn post as a knowledgeable and analytical professional. Provide a concise comment that offers a fresh perspective grounded in data, trends, or technical insights. Avoid emotional language and focus on facts and logical reasoning to enrich the discussion. Keep it professional and under 50 words.",
      },
      {
        name: "❤️ Supporter",
        prompt:
          "Respond to the following LinkedIn post as a kind and empathetic professional. Craft a comment that shows understanding, acknowledges the effort or challenge mentioned, and offers encouragement or praise. Keep it warm, supportive, and under 50 words while maintaining a professional tone.",
      },
      {
        name: "🌟 Visionary",
        prompt:
          "Respond to the following LinkedIn post as a thought leader and visionary. Write a concise comment that reflects ambition, highlights opportunities for growth, and sparks inspiration for broader conversations. Use a confident and motivating tone while staying relevant to the post. Limit to 50 words.",
      },
      {
        name: "🤔 Learner",
        prompt:
          "Respond to the following LinkedIn post as an eager and curious professional. Craft a comment that demonstrates interest in the topic, asks insightful follow-up questions, or seeks clarification to deepen understanding. Keep it engaging, inquisitive, and under 50 words.",
      },
    ];
  
    // Save to storage only if no buttons exist
    chrome.storage.sync.get("buttons", (data) => {
      if (!data.buttons) {
        chrome.storage.sync.set({ buttons: initialButtons });
        console.log("Default buttons initialized.");
      }
    });
  });
  

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
        // listen to the event
    if (request.type == "generate-comment") {
        await processGenerateCommentRequest(request);
    } else if (request.type == "open-dashboard") {
        // Open the dashboard.html page in a new tab
        chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
    } else if (request.type == "update-buttons") {
        // Notify all content scripts about the update
        chrome.tabs.query({ url: "*://www.linkedin.com/*" }, (tabs) => {
            tabs.forEach((tab) => {
                chrome.tabs.sendMessage(tab.id, { type: "update-buttons" });
            });
        });
    } else if (request.type == "generate-post") {
        // Ensure asynchronous response handling
        await handleGeneratePostContent(request);
        return true; // Inform Chrome that the response will be sent asynchronously
    } else if (request.type == "generate-recommendation") {
        // Ensure asynchronous response handling
        await handleGenerateRecommendation(request);
        return true; // Inform Chrome that the response will be sent asynchronously
    } else {
        console.log('unknown request type', request.type);
    }
});

async function processGenerateCommentRequest(request) {
    const post = request.text;
    const tone = request.prompt;

    const writer = await ai.writer.create({
        sharedContext: "This is for crafting comment on Linkedin, a professional networking platform where users share business insights, career updates, and industry-focused content."
    });
    
    const prompt = `Write a LinkedIn comment responding to the following post: ${post}`;

    let response = {
        type: "generate-comment-response",
        error: "something went wrong",
    };

    try {
        const results = await writer.write(prompt, { context: tone })

        response = {
            type: "generate-comment-response",
            parentForm: request.parentForm,
            comment: results
        }
    } catch (error) {
        console.log(`Generate comment error: ${error}`);
        response = {
            type: "generate-comment-response",
            error: error.toString(),
        };
    } finally {
        // send the event with response
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, response, function(response) {
                if (chrome.runtime.lastError) {
                    console.log("Error sending message:", chrome.runtime.lastError);
                } else {
                    console.log("Response:", response);
                }
            });
        });
    }
}

// Handle generate-post-content as an async function
async function handleGeneratePostContent(request) {
    let response = { type: "generate-post-response", error: "Something went wrong" }
    try {
        const writer = await ai.writer.create({
            sharedContext:
                "This is for crafting posts on LinkedIn, a professional networking platform where users share business insights, career updates, and industry-focused content.",
        });

        const generatedText = await writer.write(request.prompt);

        console.log("Generated text successfully:", generatedText);

        response = {
            type: "generate-post-response",
            targetSelector: request.targetSelector,
            post: generatedText
        };
    } catch (error) {
        console.log("Error generating post content:", error);
        response = {
            type: "generate-post-response",
            error: error.toString() || "Unknown error"
        };
    } finally {
        // send the event with response
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, response, function(response) {
                if (chrome.runtime.lastError) {
                    console.log("Error sending message:", chrome.runtime.lastError);
                } else {
                    console.log("Response:", response);
                }
            });
        });
    }
}

// Handle generate-post-content as an async function
async function handleGenerateRecommendation(request) {
    let response = { type: "generate-recommendation-response", error: "Something went wrong" }
    try {
        const writer = await ai.writer.create({
            sharedContext:
                "This is for giving recommendation on LinkedIn, a professional networking platform where users share business insights, career updates, and industry-focused content.",
        });

        prompt = `Write a LinkedIn recommendation for a colleague. Highlight their key strengths, achievements, and contributions to the team or project. Mention specific examples or scenarios that demonstrate their skills, professionalism, and character. Keep the tone professional, warm, and sincere. The recommendation should be concise yet impactful, organized in clear paragraphs, and suitable for LinkedIn.
Key Details:
Name of the Person: ${request.data.name}
Relationship/Role: ${request.data.relationship}
Key Skills: ${request.data.keySkills}
Notable Achievements: ${request.data.achievements}
Personality Traits: ${request.data.personalityTraits}`

        const generatedText = await writer.write(prompt);

        console.log("Generated text successfully:", generatedText);

        response = {
            type: "generate-recommendation-response",
            targetSelector: request.targetSelector,
            text: generatedText
        };
    } catch (error) {
        console.log("Error generating post content:", error);
        response = {
            type: "generate-recommendation-response",
            error: error.toString() || "Unknown error"
        };
    } finally {
        // send the event with response
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, response, function(response) {
                if (chrome.runtime.lastError) {
                    console.log("Error sending message:", chrome.runtime.lastError);
                } else {
                    console.log("Response:", response);
                }
            });
        });
    }
}