export const openApp = ({ url, params }) => {
  if (url) {
    const newParams = new URLSearchParams(params);
    window.location = `${url}?${newParams.toString()}`;
  } else {
    console.error('url 错误');
  }
}


export const getSearchParams = (name) => {
  const params = new URLSearchParams(decodeURI(window.location.search));
  const obj = {};
  const keys = [...params.keys()];
  keys.forEach(key => {
    obj[key] = params.get(key);
  })
  return !name ? obj : params.get(name);
}