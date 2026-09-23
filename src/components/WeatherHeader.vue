<template>
  <div class="d-flex justify-space-between align-center">
    <img :src="logoSrc" :alt="t('app.name')" height="28" />

    <v-menu>
      <template #activator="{ props: menuProps }">
        <v-btn
          v-bind="menuProps"
          class="d-none d-sm-flex"
          rounded="lg"
          variant="tonal"
        >
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

      <v-list density="compact">
        <v-list-item
          v-for="option in unitOptions"
          :key="option"
          :title="option"
        />
      </v-list>
    </v-menu>
  </div>
</template>

<script setup>
import logoSrc from "@/assets/logo.svg";

const { t, tm } = useI18n();

const unitOptions = tm("header.unitOptions");
</script>
