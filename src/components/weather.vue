<template>
  <!-- Ambient page background: soft glows tinted by the current weather scene -->
  <div class="ambient" :class="`ambient-${scene || 'night'}`" aria-hidden="true">
    <div class="glow glow-1" />
    <div class="glow glow-2" />
    <div class="glow glow-3" />
  </div>

  <v-container class="page py-6 py-sm-10">
    <weather-header />

    <!-- API / network failure: replaces the page with a retry screen -->
    <div v-if="errorMessage" class="error-state d-flex flex-column align-center text-center mx-auto py-12 py-sm-16">
      <img class="mb-6" src="@/assets/icon-error.svg" alt="" width="42" height="42" />
      <h2
        class="font-weight-bold mb-4"
        :class="xs ? 'text-headline-medium' : 'text-display-small'"
      >
        {{ t("errors.title") }}
      </h2>
      <p class="text-body-large text-medium-emphasis mb-8">
        {{ errorMessage }} {{ t("errors.tryAgain") }}
      </p>
      <v-btn
        :loading="loading"
        prepend-icon="mdi-refresh"
        rounded="lg"
        variant="tonal"
        @click="retry"
      >
        {{ t("errors.retry") }}
      </v-btn>
    </div>

    <template v-else>
      <h1
        class="text-center mx-auto my-8 font-weight-semibold"
        :class="xs ? 'text-headline-medium' : 'text-display-medium'"
      >
        {{ t("home.title") }}
      </h1>

      <search-bar
        :class="notFoundQuery ? 'mb-4' : 'mb-8'"
        :loading="loading"
        @search="handleSearch"
        @select="handleSelect"
        @clear="handleClear"
      />

      <!-- Misspelled / unknown city: keep showing the last weather, just explain -->
      <div v-if="notFoundQuery" class="text-center mb-8">
        <p class="text-title-large font-weight-bold mb-1">
          {{ t("errors.noResults") }}
        </p>
        <p class="text-body-medium text-medium-emphasis mb-0">
          {{ t("errors.placeNotFound", { query: notFoundQuery }) }}
        </p>
      </div>

      <v-row>
        <v-col cols="12" md="8">
          <template v-if="current">
            <current-weather-card
              :date="current.date"
              :image="current.image"
              :location="current.location"
              :note="yesterdayNote.text"
              :note-icon="yesterdayNote.icon"
              :scene="scene"
              :temp="current.temp"
            />

            <weather-stats :stats="stats" />

            <weather-insights :insights="insights" />

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
    </template>
  </v-container>
</template>

<script setup>
import { useDisplay } from "vuetify";
import { createDateFormatter } from "@/composables/dateFormat";
import { useLanguage } from "@/composables/useLanguage";
import { useUnits } from "@/composables/useUnits";
import { buildInsights, getScene } from "@/composables/weatherInsights";
import {
  buildCurrentWeather,
  buildDailyForecast,
  buildHourlyForecast,
  buildStats,
  fetchAirQuality,
  fetchForecast,
  geocodeLocation,
  getBrowserPosition,
  reverseGeocode,
} from "@/composables/useWeather";

// `nameKey` makes the default place's name follow the chosen language
const DEFAULT_PLACE = {
  name: "Erbil, Iraq",
  nameKey: "home.defaultPlace",
  latitude: 36.1912,
  longitude: 44.0094,
};

const { xs } = useDisplay();
const { t } = useI18n();
const { units } = useUnits();
const { language } = useLanguage();
const fmt = computed(() => createDateFormatter(language.value));

const loading = ref(false);
const errorMessage = ref("");
const notFoundQuery = ref("");
// Re-runs whatever failed (a search or a forecast load) from the error screen
let retryAction = null;
const currentPlace = ref(DEFAULT_PLACE);
// The place the page started with (the user's location, or DEFAULT_PLACE) — shown again when the search is cleared
const homePlace = ref(null);
// Increments per load so a slow, older response can't overwrite a newer one
let latestLoadId = 0;
const hasSearched = ref(false);

