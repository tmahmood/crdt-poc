import {reactive} from "vue";

export type Todo = {
    id: string;
    text: string;
    completed: boolean;
};

export type Filter = "all" | "active" | "completed";

export type TodoList = {
    filter: Filter;
    editing: string | null;
};