<template>
  <div class="not-found-404">
    <div class="not-found-404-content grid grid-1 gap-2" data-fade-in>
      <h1 class="not-found-404-title h1">404 - Page not found</h1>
      <div>
        <NuxtLink to="/" class="button">
            Return home
        </NuxtLink>
        </div>
    </div>
  </div>
</template>

<script setup>
// No props needed - this is a standalone 404 component
</script>

<style scoped>
.not-found-404 {
  position: relative;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  min-height: 100vh;
  background-color: rgb(var(--white));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  margin-top: 0;
  text-align: center;
}

</style>

