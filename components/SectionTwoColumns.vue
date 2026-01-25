<template>
  <section 
    v-if="hasContent"
    ref="sectionRef"
    :id="sectionId"
    :class="[
      'section-two-columns',
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
      <div class="grid grid-1 gap-2">
        <div class="grid grid-1 grid-md-12 gap-4" style="align-items: center;">
          <!-- First Column -->
          <div 
            :class="[
              `col-span-${firstColumnWidth}-md`,
              { 'hide-empty-mobile': !hasSlotContent(leftSlot) }
            ]"
          >
            <!-- Left Slot Content -->
            <div 
              v-if="hasSlotContent(leftSlot)" 
              data-fade-in
            >
              <!-- Image with mobile flexbox wrapper -->
              <div 
                v-if="leftSlot.type === 'image' && leftSlot.image"
                :class="[
                  'mobile-image-wrapper',
                  `mobile-image-align-${leftSlot.alignment || 'left'}`
                ]"
              >
                <div 
                  :class="[
                  'lazyload-image-container',
                    `mobile-image-width-${leftSlot.mobileWidth || '12'}`,
                    `image-align-${leftSlot.alignment || 'left'}`
                ]"
              >
                <NuxtImg
                  :src="leftSlot.image.asset.url"
                  :alt="leftSlot.imageAlt || 'Left column image'"
                  style="width: 100%; height: auto;"
                  class="lazyload-image"
                  :width="640"
                  :height="960"
                  sizes="(max-width: 999px) 100vw, 50vw"
                  loading="lazy"
                  format="webp"
                />
                <div class="lazyload-cover"></div>
                </div>
              </div>
              <div 
                v-else-if="leftSlot.type === 'text' && leftSlot.text && leftSlot.text.length > 0" 
                class="text-content body"
              >
                <SanityBlocks :blocks="leftSlot.text" />
              </div>
            </div>
          </div>

          <!-- Second Column (fills remaining) -->
          <div 
            :class="[
              `col-span-${secondColumnWidth}-md`,
              { 'hide-empty-mobile': !hasSlotContent(rightSlot) }
            ]"
          >
            <!-- Right Slot Content -->
            <div 
              v-if="hasSlotContent(rightSlot)" 
              data-fade-in
            >
              <!-- Image with mobile flexbox wrapper -->
              <div 
                v-if="rightSlot.type === 'image' && rightSlot.image"
                :class="[
                  'mobile-image-wrapper',
                  `mobile-image-align-${rightSlot.alignment || 'right'}`
                ]"
              >
                <div 
                  :class="[
                  'lazyload-image-container',
                    `mobile-image-width-${rightSlot.mobileWidth || '12'}`,
                    `image-align-${rightSlot.alignment || 'right'}`
                ]"
              >
                <NuxtImg
                  :src="rightSlot.image.asset.url"
                  :alt="rightSlot.imageAlt || 'Right column image'"
                  style="width: 100%; height: auto;"
                  class="lazyload-image"
                  :width="640"
                  :height="960"
                  sizes="(max-width: 999px) 100vw, 50vw"
                  loading="lazy"
                  format="webp"
                />
                <div class="lazyload-cover"></div>
                </div>
              </div>
              <!-- Text with mobile flexbox wrapper -->
              <div 
                v-else-if="rightSlot.type === 'text' && rightSlot.text && rightSlot.text.length > 0"
                :class="[
                  'mobile-content-wrapper',
                  `mobile-content-align-${rightSlot.alignment || 'right'}`
                ]"
              >
                <div 
                  :class="[
                    'text-content body',
                    `mobile-content-width-${rightSlot.mobileWidth || '12'}`
                  ]"
                >
                  <SanityBlocks :blocks="rightSlot.text" />
                </div>
              </div>
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
      return value && value._type === 'section' && value.sectionType === 'twoColumns'
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

const firstColumnWidth = computed(() => {
  return props.section?.twoColumnsContent?.firstColumnWidth || '6'
})

const secondColumnWidth = computed(() => {
  const first = parseInt(firstColumnWidth.value)
  return (12 - first).toString()
})

const leftSlot = computed(() => {
  return props.section?.twoColumnsContent?.leftSlot
})

const rightSlot = computed(() => {
  return props.section?.twoColumnsContent?.rightSlot
})


// Check if slot has actual content
const hasSlotContent = (slot) => {
  if (!slot) return false
  if (slot.type === 'image' && slot.image) return true
  if (slot.type === 'text' && slot.text && slot.text.length > 0) return true
  return false
}

const hasContent = computed(() => {
  return hasSlotContent(leftSlot.value) || hasSlotContent(rightSlot.value)
})
</script>

<style scoped>
.text-content {
  width: 100%;
}

/* Hide empty columns on screens smaller than 1000px */
@media (max-width: 999px) {
  .hide-empty-mobile {
    display: none;
  }

  /* Mobile image wrapper - flexbox container */
  .mobile-image-wrapper {
    display: flex;
    width: 100%;
  }

  /* Mobile content wrapper - flexbox container for text */
  .mobile-content-wrapper {
    display: flex;
    width: 100%;
  }

  /* Mobile image width classes (6-12 columns) */
  .mobile-image-width-6 {
    max-width: calc((100% / 12) * 6);
  }

  .mobile-image-width-7 {
    max-width: calc((100% / 12) * 7);
  }

  .mobile-image-width-8 {
    max-width: calc((100% / 12) * 8);
  }

  .mobile-image-width-9 {
    max-width: calc((100% / 12) * 9);
  }

  .mobile-image-width-10 {
    max-width: calc((100% / 12) * 10);
  }

  .mobile-image-width-11 {
    max-width: calc((100% / 12) * 11);
  }

  .mobile-image-width-12 {
    max-width: 100%;
  }

  /* Mobile content width classes (6-12 columns) */
  .mobile-content-width-6 {
    max-width: calc((100% / 12) * 6);
  }

  .mobile-content-width-7 {
    max-width: calc((100% / 12) * 7);
  }

  .mobile-content-width-8 {
    max-width: calc((100% / 12) * 8);
  }

  .mobile-content-width-9 {
    max-width: calc((100% / 12) * 9);
  }

  .mobile-content-width-10 {
    max-width: calc((100% / 12) * 10);
  }

  .mobile-content-width-11 {
    max-width: calc((100% / 12) * 11);
  }

  .mobile-content-width-12 {
    max-width: 100%;
  }

  /* Mobile image alignment */
  .mobile-image-align-left {
    justify-content: flex-start;
  }

  .mobile-image-align-center {
    justify-content: center;
  }

  .mobile-image-align-right {
    justify-content: flex-end;
  }

  /* Mobile content alignment */
  .mobile-content-align-left {
    justify-content: flex-start;
  }

  .mobile-content-align-center {
    justify-content: center;
  }

  .mobile-content-align-right {
    justify-content: flex-end;
  }
}

/* Image alignment classes */
.image-align-left {
  text-align: left;
}

.image-align-center {
  text-align: center;
}

.image-align-right {
  text-align: right;
}

.image-align-left .lazyload-image,
.image-align-center .lazyload-image,
.image-align-right .lazyload-image {
  display: inline-block;
}

/* On desktop, remove flexbox wrapper constraints */
@media (min-width: 1000px) {
  .mobile-image-wrapper,
  .mobile-content-wrapper {
    display: block;
    max-width: 100%;
  }
}
</style>