// The last successful load: raw API data plus the place and units it was fetched for.
// Everything shown is computed from it, so switching language re-renders without refetching.
// null until the first forecast loads, so the page shows placeholders instead of "0°".
const loaded = shallowRef(null);

const placeName = (place) => (place.nameKey ? t(place.nameKey) : place.name);

const current = computed(() => loaded.value
  && buildCurrentWeather(loaded.value.forecast, placeName(loaded.value.place), fmt.value));
const stats = computed(() => (loaded.value ? buildStats(loaded.value.forecast, loaded.value.units) : []));
const dailyForecastDays = computed(() => (loaded.value
  ? buildDailyForecast(loaded.value.forecast, fmt.value)
  : []));
const hourlyForecastDays = computed(() => (loaded.value
  ? buildHourlyForecast(loaded.value.forecast, fmt.value)
  : []));
const insights = computed(() => loaded.value
  && buildInsights(loaded.value.forecast, loaded.value.air, loaded.value.units, fmt.value));
const scene = computed(() => loaded.value
  && getScene(loaded.value.forecast, loaded.value.air, loaded.value.units));

const yesterdayNote = computed(() => {
  const diff = current.value?.vsYesterday;
  if (diff == null) return { text: "", icon: "" };
  if (diff > 0) return { text: t("current.warmerThanYesterday", { n: diff }), icon: "mdi-arrow-up" };
  if (diff < 0) return { text: t("current.coolerThanYesterday", { n: -diff }), icon: "mdi-arrow-down" };
  return { text: t("current.sameAsYesterday"), icon: "mdi-equal" };
});

/** Our own errors carry an i18n key; anything else (e.g. offline) gets the fallback. */
function translateError (error, fallbackKey) {
  return error.i18nKey ? t(error.i18nKey, error.params) : t(fallbackKey);
}

async function loadWeather (place) {
  const loadId = ++latestLoadId;
  currentPlace.value = place;
  loading.value = true;
  errorMessage.value = "";
  notFoundQuery.value = "";

  try {
    const fetchedUnits = { ...units };
    const [forecast, air] = await Promise.all([
      fetchForecast(place.latitude, place.longitude, fetchedUnits),
      // Air quality is a bonus — if it fails, the dust card is just hidden
      fetchAirQuality(place.latitude, place.longitude).catch(() => null),
    ]);
    if (loadId !== latestLoadId) return;
    loaded.value = { forecast, air, place, units: fetchedUnits };
  } catch (error) {
    if (loadId !== latestLoadId) return;
    retryAction = () => loadWeather(place);
    errorMessage.value = translateError(error, "errors.forecastFailed");
  } finally {
    if (loadId === latestLoadId) loading.value = false;
  }
}

async function handleSearch (query) {
  if (!query?.trim()) return;

  hasSearched.value = true;
  loading.value = true;
  errorMessage.value = "";
  notFoundQuery.value = "";

  try {
    const place = await geocodeLocation(query, language.value.api);
    await loadWeather(place);
  } catch (error) {
    if (error.i18nKey === "errors.placeNotFound") {
      notFoundQuery.value = query.trim();
    } else {
      retryAction = () => handleSearch(query);
      errorMessage.value = translateError(error, "errors.searchFailed");
    }
    loading.value = false;
  }
}

/** Search box emptied → go back to the place the page started with. */
function handleClear () {
  notFoundQuery.value = "";
  if (homePlace.value && currentPlace.value !== homePlace.value) {
    loadWeather(homePlace.value);
  }
}

