# Iterate with AI (A Node-Based UI for AI)
This project is an interactive, AI-powered node-based user interface built with Svelte and Vite. It allows users to create, connect, and process nodes in a visual flow, with AI-assisted content generation.

![image](https://github.com/user-attachments/assets/b43a6a9a-ca80-4d4c-ba49-e97bba404d2f)

## Features
- Interactive node-based UI using [@xyflow/svelte](rag://rag_source_3)
- AI-powered content generation using OpenRouter API
- Dynamic node creation and connection
- Cycle detection and handling in node connections
- Save and load functionality for created flows
- Responsive design with custom controls
## Getting Started
### Prerequisites
- Node.js (version specified in your project)
- An OpenRouter API key
### Installation
1. Clone the repository
2. Install dependencies:
npm install

3. Create a `.env` file in the root directory and add your OpenRouter API key:
VITE_OPENROUTER_API_KEY=your_api_key_here

### Running the Application
To start the development server:
npm run dev

To build for production:
npm run build

To preview the production build:
npm run preview

## Usage
- Click on the canvas to create new nodes
- Connect nodes by dragging from one node's handle to another
- Use the big button (⚡️) to process the entire flow
- Save and load your flows using the panel at the bottom of the screen
## Technical Details
- Built with [Svelte](rag://rag_source_3) and [Vite](rag://rag_source_3)
- Uses [@xyflow/svelte](rag://rag_source_3) for the node-based UI
- Integrates with OpenRouter API for AI-powered content generation
- Implements custom cycle detection and handling for node connections
- Utilizes Svelte stores for state management
## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.
## License
This project is open-source. Please check the repository for license details.
