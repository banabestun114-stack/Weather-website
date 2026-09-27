<template>
  <v-card class="h-100 pa-4" color="surface-bright" flat rounded="lg">
    <div class="d-flex justify-space-between align-center">
      <h3 class="text-title-medium font-weight-bold">
        {{ t("hourlyForecast.title") }}
      </h3>

      <v-menu>
        <template #activator="{ props: menuProps }">
          <v-btn v-bind="menuProps" rounded="lg" size="small" variant="tonal">
            {{ selectedDay ? dayLabel(selectedDay) : "" }}
            <v-icon end icon="mdi-chevron-down" />
          </v-btn>
        </template>

        <v-list density="compact">
          <v-list-item
            v-for="(day, index) in days"
            :key="day.date"
            :active="index === selectedIndex"
            :title="dayLabel(day)"
            @click="selectedIndex = index"
          />
        </v-list>
      </v-menu>
    </div>

    <div class="hour-list d-flex flex-column ga-3">
      <v-card
        v-for="hour in selectedDay?.hours ?? []"
        :key="hour.time"
        class="hour-card d-flex align-center justify-space-between px-4 py-3"
        flat
        rounded="lg"
      >
        <div class="d-flex align-center ga-3">
          <img :src="hour.image" alt="" width="26" height="26" />
          <span class="text-body-large">{{ hour.time }}</span>
        </div>
        <span class="font-weight-medium">{{ hour.temp }}°</span>
      </v-card>
    </div>
  </v-card>
</template>

<script setup>
const props = defineProps({
  days: { type: Array, required: true },
});

const { t } = useI18n();

const selectedIndex = ref(0);
const selectedDay = computed(() => props.days[selectedIndex.value]);

// New forecast (search or unit change) → jump back to today
watch(() => props.days, () => {
  selectedIndex.value = 0;
});

function dayLabel(day) {
  return t(`hourlyForecast.days.${day.dayKey}`);
}
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
