<template>
  <v-card class="current-weather-card" :class="`scene-${scene}`" fluid rounded="lg">
    <!-- Animated layer for the scene: rain, snow, drifting dust/fog, stars, sun glow -->
    <div class="scene-fx" aria-hidden="true" />

    <v-container class="card-content d-flex justify-space-between align-center fill-height">
      <div>
        <h2
          class="font-weight-bold mb-1"
          :class="xs ? 'text-title-large' : 'text-headline-small'"
        >
          {{ location }}
        </h2>
        <p class="text-body-medium card-muted mb-0">
          {{ date }}
        </p>
        <p v-if="note" class="text-body-small card-muted d-flex align-center ga-1 mt-2 mb-0">
          <v-icon :icon="noteIcon" size="16" />
          {{ note }}
        </p>
      </div>

      <div class="d-flex align-center ga-2 flex-shrink-0">
        <img :src="image" alt="" :width="xs ? 56 : 72" :height="xs ? 56 : 72" />
        <span
          class="font-weight-bold"
          :class="xs ? 'text-display-small' : 'text-display-large'"
          >{{ temp }}°</span
        >
      </div>
    </v-container>
  </v-card>
</template>

<script setup>
import { useDisplay } from "vuetify";

defineProps({
  location: { type: String, required: true },
  date: { type: String, required: true },
  temp: { type: [Number, String], required: true },
  image: { type: String, required: true },
  // storm | rain | snow | dust | fog | night | golden | cloudy | hot | clear
  scene: { type: String, default: "clear" },
  // e.g. "3° warmer than yesterday"
  note: { type: String, default: "" },
  noteIcon: { type: String, default: "mdi-thermometer" },
});

const { xs } = useDisplay();
</script>

<style scoped>
.current-weather-card {
  position: relative;
  overflow: hidden;
  height: 200px;
  color: #fff;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.25);
  transition: background 0.6s ease;
}

.card-content {
  position: relative;
  z-index: 1;
}

.card-muted {
  opacity: 0.85;
}

