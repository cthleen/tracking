import { writable } from 'svelte/store';

export function createClock() {
  const time = writable(new Date().toLocaleTimeString());

  const interval = setInterval(() => {
    time.set(new Date().toLocaleTimeString());
  }, 1000);

  return {
    time,
    stop: () => clearInterval(interval)
  };
}
