<template>
  <div class="peers">
    <input v-model="store.peerId">
    <a href="#" @click="connectToPeer">Connect</a>
    <ul class="pending">
      {pending.map((p) => (
      <li id={p}>{p.substring(0, 8)}</li>
      ))}
    </ul>
    <ul class="established">
      {established.map((p) => (
      <li id={p}>{p.substring(0, 8)}</li>
      ))}
    </ul>
  </div>
</template>

<script setup lang="ts">
import {inject} from "vue";
import {Ctx} from "../Ctx";
import {store} from "../store";

let ctx = inject("ctx") as Ctx;

const connectToPeer = () => {
  ctx.rtc.connectTo(store.peerId);
}

</script>

<style scoped>

</style>