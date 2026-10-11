// Copy only the allowed keys from a request body (prevents clients from setting fields like _id or savedAmount).
module.exports = (source, keys) =>
  keys.reduce((out, key) => {
    if (source && source[key] !== undefined) out[key] = source[key];
    return out;
  }, {});
