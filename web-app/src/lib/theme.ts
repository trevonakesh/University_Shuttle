// Light / dark mode for the public pages. The choice is a data-theme
// attribute on <html>, remembered on this device. The script runs from the
// root layout before anything is drawn, so a page never flashes the wrong mode.
export const THEME_KEY = 'us-home-theme';

export const THEME_SCRIPT = `try{if(localStorage.getItem('${THEME_KEY}')==='dark')document.documentElement.setAttribute('data-theme','dark')}catch(e){}`;
