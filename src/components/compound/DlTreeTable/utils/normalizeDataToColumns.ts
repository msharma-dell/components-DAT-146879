import { DlTableColumn, DlTableRow } from '../../DlTable/types'

/**
 * Normalizes row data to match column field names.
 * This ensures that the data fields match what the columns expect.
 *
 * @param rows - The table rows to normalize
 * @param columns - The column definitions to match against
 * @returns Normalized rows with matching field names
 */
export function normalizeDataToColumns(
    rows: DlTableRow[],
    columns: DlTableColumn[]
): DlTableRow[] {
    if (!columns || columns.length === 0) {
        return rows
    }

    return rows.map((row) => {
        const normalizedRow: DlTableRow = { ...row }
        let changed = false

        columns.forEach((col) => {
            const fieldName =
                typeof col.field === 'string' ? col.field : col.name
            if (!fieldName) return

            // If the field doesn't exist in the row, try to find a matching field
            // with different casing (e.g., 'thumbnail' vs 'Thumbnail')
            if (!(fieldName in normalizedRow)) {
                const possibleMatch = Object.keys(row).find(
                    (key) => key.toLowerCase() === fieldName.toLowerCase()
                )

                if (possibleMatch) {
                    normalizedRow[fieldName] = row[possibleMatch]
                    changed = true
                }
            }
        })

        if (changed && (row as any).__source) {
            Object.defineProperty(normalizedRow, '__source', {
                value: (row as any).__source,
                enumerable: false
            })
        }

        return changed ? normalizedRow : row
    })
}