function retry () {
  (retryAction ?? (() => loadWeather(currentPlace.value)))();
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
    const name = await reverseGeocode(latitude, longitude, language.value.api).catch(() => "");
    place = name ? { name, latitude, longitude } : { nameKey: "home.yourLocation", latitude, longitude };
  } catch {
    // Denied, unsupported or timed out — keep the default place
  }

  homePlace.value = place;

  // Don't overwrite a search the user started while we were locating them
  if (hasSearched.value) return;

  await loadWeather(place);
}

onMounted(() => {
  loadInitialWeather();
});
</script>

<style scoped>
.error-state {
  max-width: 560px;
}

.page {
  position: relative;
  z-index: 1;
}

/* Registered so the colors fade smoothly when the scene changes */
@property --glow-1 {
  syntax: "<color>";
  inherits: true;
  initial-value: transparent;
}

@property --glow-2 {
  syntax: "<color>";
  inherits: true;
  initial-value: transparent;
}

@property --glow-3 {
  syntax: "<color>";
  inherits: true;
  initial-value: transparent;
}

.ambient {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  transition: --glow-1 1.5s ease, --glow-2 1.5s ease, --glow-3 1.5s ease;
}

.glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.6;
  will-change: transform;
}

.glow-1 {
  width: 60vmax;
  height: 60vmax;
  top: -22vmax;
  left: -12vmax;
  background: radial-gradient(circle, var(--glow-1), transparent 70%);
  animation: drift-1 38s ease-in-out infinite alternate;
}

.glow-2 {
  width: 50vmax;
  height: 50vmax;
  top: 10vh;
  right: -18vmax;
  background: radial-gradient(circle, var(--glow-2), transparent 70%);
  animation: drift-2 44s ease-in-out infinite alternate;
}

.glow-3 {
  width: 55vmax;
  height: 55vmax;
  bottom: -25vmax;
  left: 15vw;
  background: radial-gradient(circle, var(--glow-3), transparent 70%);
  animation: drift-3 50s ease-in-out infinite alternate;
}

/* Scene palettes (same families as the hero card backgrounds) */
.ambient-clear { --glow-1: #2f6fd0; --glow-2: #38bdf8; --glow-3: #4f63f5; }
.ambient-hot { --glow-1: #3b2f5c; --glow-2: #d99045; --glow-3: #9a5a2e; }
.ambient-golden { --glow-1: #3f3582; --glow-2: #ec8d4f; --glow-3: #b04e78; }
.ambient-cloudy { --glow-1: #45536c; --glow-2: #8e99b0; --glow-3: #67758f; }
.ambient-fog { --glow-1: #5b6472; --glow-2: #9ca3af; --glow-3: #7f8896; }
.ambient-rain { --glow-1: #2d3a4f; --glow-2: #1e6f8f; --glow-3: #3f4d64; }
.ambient-storm { --glow-1: #2e2a55; --glow-2: #4338ca; --glow-3: #1d2540; }
.ambient-snow { --glow-1: #6286b8; --glow-2: #c7d2fe; --glow-3: #93acd0; }
.ambient-dust { --glow-1: #7a5a30; --glow-2: #c19e68; --glow-3: #a07840; }
.ambient-night { --glow-1: #222766; --glow-2: #4f63f5; --glow-3: #372c75; }

@keyframes drift-1 {
  from { transform: translate(0, 0) scale(1); }
  to { transform: translate(12vw, 8vh) scale(1.15); }
}

@keyframes drift-2 {
  from { transform: translate(0, 0) scale(1.1); }
  to { transform: translate(-10vw, 12vh) scale(0.95); }
}

@keyframes drift-3 {
  from { transform: translate(0, 0) scale(1); }
  to { transform: translate(-14vw, -10vh) scale(1.2); }
}

/* Light theme: same weather colors, blended as soft pastel tints on the pale background */
:global(.v-theme--weatherLight .ambient .glow) {
  opacity: 0.45;
  mix-blend-mode: multiply;
  filter: blur(70px) saturate(1.2);
}

@media (prefers-reduced-motion: reduce) {
  .glow {
    animation: none;
  }
}
</style>
