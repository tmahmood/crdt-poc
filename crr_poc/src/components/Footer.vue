<template>
  <footer class="footer">
      <span class="todo-count">
        <strong>{{ store.remaining }}</strong>
        {{ store.remaining === 1 ? "item" : "items" }} left
      </span>
    <ul class="filters">
      <li>
        <a class="{{all ? 'selected' : ''}}" @click.prevent="store.todoList.filter='all'">All</a>
      </li>
      <li>
        <a class="{{active ? 'selected': ''}}" @click.prevent="store.todoList.filter='active'">Active</a>
      </li>
      <li>
        <a class="{{completed ? 'selected' : ''}}" @click.prevent="store.todoList.filter='completed'">Completed</a>
      </li>
      <li>
        <a href="/mars">Click me to mars</a>
      </li>
      <li>
        <a href="/earth">Click me to earth</a>
      </li>
      <li>
        <Suspense>
          <FromInnerRouter></FromInnerRouter>
        </Suspense>
      </li>
    </ul>

  </footer>
</template>


<script setup lang="ts">
import {store} from "../store";
import FromInnerRouter from "./FromInnerRouter.vue";
const remaining = store.remaining;
const all = store.todoList.filter === "all";
const active = store.todoList.filter === "active";
const completed = store.todoList.filter === "completed";
const hasDueTask = store.remaining !== store.allTodos.length;
</script>

<style scoped>
</style>