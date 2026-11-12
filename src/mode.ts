export const devMode = new URLSearchParams(location.search).get('dev') === '1';
export const storageScope = new URL('.', location.href).pathname + (devMode ? ':dev' : '');
export const playUrl = devMode ? './' : './?dev=1';
