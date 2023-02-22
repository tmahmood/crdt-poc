import type { Component } from 'solid-js';

import logo from './logo.svg';
import styles from './App.module.css';

const App: Component = () => {
  return (
    <div class={styles.App}>
      <header class={styles.header}>
        <ul>
          <li><a href="/earth">Hello Earth</a></li>
          <li><a href="/mars">Hello Mars</a></li>
        </ul>
      </header>
    </div>
  );
};

export default App;
