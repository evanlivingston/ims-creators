import { defineNuxtPlugin } from '#app';
import type { IImsHostExposed } from '#bridge/types/IImsHost';

function makePlainArg(arg: unknown): any{
  switch (typeof arg){
    case 'boolean':
    case 'number':
    case 'string':
      return arg;
    case 'object':
      if (!arg) return null;
      if (Array.isArray(arg)){
        return arg.map(a => makePlainArg(a));
      }
      if (arg instanceof Uint8Array){
        return arg;
      }
      const transform: (entry: [string, unknown]) => [string, any] = entry =>  {
        return [entry[0], makePlainArg(entry[1])];
      }
      return Object.fromEntries(Object.entries(arg).map(transform))
    default:
      return null
  
  }
}

async function loadProxiedImshost(){
  await window.loadImshost();

  let CallIndexGenerator = 0;
  const exposed_imshost = (window as any).imshostRaw as Record<string, Record<string, Function>>;
  const proxied_imshost: Record<string, Record<string, Function>> = {}
  for (const api of Object.keys(exposed_imshost)){
    let proxied_api: Record<string, Function> = {};
    for (const method of Object.keys(exposed_imshost[api])){
      const exposed_method = exposed_imshost[api][method]
      proxied_api[method] = async (...args: unknown[]) => {
        const call_index = ++CallIndexGenerator;
        const plain_args = args.map(arg => makePlainArg(arg))
        console.log('⭐ CALL', call_index, api, method, plain_args);
        try {
          const answer = await exposed_method.apply(proxied_api, plain_args);
          console.log('✅ RESULT', call_index, answer);
          return answer;
        }
        catch(err: any){
          console.log('❌ RESULT', call_index, err.message);
          throw err;
        }
      }
    }
    proxied_imshost[api] = proxied_api;
  }
  Object.defineProperty(window, 'imshost', {
    value: proxied_imshost as unknown as IImsHostExposed,
    configurable: false
  })
}


export default defineNuxtPlugin({
  name: 'desktopStart',
  dependsOn: ['appManager'],
  async setup(app) {
    await loadProxiedImshost();
    await window.imshost.window.show();
  },
});
