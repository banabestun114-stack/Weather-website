<template>
  <v-row align="center" class="search-bar mx-auto" density="compact">
    <v-col cols="12" sm>
      <v-text-field
        v-model="query"
        flat
        hide-details
        :placeholder="t('search.placeholder')"
        prepend-inner-icon="mdi-magnify"
        rounded="lg"
        variant="solo-filled"
      />
    </v-col>

    <v-col cols="12" sm="auto">
      <v-btn
        :block="xs"
        color="primary"
        :disabled="loading"
        min-height="56"
        rounded="lg"
        @click="emit('search', query)"
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

defineProps({
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(["search"]);

const { xs } = useDisplay();
const { t } = useI18n();

const query = ref("");
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
