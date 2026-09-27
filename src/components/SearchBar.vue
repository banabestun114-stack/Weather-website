<template>
  <v-row align="center" class="search-bar mx-auto" density="compact">
    <v-col cols="12" sm>
      <v-autocomplete
        v-model="selectedPlace"
        v-model:search="query"
        auto-select-first
        flat
        hide-details
        hide-no-data
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
        @update:model-value="onSelect"
      >
        <template #item="{ props: itemProps, item }">
          <v-list-item v-bind="itemProps" role="option" :subtitle="item.region" :title="item.city">
            <template #prepend>
              <v-icon icon="mdi-map-marker-outline" />
            </template>
          </v-list-item>
        </template>
      </v-autocomplete>
    </v-col>

    <v-col cols="12" sm="auto">
      <v-btn
        :block="xs"
        color="primary"
        :disabled="loading"
        min-height="56"
        rounded="lg"
        @click="onButtonClick"
      >
        <img
          v-if="loading"
          class="mr-2 spin"
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
import { searchPlaces } from "@/composables/useWeather";

defineProps({
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(["search", "select"]);

const { xs } = useDisplay();
const { t } = useI18n();

const query = ref("");
const selectedPlace = ref(null);
const suggestions = ref([]);
const searching = ref(false);

let debounceTimer;
let controller;

// Fetch suggestions as the user types (debounced, and older requests are cancelled)
watch(query, (text) => {
  clearTimeout(debounceTimer);
  controller?.abort();

  const trimmed = text?.trim() ?? "";
  // Picking an item fills the box with its name — don't search for that again
  if (trimmed.length < 2 || trimmed === selectedPlace.value?.name) {
    suggestions.value = [];
    searching.value = false;
    return;
  }

  searching.value = true;
  debounceTimer = setTimeout(async () => {
    controller = new AbortController();
    try {
      suggestions.value = await searchPlaces(trimmed, 5, { signal: controller.signal });
      searching.value = false;
    } catch (error) {
      if (error.name === "AbortError") return;
      suggestions.value = [];
      searching.value = false;
    }
  }, 300);
});

function onSelect (place) {
  if (place) emit("select", place);
}

// Enter with no suggestion highlighted falls back to a plain search
function onEnter () {
  if (!suggestions.value.length) emitSearch();
}

function onButtonClick () {
  if (suggestions.value.length) {
    selectedPlace.value = suggestions.value[0];
    onSelect(suggestions.value[0]);
  } else {
    emitSearch();
  }
}

function emitSearch () {
  if (selectedPlace.value && query.value === selectedPlace.value.name) {
    emit("select", selectedPlace.value);
  } else {
    emit("search", query.value);
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
