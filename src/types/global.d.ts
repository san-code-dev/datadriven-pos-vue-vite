export { }

declare global {
  type Maybe<T> = T | null | undefined

  interface Window {
    TAB_ID: string
  }
}