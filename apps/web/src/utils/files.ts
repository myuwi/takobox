export const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 bytes";

  const k = 1000;
  const decimals = bytes > k ? 1 : 0;

  const magnitude = Math.floor(Math.log(bytes) / Math.log(k));
  const result = (bytes / k ** magnitude).toFixed(decimals);
  const suffix = ["bytes", "kB", "MB", "GB", "TB"][magnitude];
  return `${result} ${suffix}`;
};
