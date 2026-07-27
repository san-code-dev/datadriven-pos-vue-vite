import type { Ref } from 'vue'

// 1. getGrid TETAP SYNCHRONOUS (Tanpa async/await, biar ga perlu ubah tempat lain)
export const getGrid = (gridRef: Ref) => {
    if (!gridRef || !gridRef.value) return null
    return gridRef.value.$el || gridRef.value
}

// 2. Fungsi action yang SUDAH ASYNC tinggal kita tambahkan componentOnReady()
export const gridSelectsetSelectedFocusedCell = async (
    gridRef: Ref,
    { rowIndex, colIndex }: { rowIndex: number; colIndex: number }
) => {
    const grid = getGrid(gridRef)
    if (!grid) return

    // Tunggu grid siap di sini (karena fungsi ini sudah async!)
    if (typeof grid.componentOnReady === 'function') {
        await grid.componentOnReady()
    }

    // Panggil method resmi RevoGrid
    if (typeof grid.setCellFocus === 'function') {
        await grid.setCellFocus(colIndex, rowIndex)
    }
}

export const getActiveCellState = async (gridRef: Ref) => {
    const grid = getGrid(gridRef)
    if (!grid) return null

    if (typeof grid.componentOnReady === 'function') {
        await grid.componentOnReady()
    }

    if (typeof grid.getFocused !== 'function') return null

    try {
        const focused = await grid.getFocused()
        if (!focused?.cell) return null

        return {
            x: focused.cell.x,
            y: focused.cell.y,
            column: focused.column || {},
            model: focused.model || {}
        }
    } catch {
        return null
    }
}