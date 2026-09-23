<template>
  <v-card class="h-100 pa-4" color="surface-bright" flat rounded="lg">
    <div class="d-flex justify-space-between align-center mb-3">
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

    <v-list bg-color="transparent" class="pa-0">
      <template v-for="(hour, index) in hours" :key="hour.time">
        <v-list-item class="px-1" :title="hour.time">
          <template #prepend>
            <v-icon
              class="mr-3"
              :color="hour.color"
              :icon="hour.icon"
              size="20"
            />
          </template>
          <template #append>
            <span class="font-weight-medium">{{ hour.temp }}°</span>
          </template>
        </v-list-item>

        <v-divider v-if="index < hours.length - 1" />
      </template>
    </v-list>
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
