<script setup lang="ts">

import {Suspense} from "vue";
import TaskInput from "./components/TaskInput.vue";
import TaskList from "./components/TaskList.vue";
import Footer from "./components/Footer.vue";

</script>

<template>
  <div class="todoapp">
    <header class="header">
      <h1>todos</h1>
      <TaskInput/>
    </header>
    <section class="main">
      <Suspense>
        <UserView />
      </Suspense>
      <Suspense>
        <TaskList />
        <template #fallback>
          Loading ...
        </template>
      </Suspense>
    </section>
    <Footer />
  </div>
</template>

