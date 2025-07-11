/**
 * @template T
 * @template { keyof T } K
 * @template V
 * @param {T} obj 
 * @param {K} propertyName 
 * @param {V} defaultValue 
 * @returns {T[K] | V}
 */
export const getProperty = (obj, propertyName, defaultValue) => {
    if (obj && obj.hasOwnProperty(propertyName)) {
        return obj[propertyName];
    }
    return defaultValue;
}
