export const THEME_STORAGE_KEY = 'pea-color-scheme';

export const THEME_INIT_SCRIPT = `try{var s=localStorage.getItem('${THEME_STORAGE_KEY}');var d=s?s==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d)}catch(e){}`;
