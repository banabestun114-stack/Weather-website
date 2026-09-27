<template>
  <div class="pt-6">
    <h3 class="text-title-medium font-weight-bold mb-3">
      {{ t("insights.title") }}
    </h3>

    <v-row density="compact">
      <v-col v-for="card in cards" :key="card.key" cols="12" sm="6">
        <v-card class="insight-card pa-4 h-100" color="surface-bright" flat rounded="lg">
          <div class="d-flex align-center ga-2 mb-3">
            <v-avatar :color="card.color" rounded="lg" size="32" variant="tonal">
              <v-icon :icon="card.icon" size="18" />
            </v-avatar>
            <span class="text-body-medium text-medium-emphasis">{{ card.title }}</span>
          </div>

          <p class="text-title-medium font-weight-bold mb-1" :class="`text-${card.color}`">
            {{ card.headline }}
          </p>
          <p v-if="card.detail" class="text-body-small text-medium-emphasis mb-2">
            {{ card.detail }}
          </p>
          <p class="text-body-medium mb-0">
            {{ card.advice }}
          </p>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
const props = defineProps({
  // Output of buildInsights() in composables/weatherInsights.js
  insights: { type: Object, required: true },
});

const { t } = useI18n();

// Theme colors (see plugins/vuetify.js) so text stays readable in dark and light
const HEAT_COLORS = { safe: "success", caution: "warning", danger: "alert", extreme: "error" };
const DUST_COLORS = { low: "success", moderate: "moderate", high: "alert", severe: "error" };

const cards = computed(() => {
  const { heat, dust, bestTime, week } = props.insights;
  const list = [];

  list.push({
    key: "heat",
    icon: "mdi-thermometer-alert",
    color: HEAT_COLORS[heat.level],
    title: t("insights.heat.title"),
    headline: t(`insights.heat.levels.${heat.level}`),
    detail: t("insights.heat.detail", {
      temp: heat.feelsLikeMax,
      uv: heat.uvMax,
      uvLevel: t(`insights.heat.uv.${heat.uvLevel}`),
    }),
    advice: t(`insights.heat.advice.${heat.level}`),
  });

  if (dust) {
    list.push({
      key: "dust",
      icon: "mdi-weather-dust",
      color: DUST_COLORS[dust.level],
      title: t("insights.dust.title"),
      headline: t(`insights.dust.levels.${dust.level}`),
      detail: dust.aqi == null
        ? ""
        : t("insights.dust.detail", { aqi: dust.aqi, aqiLevel: t(`insights.dust.aqi.${dust.aqiLevel}`) }),
      advice: dust.expected
        ? t("insights.dust.expected", {
          day: t(`insights.days.${dust.expected.day}`),
          period: t(`insights.periods.${dust.expected.period}`),
        })
        : t("insights.dust.clear"),
    });
  }

  if (bestTime) {
    list.push({
      key: "bestTime",
      icon: bestTime.mode === "coolest" ? "mdi-walk" : "mdi-weather-sunny",
      color: "primary",
      title: t("insights.bestTime.title"),
      headline: t("insights.bestTime.window", {
        start: bestTime.start,
        end: bestTime.end,
        day: t(`insights.days.${bestTime.day}`),
      }),
      detail: "",
      advice: t(`insights.bestTime.${bestTime.mode}`, { temp: bestTime.feelsLike }),
    });
  }

  const hasRain = week.rainDays.length > 0;
  list.push({
    key: "week",
    icon: hasRain ? "mdi-umbrella-outline" : "mdi-sprout-outline",
    color: hasRain ? "info" : "success",
    title: t("insights.week.title"),
    headline: hasRain ? t("insights.week.rainDays", { days: week.list }) : t("insights.week.noRain"),
    detail: "",
    advice: hasRain ? t("insights.week.rainAdvice") : t("insights.week.noRainAdvice"),
  });

  return list;
});
</script>
