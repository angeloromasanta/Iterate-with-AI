<!-- SvelteFlowWrapper.svelte -->
<script>
  import { SvelteFlowProvider } from '@xyflow/svelte';
  import App from './App.svelte';  // Import your main App component
</script>

<SvelteFlowProvider>
  <App />
</SvelteFlowProvider>