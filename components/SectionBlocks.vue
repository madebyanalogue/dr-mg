<template>
  <section 
    v-if="hasContent"
    :id="sectionId"
    :class="[
      'section-blocks',
      {
        'section-padding-top': !section.noPaddingTop,
        'section-padding-bottom': !section.noPaddingBottom,
        'section-padding-top-mobile': !section.paddingTopMobile,
        'section-padding-bottom-mobile': !section.paddingBottomMobile
      }
    ]"
    :data-section-id="section._id"
    ref="sectionRef"
  >
    <div class="wrapper">
        <div class="grid grid-1 gap-6">
            <!-- Image Section (if provided) -->
            <div 
                v-if="section.blocksContent?.image" 
                class="image-section"
                data-fade-in
            >
                <div class="grid grid-1 grid-md-12">
                <div class="col-span-12 col-span-4-md col-start-5-md">
                    <div class="image-container">
                    <NuxtImg
                        :src="section.blocksContent.image.asset.url"
                        :alt="section.blocksContent.image.alt || 'Section image'"
                        style="width: 33.333%; margin: 0 auto; display: block;"
                    />
                    </div>
                </div>
                </div>
            </div>

            <!-- Blocks Section -->
            <div 
                v-if="blocks.length > 0" 
                class="blocks-container gap-2 gap-0-md"
                ref="blocksRef"
            >
                <div 
                v-for="(block, index) in blocks" 
                :key="index"
                :class="[
                    'block-item',
                    { 'block-item--first': index === 0 }
                ]"
                :data-block-index="index"
                :data-fade-in-delay="index * 200"
                data-fade-in
                >
                <div v-if="block.text" class="h3">
                    <SanityBlocks :blocks="block.text" />
                </div>
                </div>
            </div>
        </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, onMounted, nextTick, watch } from 'vue'
import { useSectionVisibility } from '~/composables/useSectionVisibility'
import SanityBlocks from '~/components/SanityBlocks.vue'
import { useSectionId } from '~/composables/useSectionId'

const props = defineProps({
  section: {
    type: Object,
    required: true,
    validator: (value) => {
      return value && value._type === 'section' && value.sectionType === 'blocks'
    }
  }
})

const sectionRef = ref(null)
const blocksRef = ref(null)
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

const blocks = computed(() => {
  return props.section?.blocksContent?.blocks || []
})

// Check if section has any content
const hasContent = computed(() => {
  // Check for image
  if (props.section?.blocksContent?.image) return true
  // Check for blocks with text content
  if (blocks.value.length > 0) {
    return blocks.value.some(block => block.text && block.text.length > 0)
  }
  return false
})

onMounted(() => {
  if (typeof window === 'undefined' || !window.gsap || !window.ScrollTrigger) return
  
  nextTick(() => {
    if (!sectionRef.value || !blocksRef.value) return
    
    // Add section trigger for visibility
    addSectionTrigger(sectionRef.value)
    
    const blockItems = blocksRef.value.querySelectorAll('.block-item')
    if (blockItems.length === 0) return

    const { gsap, ScrollTrigger } = window
    gsap.registerPlugin(ScrollTrigger)
    
    // Animate border lines with staggered scaleY animation (vertical lines scaling from top)
    blockItems.forEach((item, index) => {
      // Set initial state for right border (after pseudo-element) using CSS custom property
      gsap.set(item, {
        '--scale-x': 0
      })
      
      // Set initial state for left border (before pseudo-element) on first item
      if (index === 0) {
        gsap.set(item, {
          '--scale-x-before': 0
        })
      }
      
      // Create scroll trigger for this block with staggered delay
      const delay = index * 0.2
      
      // Animate after pseudo-element (right border) - vertical line scaling from top to bottom
      ScrollTrigger.create({
        trigger: sectionRef.value,
        start: 'top 80%',
        onEnter: () => {
          // Animate the CSS custom property which controls scaleY
          gsap.to(item, {
            '--scale-x': 1,
            duration: 1.2,
            delay: delay,
            ease: 'power2.out'
          })
          
          // Animate before pseudo-element (left border) for first item
          if (index === 0) {
            gsap.to(item, {
              '--scale-x-before': 1,
              duration: 1.2,
              delay: delay,
              ease: 'power2.out'
            })
          }
        },
        once: true
      })
    })
  })
})
</script>

<style scoped>

.image-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.blocks-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

@media (max-width: 1000px) { 
.blocks-container {
  width: clamp(320px, 60%, 60%);
}
}


.block-item {
  flex: 0 0 33.333%;
  padding: var(--pad-1) var(--pad-2);
  position: relative;
}

.block-item {
  --scale-x: 0;
  --scale-x-before: 0;
}

.block-item::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 1px;
  height: 100%;
  background-color: currentColor;
  transform-origin: top;
  transform: scaleY(var(--scale-x, 0));
}

.block-item--first::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 1px;
  height: 100%;
  background-color: currentColor;
  transform-origin: top;
  transform: scaleY(var(--scale-x-before, 0));
}

.block-item .h3:before {
    width:20px;
    height:20px;
    margin-bottom: var(--pad-1);
    border-radius: 50%;
    border: 1px solid currentColor;
    content: '';
    display: block;
}

@media (max-width: 999px) {
  .block-item {
    flex: 0 0 100%;
    padding: var(--pad-1) 0;
    position: relative;
  }
  
  .block-item::after,
  .block-item--first::before {
    display: none;
  }
.block-item .h3:before {
    margin-top: 5px;
}
.block-item .h3:after {
    position: absolute;
    height: calc(calc(100% + var(--pad-2)) - 20px);
    left: 10px;
    top: calc(var(--pad-1) + 25px);
    content: '';
    width: 1px;
    background-color: currentColor;
}
.block-item:last-child .h3:after {
    display: none;
}
.block-item .h3 {
    display: grid;
    grid-template-columns: 20px 1fr;
    gap: var(--pad-2);
}
}

</style>

