<template>
  <div>
    <ul class="todo-list">
      <li v-for="item in store.allTodos" :key="item.id">
        <TodoView :item="item" :editing=false />
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import {store, reloadAllTodosList} from "../store";
import {inject} from "vue";
import {Ctx} from "../Ctx";
import TodoView from "./TodoView.vue";

let ctx = inject<Ctx>("ctx") as Ctx;
await reloadAllTodosList(ctx);
</script>