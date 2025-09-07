export function writable(value) {
  let val = value;
  const subs = new Set();
  const set = (v) => {
    val = v;
    subs.forEach((fn) => fn(val));
  };
  const subscribe = (fn) => {
    subs.add(fn);
    fn(val);
    return () => subs.delete(fn);
  };
  return { set, subscribe };
}
