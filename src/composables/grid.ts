import type { Ref } from 'vue'

const getGrid = (gridRef: Ref) => {
    if (!gridRef || !gridRef.value) return null
    return gridRef.value.$el || gridRef.value
}

export const gridSelectSingleCell = async (
    gridRef: Ref,
    { rowIndex, colIndex }: { rowIndex: number; colIndex: number }
) => {
    const grid = await getGrid(gridRef)
    await grid?.setCellsFocus?.({ x: colIndex, y: rowIndex }, { x: colIndex, y: rowIndex })
}

export const gridFocus = async (gridRef: Ref) => {
    const grid = await getGrid(gridRef)
    await grid?.focus?.()
}

export const getActiveCellState = async (gridRef: Ref) => {
    const grid = getGrid(gridRef)
    if (!grid) {
        console.error('Grid reference is not available.')
        return null
    }


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
        console.error('Failed to get active cell state from the grid.')
        return null
    }
}