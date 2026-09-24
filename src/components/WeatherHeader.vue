<template>
  <div class="d-flex justify-space-between align-center">
    <img :src="logoSrc" :alt="t('app.name')" height="28" />

    <v-menu :close-on-content-click="false">
      <template #activator="{ props: menuProps }">
        <v-btn
          v-bind="menuProps"
          class="d-none d-sm-flex"
          rounded="lg"
          variant="tonal"
        >
          <v-icon start icon="mdi-cog-outline" />
          {{ t("header.units") }}
          <v-icon end icon="mdi-chevron-down" />
        </v-btn>
        <v-btn
          v-bind="menuProps"
          class="d-flex d-sm-none"
          icon="mdi-cog-outline"
          rounded="lg"
          size="small"
          variant="tonal"
        />
      </template>

      <v-card class="units-menu pa-2" min-width="260" rounded="lg">
        <v-btn
          block
          class="mb-2"
          rounded="lg"
          variant="outlined"
          @click="toggleSystem"
        >
          {{ isImperial ? t("header.switchToMetric") : t("header.switchToImperial") }}
        </v-btn>

        <v-list density="compact" nav>
          <v-list-subheader>{{ t("header.temperature") }}</v-list-subheader>
          <v-list-item
            v-for="option in temperatureOptions"
            :key="option.value"
            rounded="lg"
            :title="option.label"
            @click="setTemperature(option.value)"
          >
            <template v-if="units.temperature === option.value" #append>
              <v-icon icon="mdi-check" size="18" />
            </template>
          </v-list-item>

          <v-list-subheader>{{ t("header.windSpeed") }}</v-list-subheader>
          <v-list-item
            v-for="option in windSpeedOptions"
            :key="option.value"
            rounded="lg"
            :title="option.label"
            @click="setWindSpeed(option.value)"
          >
            <template v-if="units.windSpeed === option.value" #append>
              <v-icon icon="mdi-check" size="18" />
            </template>
          </v-list-item>

          <v-list-subheader>{{ t("header.precipitation") }}</v-list-subheader>
          <v-list-item
            v-for="option in precipitationOptions"
            :key="option.value"
            rounded="lg"
            :title="option.label"
            @click="setPrecipitation(option.value)"
          >
            <template v-if="units.precipitation === option.value" #append>
              <v-icon icon="mdi-check" size="18" />
            </template>
          </v-list-item>
        </v-list>
      </v-card>
    </v-menu>
  </div>
</template>

<script setup>
import logoSrc from "@/assets/logo.svg";
import { useUnits } from "@/composables/useUnits";

const { t } = useI18n();
const { units, isImperial, toggleSystem, setTemperature, setWindSpeed, setPrecipitation } = useUnits();

const temperatureOptions = computed(() => [
  { value: "celsius", label: t("header.celsius") },
  { value: "fahrenheit", label: t("header.fahrenheit") },
]);

const windSpeedOptions = computed(() => [
  { value: "kmh", label: t("header.kmh") },
  { value: "mph", label: t("header.mph") },
]);

const precipitationOptions = computed(() => [
  { value: "mm", label: t("header.millimeters") },
  { value: "inch", label: t("header.inches") },
]);
</script>
