<template>
  <div>
    {{r}}
  </div>
</template>

<script setup lang="ts">
let response = await fetch("/mars");
let r = await response.text();
</script>

<style scoped>

</style>