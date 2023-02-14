<template>
  <input v-if="editing" v-model="item.text" class="edit">
  <div class="view" v-else>
    <input
        class="toggle"
        type="checkbox"
        v-model="item.completed"
        v-on:change="updateTask('toggle')"
    />
    <label>{{ item.text }}</label>
    <button class="destroy" v-on:click="updateTask('delete')"/>
  </div>
</template>

<script setup lang="ts">
import {Todo} from "../todos";
import {inject} from "vue";
import {reloadAllTodosList} from "../store";
import {Ctx, DbHelper} from 'crsqlite_helper';

const props = defineProps<{
  item: Todo,
  editing: boolean,
}>();

let ctx: Ctx = inject("ctx") as Ctx;

const updateTask = (action: string) => {
  const {completed, id} = props.item;
  if (action === "toggle") {
    DbHelper.updateRow(ctx, 'todo', id, {completed: completed});
  } else if (action === "delete") {
    DbHelper.deleteRow(ctx, 'todo', id);
  } else {
  }
  reloadAllTodosList(ctx);
}
</script>

<style scoped>

</style>