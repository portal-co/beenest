import {
  create,
  Global,
  IZone,
  ZoneProvider,
} from "@portal-solutions/zone2-core";
export interface Env {}
class _Env implements Env, ProxyHandler<_Env> {
  //   #implContextGetter: () => boolean;
  #requestContextGetter: () => boolean;
  #reflect: typeof Reflect;
  #proxy: _Env;
  #proxyType: typeof Proxy;
  #oldFetch: typeof fetch;
  static #selfSymbol = Symbol("self");
  //   #implContextSetter: (a: boolean) => void;
  constructor({
    requestContextGetter,
    _Proxy,
    _Reflect,
    oldFetch,
  }: // implContextGetter,
  // implContextSetter,
  {
    requestContextGetter: () => boolean;
    _Proxy: typeof Proxy;
    _Reflect: typeof Reflect;
    oldFetch: typeof fetch;
    // implContextGetter: () => boolean;
    // implContextSetter: (a: boolean) => void;
  }) {
    this.#requestContextGetter = requestContextGetter;
    this.#reflect = _Reflect;
    this.#oldFetch = oldFetch;
    Object.defineProperty(this, _Env.#selfSymbol, {
      get: () => this,
      enumerable: false,
      configurable: true,
    });
    // this.#implContextGetter = implContextGetter;
    // this.#implContextSetter = implContextSetter;

    return (this.#proxy = new (this.#proxyType = _Proxy)(this, this));
  }
  static #wrappedOf(a: _Env): _Env{
    return (a as any)[_Env.#selfSymbol];
  }
  static #proxyFor(a: _Env): _Env {
    return _Env.#wrappedOf(a).#proxy;
  }
  get(target: _Env, p: string | symbol, receiver: any) {
    if (p === _Env.#selfSymbol) return (target as any)[p];
    return _Env.#wrappedOf(target).#reflect.get(target, p, receiver);
  }
  //   get #implContext() {
  //     return this.#implContextGetter();
  //   }
  //   set #implContext(a) {
  //     this.#implContextSetter(a);
  //   }
}
const _globalThis = globalThis;
export const baseSym = Symbol.for("beenest reversion");
export function render(
  { fetch = undefined }: { fetch?: any },
  {
    cond = (u) => u.origin === location.origin,
    rewriteRequestContext = (a) => a,
    globalThis = _globalThis,
    _Proxy = Proxy,
    _Reflect = { ...Reflect },
    provider = create({ globalThis, _Proxy, _Reflect }),
    sym = (() => {
      try {
        //@ts-ignore
        if (process.env.NODE_ENV === "production") {
          return null;
        }
      } catch {}
      return baseSym;
    })(),
  }: {
    cond?: (a: URL) => boolean;
    rewriteRequestContext: (a: URL) => URL;
    _Proxy?: typeof Proxy;
    _Reflect?: typeof Reflect;
    globalThis?: Global & { fetch: typeof _globalThis.fetch };
    provider?: ZoneProvider;
    sym?: symbol | null;
  }
): { env: Env; isInRequestContext: WeakSet<IZone>; provider: ZoneProvider } {
  const { apply, get, has } = _Reflect;

  const isInRequestContext = new WeakSet();
  const requestContextGetter = () => {
    const zone = provider.current;
    return zone !== undefined && isInRequestContext.has(zone);
  };
  const oldFetch =
    sym !== null && sym in globalThis.fetch
      ?( globalThis.fetch as any)[sym]
      : globalThis.fetch;
  //   const isInImplContext = new WeakSet();
  const env = new _Env({
    requestContextGetter,
    _Proxy,
    _Reflect,
    oldFetch,
    // implContextGetter: () => {
    //     const zone = provider.current;
    //     return zone !== undefined && isInImplContext.has(zone);
    // },
  });
  const requestContext = new provider();
  isInRequestContext.add(requestContext);
  //   let implContext;
  if (typeof fetch === "function")
    globalThis.fetch = new _Proxy(oldFetch, {
      get(target, p, receiver) {
        if (p === sym) return target;
        return get(target, p, receiver);
      },
      has(target, p) {
        if (p === sym) return true;
        return has(target, p);
      },
      async apply(target, thisArg, argArray) {
        // while (lock) await new Promise(requestAnimationFrame);
        try {
          //   lock = true;
          const u = (argArray[0] = new URL(argArray[0], location.href));
          const notServiceWorker =
            !("navigator" in globalThis) ||
            (navigator.serviceWorker.controller?.state ?? "") !== "activated";
          //   if (isInImplContext.has(provider.current)) return await apply(target, thisArg, argArray);
          if (!notServiceWorker) return await apply(target, thisArg, argArray);
          const status = cond(u);
          if (status === requestContextGetter()) {
            return await apply(target, thisArg, argArray);
          }
          const [_0, args] = [...argArray];
          if (status)
            return await provider.apply(requestContext, () =>
              fetch(env, new Request(_0, ...args))
            );
          return await apply(target, thisArg, [
            rewriteRequestContext(_0),
            ...args,
          ]);
        } finally {
          //   lock = false;
        }
      },
    });
  return { env, isInRequestContext, provider };
}
