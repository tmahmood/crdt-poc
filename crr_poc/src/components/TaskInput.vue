<template>
  <input v-model="taskTitle" v-on:keyup.enter="addTask" class="new-todo">
</template>

<script setup lang="ts">
import {nanoid} from "nanoid";
import {Ctx} from "../Ctx";
import {inject, ref} from "vue";
import {useDbHelper} from "../composables/dbHelper";
import {reloadAllTodosList} from "../store";

let taskTitle = ref('');

const ctx = inject<Ctx>('ctx') as Ctx;
let {insert} = useDbHelper();

const addTask = () => {
  console.log(taskTitle);
  let t = nanoid();
  insert(ctx, 'todo', [t, taskTitle.value, 0]);
  taskTitle.value = '';
  reloadAllTodosList(ctx);
}

</script>