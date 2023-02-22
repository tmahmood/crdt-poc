import {Component, createSignal, For} from 'solid-js';

import logo from './logo.svg';
import styles from './App.module.css';
import {createResource} from "solid-js";

type PageLink = {
    link: string,
    text: string,
}

type StrDict = {[name: string]: string};

function PageLoad() {

    const [options, setOptions] = createSignal<StrDict>({});
    fetch("/links").then(async (r) => {
        try {
            let result: Array<PageLink> = await r.json();
            let opt: StrDict = {};
            for (const resultElement of result) {
                opt[resultElement.link] = resultElement.text;
            }
            setOptions(opt);
        } catch (e) {
            return;
        }
    })
    return (
        <>
            <ul>
                <For each={Object.keys(options())}>{
                    link => <li><a href={link}>{options()[link]}</a></li>
                }</For>
            </ul>
        </>
    )
}


const App: Component = () => {
    return (
        <div class={styles.App}>
            <header class={styles.header}>
                Apps in SW
            </header>
            <PageLoad />
        </div>
    );
};

export default App;
