import { ref } from 'vue'

export function useInfiniteScroll(fetchCallback, options = {}) {
  // initialStep: berapa banyak data per fetch
  // threshold: jarak (px) dari bawah untuk trigger fetch data baru
  const { initialStep = 50, threshold = 100 } = options

  const items = ref([])
  const skip = ref(0)
  const step = ref(initialStep)
  const isLoading = ref(false)
  const hasMore = ref(true)
  const error = ref(null)

  const loadMore = async (reset = false) => {
    // Jangan fetch jika sedang loading atau data sudah habis (kecuali reset)
    if (isLoading.value || (!hasMore.value && !reset)) return

    if (reset) {
      skip.value = 0
      hasMore.value = true
      items.value = []
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await fetchCallback({
        skip: skip.value,
        step: step.value
      })

      const newData = response.data || []

      // Gabungkan data
      items.value = reset ? newData : [...items.value, ...newData]

      // Jika data yang diterima kurang dari step, berarti sudah habis di database
      if (newData.length < step.value) {
        hasMore.value = false
      }

      // Update skip untuk fetch berikutnya
      skip.value += step.value

    } catch (err) {
      error.value = err
      console.error("Infinite Scroll Error:", err)
    } finally {
      isLoading.value = false
    }
  }

  // Fungsi untuk dipasang di event scroll
  const handleScrollEvent = (e) => {
    const target = e.target
    if (!target) return

    // Hitung jarak ke bawah
    const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight

    if (scrollBottom < threshold) {
      loadMore()
    }
  }

  const reset = () => loadMore(true)

  return {
    items,
    isLoading,
    hasMore,
    error,
    loadMore,
    handleScrollEvent,
    reset,
    skip,
    step
  }
}