<template>
  <v-container class="py-6 py-sm-10">
    <weather-header />

    <h1
      class="text-center mx-auto my-8 font-weight-semibold"
      :class="xs ? 'text-headline-medium' : 'text-display-medium'"
    >
      {{ t("home.title") }}
    </h1>

    <v-alert
      v-if="errorMessage"
      class="mb-6"
      closable
      density="compact"
      type="error"
      variant="tonal"
      @click:close="errorMessage = ''"
    >
      {{ errorMessage }}
    </v-alert>

    <search-bar class="mb-8" @search="handleSearch" />

    <v-progress-linear
      v-if="loading"
      class="mb-4"
      color="primary"
      indeterminate
    />

    <v-row>
      <v-col cols="12" md="8">
        <current-weather-card
          :date="current.date"
          :icon="current.icon"
          :location="current.location"
          :temp="current.temp"
        />

        <weather-stats :stats="stats" />

        <daily-forecast :days="dailyForecastDays" />
      </v-col>

      <v-col cols="12" md="4">
        <hourly-forecast :hours="hourlyForecastHours" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { useDisplay } from "vuetify";
import { useUnits } from "@/composables/useUnits";
import {
  buildCurrentWeather,
  buildDailyForecast,
  buildHourlyForecast,
  buildStats,
  fetchForecast,
  geocodeLocation,
} from "@/composables/useWeather";

const DEFAULT_PLACE = {
  name: "Erbil, Iraq",
  latitude: 36.1912,
  longitude: 44.0094,
};

const { xs } = useDisplay();
const { t } = useI18n();
const { units } = useUnits();

const loading = ref(false);
const errorMessage = ref("");
const currentPlace = ref(DEFAULT_PLACE);

const current = ref({
  location: "",
  date: "",
  temp: 0,
  icon: "mdi-weather-sunny",
});
const stats = ref([]);
const dailyForecastDays = ref([]);
const hourlyForecastHours = ref([]);

async function loadWeather (place) {
  currentPlace.value = place;
  loading.value = true;
  errorMessage.value = "";

  try {
    const data = await fetchForecast(place.latitude, place.longitude, units);
    current.value = buildCurrentWeather(data, place.name);
    stats.value = buildStats(data, units);
    dailyForecastDays.value = buildDailyForecast(data);
    hourlyForecastHours.value = buildHourlyForecast(data);
  } catch (error) {
    errorMessage.value = error.message || "Something went wrong fetching the forecast.";
  } finally {
    loading.value = false;
  }
}

async function handleSearch (query) {
  if (!query?.trim()) return;

  loading.value = true;
  errorMessage.value = "";

  try {
    const place = await geocodeLocation(query);
    await loadWeather(place);
  } catch (error) {
    errorMessage.value = error.message || "Could not find that place.";
    loading.value = false;
  }
}

watch(units, () => {
  loadWeather(currentPlace.value);
}, { deep: true });

onMounted(() => {
  loadWeather(DEFAULT_PLACE);
});
</script>
