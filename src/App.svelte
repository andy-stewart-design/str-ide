<script lang="ts">
  let count = $state(0)
</script>

<div id="navbar"></div>
<div class="tabs">
  <button onclick={() => count++}>Count: {count}</button>
</div>

<style>
    .tabs {
        display: flex;
        justify-content: center;
        align-items: center;
    }
</style>