.scene-fx {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* ---------- Sky colors per scene ---------- */

.scene-clear {
  background: linear-gradient(160deg, #2f6fd0 0%, #4f97e8 55%, #8cc8f7 100%);
}

.scene-hot {
  background: linear-gradient(160deg, #e0781b 0%, #e5512b 55%, #b02a2a 100%);
}

.scene-golden {
  background: linear-gradient(180deg, #3f3582 0%, #b04e78 55%, #ec8d4f 100%);
}

.scene-cloudy {
  background: linear-gradient(160deg, #45536c 0%, #67758f 60%, #8e99b0 100%);
}

.scene-fog {
  background: linear-gradient(180deg, #5b6472 0%, #7f8896 100%);
}

.scene-rain {
  background: linear-gradient(170deg, #1c2533 0%, #2d3a4f 60%, #3f4d64 100%);
}

.scene-storm {
  background: linear-gradient(170deg, #0f1422 0%, #1d2540 60%, #2e2a55 100%);
}

.scene-snow {
  background: linear-gradient(170deg, #3d5f94 0%, #6286b8 60%, #93acd0 100%);
}

.scene-dust {
  background: linear-gradient(170deg, #7a5a30 0%, #a07840 50%, #c19e68 100%);
}

.scene-night {
  background: linear-gradient(170deg, #0d1333 0%, #222766 60%, #372c75 100%);
}

/* ---------- Effects ---------- */

/* Sun glow in the corner, gently pulsing */
.scene-clear .scene-fx,
.scene-hot .scene-fx,
.scene-golden .scene-fx {
  background: radial-gradient(circle at 88% 18%, rgba(255, 240, 180, 0.75) 0, rgba(255, 210, 120, 0.3) 14%, transparent 38%);
  animation: glow 6s ease-in-out infinite alternate;
}

.scene-golden .scene-fx {
  background: radial-gradient(circle at 85% 100%, rgba(255, 200, 120, 0.7) 0, rgba(255, 170, 90, 0.25) 20%, transparent 45%);
}

/* Stars that twinkle */
.scene-night .scene-fx {
  background-image:
    radial-gradient(1.5px 1.5px at 12% 22%, #fff, transparent),
    radial-gradient(1px 1px at 28% 68%, #fff, transparent),
    radial-gradient(1.5px 1.5px at 44% 14%, #fff, transparent),
    radial-gradient(1px 1px at 57% 80%, #fff, transparent),
    radial-gradient(2px 2px at 66% 34%, #fff, transparent),
    radial-gradient(1px 1px at 78% 58%, #fff, transparent),
    radial-gradient(1.5px 1.5px at 90% 20%, #fff, transparent),
    radial-gradient(1px 1px at 35% 40%, #fff, transparent),
    radial-gradient(1px 1px at 8% 85%, #fff, transparent),
    radial-gradient(1.5px 1.5px at 95% 75%, #fff, transparent);
  animation: twinkle 4s ease-in-out infinite alternate;
}

/* Falling rain: thin streaks in a repeating tile that scrolls down, slightly slanted */
.scene-rain .scene-fx::before,
.scene-storm .scene-fx::before {
  content: "";
  position: absolute;
  inset: -40px -20px;
  background-image:
    linear-gradient(to bottom, transparent 0 70%, rgba(190, 215, 255, 0.55) 70% 100%),
    linear-gradient(to bottom, transparent 0 80%, rgba(190, 215, 255, 0.4) 80% 100%);
  background-size: 1px 60px, 1px 45px;
  background-repeat: repeat;
  /* Spread the 1px columns out: one column every 19px / 31px */
  mask-image: repeating-linear-gradient(90deg, #000 0 1px, transparent 1px 19px);
  transform: rotate(12deg);
  animation: rain 0.6s linear infinite;
}

/* Lightning flash, now and then */
.scene-storm .scene-fx::after {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.9);
  opacity: 0;
  animation: flash 7s linear infinite;
}

/* Snowflakes drifting down */
.scene-snow .scene-fx {
  background-image:
    radial-gradient(2px 2px at 10% 20%, #fff, transparent),
    radial-gradient(3px 3px at 30% 60%, #fff, transparent),
    radial-gradient(2px 2px at 50% 30%, #fff, transparent),
    radial-gradient(2.5px 2.5px at 70% 80%, #fff, transparent),
    radial-gradient(2px 2px at 90% 45%, #fff, transparent);
  background-size: 160px 100px;
  animation: snow 8s linear infinite;
}

/* Dust: warm haze clouds drifting sideways */
.scene-dust .scene-fx,
.scene-fog .scene-fx {
  background:
    radial-gradient(ellipse 60% 50% at 20% 60%, rgba(230, 190, 130, 0.45), transparent 70%),
    radial-gradient(ellipse 50% 45% at 70% 30%, rgba(220, 175, 110, 0.4), transparent 70%),
    radial-gradient(ellipse 55% 50% at 110% 70%, rgba(235, 200, 140, 0.4), transparent 70%);
  background-size: 200% 100%;
  animation: haze 18s ease-in-out infinite alternate;
}

.scene-fog .scene-fx {
  background:
    radial-gradient(ellipse 70% 30% at 20% 70%, rgba(230, 235, 240, 0.35), transparent 70%),
    radial-gradient(ellipse 60% 25% at 80% 35%, rgba(230, 235, 240, 0.3), transparent 70%);
  background-size: 200% 100%;
}

@keyframes glow {
  from { opacity: 0.75; }
  to { opacity: 1; }
}

@keyframes twinkle {
  from { opacity: 0.55; }
  to { opacity: 1; }
}

@keyframes rain {
  from { background-position: 0 0, 0 20px; }
  to { background-position: 0 60px, 0 65px; }
}

@keyframes flash {
  0%, 92%, 94.5%, 100% { opacity: 0; }
  93%, 95.5% { opacity: 0.35; }
}

@keyframes snow {
  from { background-position: 0 0; }
  to { background-position: 40px 100px; }
}

@keyframes haze {
  from { background-position: 0% 0; }
  to { background-position: 100% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .scene-fx,
  .scene-fx::before,
  .scene-fx::after {
    animation: none !important;
  }
}
</style>
