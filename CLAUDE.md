# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Architecture

**Iterate with AI** is a node-based visual interface for AI content generation built with Svelte and SvelteFlow. Users create interactive workflows by connecting nodes on a canvas.

### Key Components

- **`/src/App.svelte`** (1,362 lines) - Main application logic, contains most core functionality
- **`/src/SvelteFlowWrapper.svelte`** - Provides SvelteFlow context to the application
- **`/src/stores.ts`** - Global state management using Svelte stores
- **`/src/api.ts`** - Frontend API for OpenRouter integration and streaming
- **`/api/llm.js`** - Express.js backend API endpoint (fallback when no user API key)

### Node Types

- **TextNode** - Input nodes for prompts and text content
- **ResultNode** - Output nodes displaying AI-generated responses  
- **ListNode** - Specialized nodes for list-based inputs that can generate variations

### Core Architecture Patterns

1. **Node-Based Flow Processing**
   - Uses `@xyflow/svelte` for visual node interface
   - Supports node referencing via `{NodeLabel}` syntax in prompts
   - Implements cycle detection and iterative processing
   - Handles complex node graphs with dependency resolution

2. **Streaming AI Integration**
   - Real-time streaming responses from OpenRouter API
   - Support for multiple AI models with parallel processing
   - Cost tracking and generation ID management
   - Graceful error handling and stop functionality

3. **State Management via Svelte Stores**
   - `selectedModel` - Current primary AI model
   - `secondaryModels` - Additional models for parallel processing
   - `isProcessing` - Global processing state
   - `userApiKey` - User's OpenRouter API key
   - Cost tracking stores (`latestCost`, `cumulativeCost`)

### Key Functions

- **`runConnectedNodes()`** in App.svelte - Main processing logic for node execution
- **`resolveReferences()`** - Resolves `{NodeLabel}` references in prompts
- **`detectCycles()`** - Cycle detection in node graphs
- **`processListExpansion()`** - Handles list node variations

### Environment Setup

Requires OpenRouter API key in `.env`:
```
VITE_OPENROUTER_API_KEY=your_api_key_here
```

### Data Persistence

- Canvas states saved to localStorage
- Import/export functionality for sharing workflows  
- Default template canvases in `/src/defaultCanvases.ts`

### Important Notes

- No testing framework or linting configuration present
- Main logic concentrated in App.svelte - consider this when making structural changes
- Backend API (`/api/llm.js`) serves as fallback when user doesn't provide API key
- Supports mobile/touch interfaces with responsive design
- Complex node processing supports sequential, parallel, and iterative execution modes