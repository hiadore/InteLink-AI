
# InteLink AI

**InteLink AI** is a Chrome extension designed to help users create personalized LinkedIn comments, posts, and recommendations using AI. With the integration of the Writer API, users can effortlessly generate content with customizable tones to enhance engagement and optimize their LinkedIn presence.

[![YouTube](http://i.ytimg.com/vi/m-q07yfTpJw/hqdefault.jpg)](https://www.youtube.com/watch?v=m-q07yfTpJw)

## Features & Functionality

### Comment Generation
- **Pre-crafted Tones**: Choose from 4 pre-crafted tones for generating comments:
  - **Analyst**: Data-driven and logical.
  - **Supporter**: Emotion-driven with encouragement and understanding.
  - **Visionary**: Focuses on big-picture thinking and inspiration.
  - **Learner**: Engaging and focused on learning and asking questions.
- **Custom Tones**: If the pre-crafted tones don’t fit, users can create unlimited custom tones.

### Post Generation
Users can generate posts by typing their prompt.

### Recommendation Generation
A simplified form to auto-generate LinkedIn recommendations by filling in fields such as Name, Relationship/Role, Key Skills, Notable Achievements, and Personality Trait.

### APIs Used
- **Writer API**: The core API used for generating content with different tones and styles.
  
## Problem It Solves
InteLink AI addresses the problem of time-consuming and generic LinkedIn posts and comments. By automating the content creation process, users can enhance their LinkedIn engagement with personalized and professional content, saving time and ensuring a consistent, polished presence on the platform.

## Built With
- **Languages**: JavaScript (for Chrome extension development)
- **API**: Writer API
- **Platform**: Google Chrome
- **Extension Framework**: Chrome Extensions API

## Testing Instructions
### Prerequisites
- Ensure that Google Chrome is installed on your machine.
- Have an active LinkedIn account.

### Installation
1. Clone the repository to your local machine.
   ```bash
   git clone https://github.com/hiadore/inteLink-AI.git
2.  Open Google Chrome and go to `chrome://extensions/`.
3.  Enable **Developer mode** in the top-right corner.
4. Click on **Load unpacked** and select the extension folder.
5. The extension will now be loaded into Chrome.

### Usage
1. After installing the extension, you'll see the InteLink AI icon in your Chrome toolbar.
2.  **For Comment Generation**
    -   Click on **comment** input on LinkedIn post/article.
    -   The tone buttons will appear.
    -   Choose from the available pre-crafted tones or create a custom tone to generate your comment.
3.  **For Recommendation Generation**
    -   Go to the **Give Recommendation** page of the person you want to write a recommendation for on LinkedIn.
    -   Click the **"AI Assist"** button.
    -   The form will appear; fill in the required fields such as Name, Relationship/Role, Key Skills, Notable Achievements, and Personality Trait.
    -   The extension will generate the recommendation for you.
4.  **For Post Creation**
    - Simply enter your prompt in the extension, and the AI will generate a post based on the information you provide.

### Testing the Extension

1.  Navigate to LinkedIn in your browser.
2.  Use the extension to generate comments, posts, or recommendations.
3.  Ensure that the content generated is displayed correctly and meets your expectations before submit.

### Troubleshooting

-   If you encounter errors related to unsupported language or unreadable responses, these are due to temporary issues with the Chrome Built-in AI API, which may not be stable in certain situations. You can try regenerating the content to resolve this.


## What's Next

-   **Enhanced Customization**: Add more pre-crafted tones and advanced customization options for tone and style.
-   **Analytics Dashboard**: Provide insights into user engagement to measure the impact of generated content.
-   **Integration with Other APIs**: Incorporate additional AI APIs to expand functionality, such as Translation API for multi-language support and Rewrite API to polish translations or user-generated text.
-   **Extended LinkedIn Integration**: Add support for other areas on LinkedIn, including profile optimization, creating events, writing articles, and more.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
