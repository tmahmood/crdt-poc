import {inject, reactive} from "vue";
import {Todo, TodoList} from "./todos";
import {Ctx} from "./Ctx";
import {useDbHelper} from "./composables/dbHelper";

export const store = reactive({
    allTodos: [] as Array<Todo>,
    todoList: {} as TodoList,
    completedTodos: [] as Array<Todo>,
    activeTodos: [] as Array<Todo>,
    remaining: 0,
    peerId: '',
})

export const reloadAllTodosList = async (ctx: Ctx) => {
    let {select} = useDbHelper(ctx);
    let todos = await select('todo');
    store.allTodos = [];
    for (const todo of todos) {
        store.allTodos.push({
            "id": todo[0],
            "text": todo[1],
            "completed": todo[2] === 1
        });
    }
    store.completedTodos = store.allTodos.filter((t) => t.completed);
    store.activeTodos = store.allTodos.filter((t) => !t.completed);
    store.remaining = store.activeTodos.length;

}
