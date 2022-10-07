export function getUrl() {
  let url = window.location !== window.parent.location ? document.referrer : document.location.href;
  url = url.replace(/\/$/, "").replace("/view/home", "");

  return url;
}
