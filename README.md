# Iterate with AI (A Node-Based UI for AI)
This project is an interactive, node-based user interface for AI built with Svelte Flow. It allows users to create, connect, and process nodes in a visual flow, with AI-assisted content generation.

![image](https://github.com/user-attachments/assets/b43a6a9a-ca80-4d4c-ba49-e97bba404d2f)

## Features
- Interactive node-based UI using [@xyflow/svelte](rag://rag_source_3)
- Generate content by connecting your OpenRouter API
- Cycle detection and handling in node connections
- Save and load functionality for created flows
  
## Getting Started
### Prerequisites
- An OpenRouter API key
### Installation
1. Clone the repository
2. Install dependencies:
npm install

3. Create a `.env` file in the root directory and add your OpenRouter API key:
VITE_OPENROUTER_API_KEY=your_api_key_here


## Usage
- Click on the canvas to create new nodes
- Connect nodes by dragging from one node's handle to another
- Use the big button (⚡️) to process the entire flow
- Save and load your flows using the panel at the bottom of the screen
- 

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
This project is open-source. Please check the repository for license details.
