export const PRELOADER_SEEN_KEY = "jc-preloader-seen";

/*
 * Decides whether the homepage preloader shows. The root layout inlines it
 * in <head>, so it runs while the HTML is parsed (before first paint, so the
 * overlay never flashes). Shows once per browser session on the
 * homepage only; skipped for reduced motion. A failsafe clears it if the
 * page's JavaScript never takes over.
 */
export const PRELOADER_BOOT_SCRIPT = `(function(){try{var d=document.documentElement;if(location.pathname!=="/")return;if(sessionStorage.getItem("${PRELOADER_SEEN_KEY}"))return;if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;sessionStorage.setItem("${PRELOADER_SEEN_KEY}","1");d.setAttribute("data-preloading","active");setTimeout(function(){d.removeAttribute("data-preloading")},6000)}catch(e){}})();`;
