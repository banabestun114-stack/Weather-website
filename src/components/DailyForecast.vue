<template>
  <div>
    <h3 class="text-title-medium font-weight-bold mb-3">
      {{ t("dailyForecast.title") }}
    </h3>

    <v-row density="compact">
      <v-col v-for="day in days" :key="day.label" cols="4" sm>
        <v-card
          class="pa-3 text-center"
          color="surface-bright"
          flat
          rounded="lg"
        >
          <p class="text-body-medium font-weight-medium mb-2">
            {{ day.label }}
          </p>
          <v-icon class="mb-2" :color="day.color" :icon="day.icon" size="26" />
          <p class="text-body-medium mb-0">
            <span class="font-weight-bold">{{ day.high }}°</span>
            <span class="text-medium-emphasis ml-1">{{ day.low }}°</span>
          </p>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
defineProps({
  days: { type: Array, required: true },
});

const { t } = useI18n();
</script>
