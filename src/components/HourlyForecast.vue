<template>
  <v-card class="h-100 pa-4" color="surface-bright" flat rounded="lg">
    <div class="d-flex justify-space-between align-center">
      <h3 class="text-title-medium font-weight-bold">
        {{ t("hourlyForecast.title") }}
      </h3>

      <v-menu>
        <template #activator="{ props: menuProps }">
          <v-btn v-bind="menuProps" rounded="lg" size="small" variant="tonal">
            {{ selectedDay }}
            <v-icon end icon="mdi-chevron-down" />
          </v-btn>
        </template>

        <v-list density="compact">
          <v-list-item
            v-for="day in dayOptions"
            :key="day"
            :title="day"
            @click="selectedDay = day"
          />
        </v-list>
      </v-menu>
    </div>

    <div class="hour-list d-flex flex-column ga-3">
      <v-card
        v-for="hour in hours"
        :key="hour.time"
        class="hour-card d-flex align-center justify-space-between px-4 py-3"
        flat
        rounded="lg"
      >
        <div class="d-flex align-center ga-3">
          <v-icon :color="hour.color" :icon="hour.icon" size="22" />
          <span class="text-body-large">{{ hour.time }}</span>
        </div>
        <span class="font-weight-medium">{{ hour.temp }}°</span>
      </v-card>
    </div>
  </v-card>
</template>

<script setup>
defineProps({
  hours: { type: Array, required: true },
});

const { t } = useI18n();

const dayKeys = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
const dayOptions = computed(() =>
  dayKeys.map((key) => t(`hourlyForecast.days.${key}`)),
);

const selectedDay = ref(dayOptions.value[1]);
</script>

<style scoped>
.hour-list {
  max-height: 420px;
  overflow-y: auto;
}

.hour-card {
  background-color: rgba(255, 255, 255, 0.05);
  flex: none;
}
</style>
