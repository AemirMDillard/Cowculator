const userCacheKeys = ['cowculator-swaps', 'cowculator-answers']

export function clearUserCache() {
  for (const key of userCacheKeys) {
    try {
      window.localStorage.removeItem(key)
    } catch (error) {
      console.error(`Unable to clear ${key} from browser storage.`, error)
    }
  }
}
