<template>
  <v-container class="py-6 py-sm-10">
    <weather-header />

    <h1
      class="text-center mx-auto my-8 font-weight-semibold"
      :class="xs ? 'text-headline-medium' : 'text-display-medium'"
    >
      {{ t("home.title") }}
    </h1>

    <search-bar class="mb-8" />

    <v-row>
      <v-col cols="12" md="8">
        <current-weather-card
          :date="current.date"
          :icon="current.icon"
          :location="current.location"
          :temp="current.temp"
        />
<!-- 
        <weather-stats class="mt-4" :stats="stats" />

        <daily-forecast class="mt-6" :days="dailyForecastDays" /> -->
      </v-col>

      <!-- <v-col cols="12" md="4">
        <hourly-forecast :hours="hourlyForecastHours" />
      </v-col> -->
    </v-row>
  </v-container>
</template>

<script setup>
import { useDisplay } from "vuetify";

const { xs } = useDisplay();
const { t } = useI18n();

const current = {
  location: "Berlin, Germany",
  date: "Tuesday, Aug 5, 2025",
  temp: 68,
  icon: "mdi-weather-sunny",
};

const stats = [
  { key: "feelsLike", value: "64°" },
  { key: "humidity", value: "46%" },
  { key: "wind", value: "9 mph" },
  { key: "precipitation", value: "0 in" },
];

const dailyForecastDays = [
  {
    label: "Tue",
    icon: "mdi-weather-pouring",
    color: "blue-lighten-2",
    high: 68,
    low: 57,
  },
  {
    label: "Wed",
    icon: "mdi-weather-pouring",
    color: "blue-lighten-2",
    high: 70,
    low: 59,
  },
  {
    label: "Thu",
    icon: "mdi-weather-sunny",
    color: "amber-lighten-1",
    high: 75,
    low: 57,
  },
  {
    label: "Fri",
    icon: "mdi-weather-partly-cloudy",
    color: "grey-lighten-1",
    high: 77,
    low: 55,
  },
  {
    label: "Sat",
    icon: "mdi-weather-lightning-rainy",
    color: "amber-lighten-1",
    high: 70,
    low: 59,
  },
  {
    label: "Sun",
    icon: "mdi-weather-cloudy",
    color: "grey-lighten-1",
    high: 77,
    low: 61,
  },
  {
    label: "Mon",
    icon: "mdi-weather-fog",
    color: "grey-lighten-1",
    high: 75,
    low: 59,
  },
];

const hourlyForecastHours = [
  {
    time: "3 PM",
    icon: "mdi-weather-cloudy",
    color: "grey-lighten-1",
    temp: 68,
  },
  {
    time: "4 PM",
    icon: "mdi-weather-partly-cloudy",
    color: "grey-lighten-1",
    temp: 68,
  },
  {
    time: "5 PM",
    icon: "mdi-weather-sunny",
    color: "amber-lighten-1",
    temp: 68,
  },
  {
    time: "6 PM",
    icon: "mdi-weather-cloudy",
    color: "grey-lighten-1",
    temp: 66,
  },
  {
    time: "7 PM",
    icon: "mdi-weather-cloudy",
    color: "grey-lighten-1",
    temp: 66,
  },
  { time: "8 PM", icon: "mdi-weather-fog", color: "grey-lighten-1", temp: 64 },
  {
    time: "9 PM",
    icon: "mdi-weather-cloudy",
    color: "grey-lighten-1",
    temp: 63,
  },
  {
    time: "10 PM",
    icon: "mdi-weather-cloudy",
    color: "grey-lighten-1",
    temp: 63,
  },
];
</script>
