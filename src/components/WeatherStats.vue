<template>
  <v-row>
    <v-col v-for="stat in stats" :key="stat.key" cols="6" sm="3" class="mt-4">
      <v-card color="surface-bright" rounded="lg" class="pa-2">
        <p class="text-body-medium text-medium-emphasis">
          {{ t(`stats.${stat.key}`) }}
        </p>
        <p class="text-title-large font-weight-bold mb-0">
          {{ stat.value }}
        </p>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
defineProps({
  stats: { type: Array, required: true },
});

const { t } = useI18n();
</script>
