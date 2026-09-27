<template>
  <v-row align="center" class="search-bar mx-auto" density="compact">
    <v-col cols="12" sm>
      <v-combobox
        v-model="selectedPlace"
        v-model:search="query"
        clearable
        flat
        hide-details
        :hide-no-data="!query"
        :items="suggestions"
        item-title="name"
        item-value="id"
        :loading="searching"
        menu-icon=""
        no-filter
        :placeholder="t('search.placeholder')"
        prepend-inner-icon="mdi-magnify"
        return-object
        rounded="lg"
        variant="solo-filled"
        @keydown.enter="onEnter"
      >
        <template #item="{ props: itemProps, item }">
          <v-list-item v-bind="itemProps" role="option" :subtitle="item.region" :title="item.city">
            <template #prepend>
              <v-icon icon="mdi-map-marker-outline" />
            </template>
          </v-list-item>
        </template>

        <template #no-data>
          <!-- Status line while there are no suggestions to list -->
          <v-list-item :title="noDataText">
            <template #prepend>
              <v-progress-circular v-if="searching" class="me-8" indeterminate size="20" width="2" />
              <v-icon v-else :icon="noResults ? 'mdi-map-marker-question-outline' : 'mdi-keyboard-outline'" />
            </template>
          </v-list-item>
        </template>
      </v-combobox>
    </v-col>

    <v-col cols="12" sm="auto">
      <v-btn
        :block="xs"
        color="primary"
        :disabled="loading"
        min-height="56"
        rounded="lg"
        @click="emitSearch"
      >
        <img
          v-if="loading"
          class="me-2 spin"
          src="@/assets/icon-loading.svg"
          alt=""
          width="16"
          height="16"
        />
        {{ t("search.button") }}
      </v-btn>
    </v-col>
  </v-row>
</template>

<script setup>
import { useDisplay } from "vuetify";
import { useLanguage } from "@/composables/useLanguage";
import { searchPlaces } from "@/composables/useWeather";

defineProps({
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(["search", "select", "clear"]);

const { xs } = useDisplay();
const { t } = useI18n();
const { language } = useLanguage();

const query = ref("");
const selectedPlace = ref(null);
const suggestions = ref([]);
const searching = ref(false);
// True once a finished search came back empty, so the menu can say "no places match"
const noResults = ref(false);

const noDataText = computed(() => {
  if (searching.value) return t("search.searching");
  if (noResults.value) return t("search.noSuggestions", { query: query.value.trim() });
  return t("search.keepTyping");
});

let debounceTimer;
let controller;

// Fetch suggestions as the user types (debounced, and older requests are cancelled)
watch(query, (text) => {
  clearTimeout(debounceTimer);
  controller?.abort();
  noResults.value = false;

  const trimmed = text?.trim() ?? "";

  // Box emptied (backspace or the ✕ button) → back to the default place.
  // Debounced so a brief empty value while Vuetify swaps text doesn't trigger it.
  if (!trimmed) {
    suggestions.value = [];
    searching.value = false;
    debounceTimer = setTimeout(() => emit("clear"), 300);
    return;
  }

  // Picking an item fills the box with its name — don't search for that again
  if (trimmed.length < 2 || (typeof selectedPlace.value === "object" && trimmed === selectedPlace.value?.name)) {
    suggestions.value = [];
    searching.value = false;
    return;
  }

  searching.value = true;
  debounceTimer = setTimeout(async () => {
    controller = new AbortController();
    try {
      suggestions.value = await searchPlaces(trimmed, 5, { signal: controller.signal, language: language.value.api });
      noResults.value = suggestions.value.length === 0;
      searching.value = false;
    } catch (error) {
      if (error.name === "AbortError") return;
      suggestions.value = [];
      searching.value = false;
    }
  }, 300);
});

// Enter acts like the Search button. Wait a tick so Vuetify first applies
// a suggestion highlighted with the arrow keys.
async function onEnter () {
  await nextTick();
  emitSearch();
}

/**
 * Picking a suggestion only fills the box — the weather loads on Search.
 * The combobox model is a place object when a suggestion was picked, or plain text otherwise.
 */
function emitSearch () {
  const place = selectedPlace.value;
  if (place && typeof place === "object" && query.value === place.name) {
    emit("select", place);
  } else {
    const text = query.value?.trim();
    emit(text ? "search" : "clear", text);
  }
}
</script>

<style scoped>
.search-bar {
  max-width: 640px;
}

.spin {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
