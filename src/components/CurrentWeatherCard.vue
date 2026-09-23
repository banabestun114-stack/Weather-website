<template>
  <v-card class="current-weather-card pa-4 pa-sm-6" flat rounded="xl">
    <div class="d-flex justify-space-between align-start flex-nowrap ga-2">
      <div>
        <h2
          class="font-weight-bold mb-1"
          :class="xs ? 'text-title-medium' : 'text-headline-small'"
        >
          {{ location }}
        </h2>
        <p class="text-body-medium text-medium-emphasis mb-0">
          {{ date }}
        </p>
      </div>

      <div class="d-flex align-center ga-2 flex-shrink-0">
        <v-icon color="amber-lighten-1" :icon="icon" :size="xs ? 28 : 40" />
        <span
          class="font-weight-bold"
          :class="xs ? 'text-display-small' : 'text-display-large'"
          >{{ temp }}°</span
        >
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { useDisplay } from "vuetify";
import bgLargeUrl from "@/assets/bg-today-large.svg";
import bgSmallUrl from "@/assets/bg-today-small.svg";

defineProps({
  location: { type: String, required: true },
  date: { type: String, required: true },
  temp: { type: [Number, String], required: true },
  icon: { type: String, default: "mdi-weather-sunny" },
});

const { xs } = useDisplay();

const bgLarge = `url(${bgLargeUrl})`;
const bgSmall = `url(${bgSmallUrl})`;
</script>

<style scoped>
.current-weather-card {
  background-image: v-bind(bgLarge);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

@media (max-width: 600px) {
  .current-weather-card {
    background-image: v-bind(bgSmall);
  }
}
</style>
