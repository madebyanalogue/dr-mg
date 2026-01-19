<template>
  <img
    v-if="imageUrl"
    :src="imageUrl"
    :alt="alt"
    class="section-test-image"
  />
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  section: {
    type: Object,
    required: true
  }
})

const imageUrl = computed(() => {
  return props.section?.testImageContent?.image?.asset?.url || null
})

const alt = computed(() => {
  return props.section?.testImageContent?.image?.alt || 'Test image'
})
</script>

<style scoped>
.section-test-image {
  width: 100%;
  height: auto;
  display: block;
}
</style>
