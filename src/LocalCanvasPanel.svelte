<!-- LocalCanvasPanel.svelte -->
<script lang="ts">
  import { Info } from 'lucide-svelte';
  import { ChevronLeft, ChevronRight } from 'lucide-svelte';

  let isPaneVisible = true;
  let showToggle = false;
  let showInfoModal = false;

  function togglePane() {
    isPaneVisible = !isPaneVisible;
  }
</script>

<div class="panel" class:collapsed={!isPaneVisible}>
  <div 
    class="panel-edge"
    on:mouseenter={() => showToggle = true}
    on:mouseleave={() => showToggle = false}
    on:click={togglePane}
  >
    {#if showToggle}
      <div class="toggle-indicator">
        {#if isPaneVisible}
          <ChevronLeft size={16} />
        {:else}
          <ChevronRight size={16} />
        {/if}
      </div>
    {/if}
  </div>
  
  {#if isPaneVisible}
    <div class="main-title">
      Iterate with AI
      <button class="info-button" on:click={() => showInfoModal = true}>
        <Info size={18} />
      </button>
    </div>

    {#if showInfoModal}
      <div class="modal-overlay" on:click={() => showInfoModal = false}>
        <div class="modal-content" on:click|stopPropagation>
          <h2>👋 Hello there, fellow prompt engineer!</h2>

          <p>Welcome to <strong>Iterate with AI</strong> - where we've boldly moved beyond linear chat interfaces into the wild world of 2D! Because who said AI conversations had to be as one-dimensional as my programming skills? 😅</p>

          <h3>🤔 What's this all about?</h3>
          <p>Think of this as ChatGPT's cooler cousin who learned to think in graphs instead of straight lines. You can spread your ideas across the canvas.</p>

          <h3>🦙 Models & Privacy</h3>
          <p>Llama is free because, well, it's a bit cheaper! For fancier models, just plug in your OpenRouter API key. Everything stays between you and your device - I couldn't peek at your prompts even if I wanted to.</p>

          <h3>✨ Two Ways to Play</h3>
          <p><strong>The Classic Way:</strong> Click anywhere, type your prompt, drag to connect. But wait, there's more!</p>
          <ul>
            <li>
              <p>🔄 Multi-Model Magic: Run your prompt through different models simultaneously! Compare how GPT-4 and Claude handle the same task, or use Llama for drafts and polish with GPT-4. </p>
            </li>

            <li>
              <p>🎯 Node References: Use {'{Node Name}'} to reference any node's content in your prompts. Perfect for having multiple texts that you want to analyze interchangeably</p>
            </li>
          </ul>

          <button class="close-button" on:click={() => showInfoModal = false}>Got it!</button>
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .panel {
    position: absolute;
    left: 0;
    top: 0;
    height: 100dvh;
    max-height: calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
    width: 250px;
    background: #f8faff;
    border-right: 1px solid #ccc;
    display: flex;
    flex-direction: column;
    z-index: 5;
    transition: width 0.3s ease;
    font-size: 12px;
  }

  .panel.collapsed {
    width: auto;
  }

  .panel-edge {
    position: absolute;
    right: -6px;
    top: 0;
    bottom: 0;
    width: 6px;
    cursor: pointer;
    background: transparent;
    transition: all 0.2s ease;
  }

  .panel-edge:hover {
    background: rgba(0, 0, 0, 0.25);
  }

  .toggle-indicator {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    color: #666;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .panel-edge:hover .toggle-indicator {
    color: #fff;
  }

  .main-title {
    padding: 15px;
    font-size: 24px;
    font-weight: bold;
    border-bottom: 1px solid #eee;
    display: flex;
    align-items: center;
  }

  .info-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    color: #666;
    margin-left: auto;
    display: flex;
    align-items: center;
  }

  .info-button:hover {
    color: #333;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  }

  .modal-content {
    background: white;
    padding: 24px;
    border-radius: 8px;
    max-width: 600px;
    max-height: 85vh;
    overflow-y: auto;
    position: relative;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
  }

  .modal-content h2 {
    margin-top: 0;
    color: #333;
    font-size: 24px;
  }

  .modal-content h3 {
    margin-top: 20px;
    color: #444;
    font-size: 18px;
  }

  .modal-content p {
    color: #666;
    line-height: 1.5;
    margin: 12px 0;
  }

  .close-button {
    display: block;
    margin: 20px auto 0;
    padding: 8px 16px;
    background: #dde8ed;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.2s;
  }

  .close-button:hover {
    background: #c8d8e0;
  }
</style>