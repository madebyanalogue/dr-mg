<template>
  <div class="section-video-transition">
    <div class="video">
      <div id="canvas" ref="canvasRef"></div>
      <div class="wrapper">
        <div class="plane" :data-duration="duration">
          <video
            v-for="(video, index) in videos"
            :key="index"
            :src="video.src"
            :data-sampler="getSamplerName(index)"
            playsinline
            muted
            loop
            preload="auto"
          ></video>
        </div>
      </div>
    </div>
    
    <!-- Navigation (optional) -->
    <nav v-if="showNavigation" class="video-transition-nav">
      <a
        v-for="(video, index) in videos"
        :key="index"
        class="video-transition-nav-item"
        :class="{ 'video-transition-nav-item--current': currentTexture === index }"
        :data-nav="index"
        @click="switchVideo(index)"
      >
        {{ video.label || `Video ${index + 1}` }}
      </a>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { Curtains, Plane } from 'curtainsjs'
import fragmentShader from '~/assets/shaders/fragment.glsl?raw'
import vertexShader from '~/assets/shaders/vertex.glsl?raw'
import { gsap } from 'gsap'

const props = defineProps({
  section: {
    type: Object,
    required: true
  }
})

const canvasRef = ref(null)
const curtains = ref(null)
const plane = ref(null)
const currentTexture = ref(0)
const isRunning = ref(false)
let timer = 0

// Get videos from section or use defaults
const videos = computed(() => {
  if (props.section?.videos && Array.isArray(props.section.videos) && props.section.videos.length > 0) {
    return props.section.videos.map(v => {
      let url = v.asset?.url || v.url
      // Ensure URL is absolute
      if (url && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
        url = `https://cdn.sanity.io${url}`
      }
      return {
        src: url,
        label: v.label || ''
      }
    })
  }
  // Default videos for testing (from public folder)
  return [
    { src: '/videos/1.mp4', label: 'Video 1' },
    { src: '/videos/2.mp4', label: 'Video 2' },
    { src: '/videos/3.mp4', label: 'Video 3' }
  ]
})

const duration = computed(() => props.section?.duration || 2.5)
const showNavigation = computed(() => props.section?.showNavigation !== false)

const getSamplerName = (index) => {
  const samplers = ['firstTexture', 'secondTexture', 'thirdTexture']
  return samplers[index] || samplers[0]
}

const switchVideo = (to) => {
  // Convert to number if string
  const targetIndex = typeof to === 'string' ? parseInt(to, 10) : to
  
  if (isRunning.value || targetIndex === currentTexture.value || !plane.value) return
  
  isRunning.value = true
  
  // Update active nav item
  currentTexture.value = targetIndex
  
  // Set to uniform (matching demo)
  plane.value.uniforms.to.value = targetIndex
  
  // Animate transition (matching demo exactly)
  const fake = { progress: 0 }
  gsap.to(fake, {
    duration: duration.value,
    progress: 1,
    ease: 'power2.in',
    onStart: () => {
      // Play the target video
      if (plane.value.videos && plane.value.videos[targetIndex]) {
        plane.value.videos[targetIndex].play().catch(err => {
          console.warn('[SectionVideoTransition] Video play failed:', err)
        })
      }
      currentTexture.value = targetIndex
    },
    onUpdate: () => {
      if (fake.progress === 1) {
        plane.value.uniforms.from.value = targetIndex
      }
      plane.value.uniforms.transitionTimer.value = fake.progress
    },
    onComplete: () => {
      plane.value.uniforms.from.value = targetIndex
      
      // Pause other videos (matching demo logic)
      const length = plane.value.videos.length
      plane.value.videos[(targetIndex + length - 1) % length]?.pause()
      plane.value.videos[(targetIndex + length + 1) % length]?.pause()
      
      isRunning.value = false
    }
  })
}

onMounted(() => {
  if (typeof window === 'undefined' || !canvasRef.value) return
  
  nextTick(() => {
    try {
      // Initialize Curtains (container is the canvas div)
      curtains.value = new Curtains({
        container: canvasRef.value,
        alpha: true,
        pixelRatio: Math.min(1.5, window.devicePixelRatio)
      })
      
      // Get plane element (it's a sibling of canvas, inside wrapper)
      // The wrapper is a sibling of #canvas, both inside .video
      const videoContainer = canvasRef.value.closest('.video')
      const wrapper = videoContainer?.querySelector('.wrapper')
      const planeElement = wrapper?.querySelector('.plane')
      
      if (!planeElement) {
        console.error('[SectionVideoTransition] Plane element not found', {
          hasVideoContainer: !!videoContainer,
          hasWrapper: !!wrapper,
          hasCanvas: !!canvasRef.value
        })
        return
      }
      
      // Set up uniforms (matching demo)
      const params = {
        vertexShaderID: null,
        fragmentShaderID: null,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: {
          transitionTimer: {
            name: 'uTransitionTimer',
            type: '1f',
            value: 0
          },
          timer: {
            name: 'uTimer',
            type: '1f',
            value: 0
          },
          to: {
            name: 'uTo',
            type: '1f',
            value: 0
          },
          from: {
            name: 'uFrom',
            type: '1f',
            value: 0
          }
        }
      }
      
      // Create plane
      plane.value = new Plane(curtains.value, planeElement, params)
      
      plane.value
        .onReady(() => {
          console.log('[SectionVideoTransition] Plane ready')
          
          // Play all videos to force uploading the first frame
          if (plane.value.playVideos) {
            plane.value.playVideos()
          }
          
          // Play first video
          if (plane.value.videos && plane.value.videos[0]) {
            plane.value.videos[0].play().catch(err => {
              console.warn('[SectionVideoTransition] Video play failed:', err)
            })
          }
          
          // Pause other videos after a render tick
          curtains.value.nextRender(() => {
            if (plane.value.videos) {
              for (let i = 1; i < plane.value.videos.length; i++) {
                plane.value.videos[i]?.pause()
              }
            }
          })
        })
        .onRender(() => {
          timer += 0.001
          if (plane.value && plane.value.uniforms) {
            plane.value.uniforms.timer.value = timer
          }
        })
        .onError((error) => {
          console.error('[SectionVideoTransition] Plane error:', error)
        })
    } catch (error) {
      console.error('[SectionVideoTransition] Initialization error:', error)
    }
  })
})

onUnmounted(() => {
  if (plane.value) {
    try {
      plane.value.remove()
    } catch (e) {
      console.warn('[SectionVideoTransition] Error removing plane:', e)
    }
  }
  if (curtains.value) {
    try {
      curtains.value.dispose()
    } catch (e) {
      console.warn('[SectionVideoTransition] Error disposing curtains:', e)
    }
  }
})
</script>

<style scoped>
.section-video-transition {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.video {
  position: relative;
  width: 100%;
  height: 100%;
}

#canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.plane {
  width: 100%;
  height: 100%;
  position: relative;
}

.plane video {
  position: absolute;
  left: 0;
  top: 0;
  width: 100px;
  display: none;
}

.video-transition-nav {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 1rem;
  z-index: 10;
}

.video-transition-nav-item {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  text-decoration: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.video-transition-nav-item:hover {
  background: rgba(255, 255, 255, 0.3);
}

.video-transition-nav-item--current {
  background: rgba(255, 255, 255, 0.5);
}
</style>

