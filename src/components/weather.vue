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
      icon="false"
      type="error"
      variant="tonal"
      @click:close="errorMessage = ''"
    >
      <template #prepend>
        <img src="@/assets/icon-error.svg" alt="" width="18" height="18" />
      </template>
      {{ errorMessage }}
    </v-alert>

    <search-bar
      class="mb-8"
      :loading="loading"
      @search="handleSearch"
      @select="handleSelect"
    />

    <v-row>
      <v-col cols="12" md="8">
        <template v-if="current">
          <current-weather-card
            :date="current.date"
            :image="current.image"
            :location="current.location"
            :temp="current.temp"
          />

          <weather-stats :stats="stats" />

          <daily-forecast :days="dailyForecastDays" />
        </template>

        <!-- Placeholders until the first forecast arrives -->
        <template v-else>
          <v-skeleton-loader class="rounded-lg" color="surface-bright" height="200" type="image" />

          <v-row class="mt-4">
            <v-col v-for="n in 4" :key="n" cols="6" sm="3">
              <v-skeleton-loader class="rounded-lg" color="surface-bright" type="list-item-two-line" />
            </v-col>
          </v-row>

          <v-row class="pt-6" density="compact">
            <v-col v-for="n in 7" :key="n" cols="4" sm>
              <v-skeleton-loader class="rounded-lg" color="surface-bright" height="120" type="image" />
            </v-col>
          </v-row>
        </template>
      </v-col>

      <v-col cols="12" md="4">
        <hourly-forecast v-if="hourlyForecastDays.length" :days="hourlyForecastDays" />
        <v-skeleton-loader
          v-else
          class="rounded-lg"
          color="surface-bright"
          type="heading, list-item, list-item, list-item, list-item, list-item, list-item, list-item"
        />
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
  getBrowserPosition,
  reverseGeocode,
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
const hasSearched = ref(false);

// null until the first forecast loads, so the page shows placeholders instead of "0°"
const current = ref(null);
const stats = ref([]);
const dailyForecastDays = ref([]);
const hourlyForecastDays = ref([]);

/** Our own errors carry an i18n key; anything else (e.g. offline) gets the fallback. */
function translateError (error, fallbackKey) {
  return error.i18nKey ? t(error.i18nKey, error.params) : t(fallbackKey);
}

async function loadWeather (place) {
  currentPlace.value = place;
  loading.value = true;
  errorMessage.value = "";

  try {
    const data = await fetchForecast(place.latitude, place.longitude, units);
    current.value = buildCurrentWeather(data, place.name);
    stats.value = buildStats(data, units);
    dailyForecastDays.value = buildDailyForecast(data);
    hourlyForecastDays.value = buildHourlyForecast(data);
  } catch (error) {
    errorMessage.value = translateError(error, "errors.forecastFailed");
  } finally {
    loading.value = false;
  }
}

async function handleSearch (query) {
  if (!query?.trim()) return;

  hasSearched.value = true;
  loading.value = true;
  errorMessage.value = "";

  try {
    const place = await geocodeLocation(query);
    await loadWeather(place);
  } catch (error) {
    errorMessage.value = translateError(error, "errors.searchFailed");
    loading.value = false;
  }
}

/** A place picked from the search suggestions — we already have its coordinates. */
function handleSelect (place) {
  hasSearched.value = true;
  loadWeather(place);
}

watch(units, () => {
  loadWeather(currentPlace.value);
}, { deep: true });

/** Start with the user's own location, falling back to the default place. */
async function loadInitialWeather () {
  loading.value = true;

  let place = DEFAULT_PLACE;
  try {
    const { latitude, longitude } = await getBrowserPosition();
    const name = await reverseGeocode(latitude, longitude).catch(() => "");
    place = { name: name || t("home.yourLocation"), latitude, longitude };
  } catch {
    // Denied, unsupported or timed out — keep the default place
  }

  // Don't overwrite a search the user started while we were locating them
  if (hasSearched.value) return;

  await loadWeather(place);
}

onMounted(() => {
  loadInitialWeather();
});
</script>
