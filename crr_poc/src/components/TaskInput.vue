<template>
  <input v-model="taskTitle" v-on:keyup.enter="addTask" class="new-todo">
</template>

<script setup lang="ts">
import {nanoid} from "nanoid";
import {Ctx, DbHelper} from "crsqlite_helper";
import {inject, ref} from "vue";
import {reloadAllTodosList} from "../store";

let taskTitle = ref('');

const ctx = inject<Ctx>('ctx') as Ctx;

const addTask = () => {
  console.log(taskTitle);
  let t = nanoid();
  DbHelper.insert(ctx, 'todo', [t, taskTitle.value, 0]);
  taskTitle.value = '';
  reloadAllTodosList(ctx);
}

</script>