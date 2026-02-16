
import type { IImsHostExposed, ImsHostWrapAbortSignal, ImsHostWrapCallback, ImsHostWrapObject } from '#bridge/types/IImsHost';


export async function initImsHostClient(){
  await window.loadImshost();

  let CallIndexGenerator = 0;
  let CallbackIdGenerator = 0;

  function makePlainArg(arg: unknown, cancels: (() => void)[]): any{
    switch (typeof arg){
      case 'boolean':
      case 'number':
      case 'string':
        return arg;
      case 'function':
        {
          const callback = arg;
          const callbackId = ++CallbackIdGenerator;
          const callbackCancel = window.imshostOnCallbackCall(callbackId, (...args) => {
            return callback(...args)
          })
          cancels.push(callbackCancel)
          return {
            'imshost@type': 'callback',
            id: callbackId
          } as ImsHostWrapCallback
        }
        break;
      case 'object':
        if (!arg) return null;
        if (Array.isArray(arg)){
          return arg.map(a => makePlainArg(a, cancels));
        }
        if (arg instanceof Uint8Array){
          return arg;
        }
        else if (arg instanceof AbortSignal){
          const abortId = ++CallbackIdGenerator;
          arg.onabort = (ev) => {
            window.imshostSendEvent(abortId, {
              reason: arg.reason
            })
          }
          return {
            "imshost@type": 'AbortSignal',
            id: abortId,
            reason: arg.reason,
            aborted: arg.aborted,
          } as ImsHostWrapAbortSignal
        }
        else if ((arg as ImsHostWrapObject)['imshost@type']){
          return {
            'imshost@type': 'object',
            content: arg
          } as ImsHostWrapObject
        }
        const transform: (entry: [string, unknown]) => [string, any] = entry =>  {
          return [entry[0], makePlainArg(entry[1], cancels)];
        }
        return Object.fromEntries(Object.entries(arg).map(transform))
      default:
        return null
    
    }
  }

  const exposed_imshost = (window as any).imshostRaw as Record<string, Record<string, Function>>;
  const proxied_imshost: Record<string, Record<string, Function>> = {}
  for (const api of Object.keys(exposed_imshost)){
    let proxied_api: Record<string, Function> = {};
    for (const method of Object.keys(exposed_imshost[api])){
      const exposed_method = exposed_imshost[api][method]
      proxied_api[method] = async (...args: unknown[]) => {
        const call_index = ++CallIndexGenerator;

        const cancels: (() => void)[] = []
        const plain_args = args.map(arg => makePlainArg(arg, cancels))
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
        finally {
          for (const cancel of cancels){
            cancel();
          }
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