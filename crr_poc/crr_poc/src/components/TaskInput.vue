<template>
  <input v-model="taskTitle" v-on:keyup.enter="addTask($event)" class="new-todo">
</template>

<script setup lang="ts">
import {nanoid} from "nanoid";
import {Ctx} from "../Ctx";
import {inject, ref} from "vue";
import {useDbHelper} from "../composables/dbHelper";
import {reloadAllTodosList} from "../store";

let taskTitle = '';

const ctx = inject<Ctx>('ctx') as Ctx;
let {insert} = useDbHelper(ctx);

const addTask = (event: Event) => {
  let task = (event.target as HTMLInputElement).value;
  let t = nanoid();
  insert('todo', [t, task, 0]);
  console.log(task);
  taskTitle = '';
  reloadAllTodosList(ctx);
}

</script>