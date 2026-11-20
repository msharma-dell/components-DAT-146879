import { DlTableRow } from '../../DlTable/types'

export interface FlattenedRow extends DlTableRow {
    level: number
    parentId?: string
    isVisible: boolean
}

/**
 * Flattens a tree structure into a flat array for virtual scroll
 * Only includes visible rows (expanded parents and their children)
 */
export function flattenTree(
    rows: DlTableRow[],
    level: number = 1,
    parentId?: string
): FlattenedRow[] {
    const result: FlattenedRow[] = []

    for (const row of rows) {
        const flattenedRow: FlattenedRow = {
            ...row,
            level,
            parentId,
            isVisible: true
        }

        Object.defineProperty(flattenedRow, '__source', {
            value: (row as any).__source ?? row,
            enumerable: false
        })

        result.push(flattenedRow)

        // If row has children and is expanded, recursively flatten them
        if (row.children && row.children.length > 0 && row.isExpanded) {
            const children = flattenTree(row.children, level + 1, row.id)
            result.push(...children)
        }
    }

    return result
}

/**
 * Updates the flattened tree when a row's expansion state changes
 */
export function updateFlattenedTree(
    rows: DlTableRow[],
    rowId: string,
    isExpanded: boolean
): DlTableRow[] {
    const updateRow = (rowList: DlTableRow[]): boolean => {
        for (const row of rowList) {
            if (row.id === rowId) {
                row.isExpanded = isExpanded
                return true
            }
            if (row.children && row.children.length > 0) {
                if (updateRow(row.children)) {
                    return true
                }
            }
        }
        return false
    }

    updateRow(rows)
    return rows
}
