<template>
    <transition name="fade">
      <div v-if="!isFooterHidden">
        <div class="back-to-top">
          <button @click="scrollToTop" aria-label="Scroll to top">
            <div class="background"></div>
            <div class="arrow"></div>
          </button>
        </div>
      </div>
    </transition>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  pageData: {
    type: Object,
    required: false,
    default: null
  }
})
const isFooterHidden = ref(false)

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Watch for page changes to update footer visibility
watch(() => props.pageData, (newPage) => {
  isFooterHidden.value = newPage?.hideFooter || false
}, { immediate: true })
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}

.back-to-top {
  display: block;
  z-index: 100;
}
.back-to-top button {
  min-width: calc(var(--arrow-height) + 4px);
  min-height: calc(var(--arrow-height) + 4px);
  padding:var(--pad-1) !important;
  position:relative;
  padding: 0px !important;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  transition: transform 0.6s ease;
}
.back-to-top button .background {
  position:absolute;
  top:0;
  left:0;
  width:100%;
  height:100%;
  background-color: currentColor;
  border-radius: 50%;
  transition: opacity 0.6s ease;
  opacity: 0;
}
.back-to-top button:hover {
  transform: translateY(-4px);
}
.back-to-top button:hover .background {
  opacity: 0;
}
.back-to-top button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  color: inherit;
}

@media (max-width: 768px) {
  .back-to-top {
    bottom: var(--pad-1);
    right: var(--pad-1);
  }
}
</style> 