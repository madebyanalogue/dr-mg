<template>
  <div :class="['page-builder', { 'pbottom': removeTopPadding }]">
    <template v-for="(section, index) in sections" :key="section._id || index">
      <SectionBasicPage
        v-if="section._type === 'section' && section.sectionType === 'basicPage'"
        :section="section"
      />

      <!-- Title and Text Section -->
      <SectionTitleAndText
        v-else-if="section._type === 'section' && section.sectionType === 'titleAndText'"
        :section="section"
      />

      <!-- Two Columns Section -->
      <SectionTwoColumns
        v-else-if="section._type === 'section' && section.sectionType === 'twoColumns'"
        :section="section"
      />

      <!-- Blocks Section -->
      <SectionBlocks
        v-else-if="section._type === 'section' && section.sectionType === 'blocks'"
        :section="section"
      />

      <!-- Fallback for unknown section types -->
      <div v-else class="wrapper py6">
        <div class="grid">
          <div class="col-span-12">
            <p class="error">Unknown section type: {{ section._type }} - {{ section.sectionType }}</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, watch, onMounted, onUnmounted } from 'vue'
import { usePageSettings } from '~/composables/usePageSettings'
import SectionBasicPage from '~/components/SectionBasicPage.vue'
import SectionTitleAndText from '~/components/SectionTitleAndText.vue'
import SectionTwoColumns from '~/components/SectionTwoColumns.vue'
import SectionBlocks from '~/components/SectionBlocks.vue'

const props = defineProps({
  sections: {
    type: Array,
    required: true,
    validator: (value) => {
      return value.every(section => 
        section && 
        typeof section === 'object' && 
        section._type === 'section' && 
        typeof section.sectionType === 'string'
      )
    }
  },
  pageData: {
    type: Object,
    required: false,
    default: null
  }
})

// Get page settings for removeTopPadding - only if pageData prop is not provided
const pageSettings = computed(() => {
  if (!props.pageData) {
    return usePageSettings()
  }
  return null
})

// Use page data prop if available, otherwise fall back to composable
const removeTopPadding = computed(() => {
  if (props.pageData && props.pageData.removeTopPadding !== undefined) {
    return props.pageData.removeTopPadding
  }
  return pageSettings.value?.useRemoveTopPadding?.value || false
})

// Grey background setting
const greyBackground = computed(() => {
  return props.pageData?.greyBackground || false
})

// Apply grey background to body when component mounts
onMounted(() => {
  if (greyBackground.value) {
    document.body.style.setProperty('--initial-bg-light', 'var(--grey)')
  } else {
    document.body.style.removeProperty('--initial-bg-light')
  }
})

// Watch for changes in grey background setting
watch(greyBackground, (newValue) => {
  if (newValue) {
    document.body.style.setProperty('--initial-bg-light', 'var(--grey)')
  } else {
    document.body.style.removeProperty('--initial-bg-light')
  }
})

// Clean up on unmount
onUnmounted(() => {
  document.body.style.removeProperty('--initial-bg-light')
})


</script>

<style scoped>
.page-builder {
  width: 100%;
}

.error {
  color: red;
  padding: var(--unit);
  border: 1px solid red;
  border-radius: 4px;
}
</style> 