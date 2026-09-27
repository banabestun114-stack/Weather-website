<template>
  <v-app>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
  //
</script>

<style>
/* Light theme: the pale weather icons (moon, clouds) need a soft shadow to stand out on white */
.v-theme--weatherLight .weather-icon {
  filter: drop-shadow(0 1px 2px rgba(20, 25, 50, 0.35));
}
</style>
