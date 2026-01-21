<template>
  <section 
    ref="sectionRef"
    :id="sectionId"
    :class="[
      'section-title-and-text',
      {
        'section-padding-top': !section.noPaddingTop,
        'section-padding-bottom': !section.noPaddingBottom,
        'section-padding-top-mobile': !section.paddingTopMobile,
        'section-padding-bottom-mobile': !section.paddingBottomMobile
      }
    ]"
    :data-section-id="section._id"
  >
    <div class="wrapper">
      <div class="">
        <div class="grid gap-3 gap-4-md">
          <!-- Title in columns 1-4 -->
          <div class="col-span-3 col-span-4-md" data-fade-in>
            <h4 class="body h2-md uppercase">{{ section.titleAndTextContent?.title }}</h4>
          </div>

          <!-- Text and Buttons in columns 5-12 -->
          <div class="col-span-9 col-span-8-md grid grid-1 gap-4">
            <!-- Buttons above text if enabled -->
            <div 
              v-if="section.titleAndTextContent?.buttonsAboveText && buttons.length > 0" 
              class="buttons-wrapper"
              data-fade-in
            >
              <template v-for="(button, index) in buttons" :key="index">
                <NuxtLink
                  v-if="button && !isExternalLink(button)"
                  :to="getButtonUrl(button)"
                  class="button"
                >
                  <span>{{ button.text }}</span>
                </NuxtLink>
                <a
                  v-else-if="button && isExternalLink(button)"
                  :href="getButtonUrl(button)"
                  class="button"
                  :target="isMailtoOrTelLink(button) ? '_self' : '_blank'"
                  :rel="isMailtoOrTelLink(button) ? '' : 'noopener noreferrer'"
                >
                  <span>{{ button.text }}</span>
                </a>
              </template>
            </div>

            <!-- Text content -->
            <div 
              v-if="section.titleAndTextContent?.text" 
              class="text-content body"
              data-fade-in
            >
              <SanityBlocks :blocks="section.titleAndTextContent.text" />
            </div>

            <!-- Buttons below text if not above -->
            <div 
              v-if="!section.titleAndTextContent?.buttonsAboveText && buttons.length > 0" 
              class="buttons-wrapper"
              data-fade-in
            >
              <template v-for="(button, index) in buttons" :key="index">
                <NuxtLink
                  v-if="button && !isExternalLink(button)"
                  :to="getButtonUrl(button)"
                  class="button"
                >
                  <span>{{ button.text }}</span>
                </NuxtLink>
                <a
                  v-else-if="button && isExternalLink(button)"
                  :href="getButtonUrl(button)"
                  class="button"
                  :target="isMailtoOrTelLink(button) ? '_self' : '_blank'"
                  :rel="isMailtoOrTelLink(button) ? '' : 'noopener noreferrer'"
                >
                  <span>{{ button.text }}</span>
                </a>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, onMounted, nextTick } from 'vue'
import SanityBlocks from '~/components/SanityBlocks.vue'
import { useSectionVisibility } from '~/composables/useSectionVisibility'
import { useSectionId } from '~/composables/useSectionId'

const props = defineProps({
  section: {
    type: Object,
    required: true,
    validator: (value) => {
      return value && value._type === 'section' && value.sectionType === 'titleAndText'
    }
  }
})

const sectionRef = ref(null)
const { generateSectionId } = useSectionId()

// Generate section ID from title for anchor navigation
const sectionId = computed(() => {
  if (props.section?.title) {
    return generateSectionId(props.section.title)
  }
  return null
})

// Use section visibility composable to trigger fade-in animations
const { addSectionTrigger } = useSectionVisibility()

onMounted(() => {
  nextTick(() => {
    if (sectionRef.value) {
      addSectionTrigger(sectionRef.value)
    }
  })
})

const buttons = computed(() => {
  return props.section?.titleAndTextContent?.buttons || []
})

const isExternalLink = (button) => {
  if (!button || !button.link) return false
  // If it has a page reference, it's internal
  if (button.link?.page?.slug?.current) {
    return false
  }
  // If it has a URL, it's external
  if (button.link?.url) {
    return true
  }
  return false
}

const isMailtoOrTelLink = (button) => {
  if (!button || !button.link) return false
  const url = button.link?.url
  return url && (url.startsWith('mailto:') || url.startsWith('tel:'))
}

const getButtonUrl = (button) => {
  if (!button || !button.link) return '#'
  if (button.link?.page?.slug?.current) {
    return `/${button.link.page.slug.current}`
  }
  if (button.link?.url) {
    return button.link.url
  }
  return '#'
}
</script>

<style scoped>
.buttons-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: var(--pad-2);
}
</style>

