<template>
  <input v-if="editing" v-model="item.text" class="edit">
  <div class="view" v-else>
    <input
        class="toggle"
        type="checkbox"
        v-model="item.completed"
        v-on:change="updateTask('toggle')"
    />
    <label>{{item.text}}</label>
    <button class="destroy" v-on:click="updateTask('delete')"/>
  </div>
</template>

<script setup lang="ts">
import {Todo} from "../todos";
import {useDbHelper} from "../composables/dbHelper";
import {Ctx} from "../Ctx";
import {inject} from "vue";
import {reloadAllTodosList} from "../store";

const props = defineProps<{
  item: Todo,
  editing: boolean,
}>();

let ctx: Ctx = inject("ctx") as Ctx;
let {updateRow, deleteRow} = useDbHelper(ctx);

const updateTask = (action: string) => {
  const {completed, id} = props.item;
  if (action === "toggle") {
    updateRow('todo', id, { completed: completed})
  } else if (action === "delete") {
    deleteRow('todo', id);
  } else {

  }
  reloadAllTodosList(ctx);
}
</script>

<style scoped>

</style>