import { describe, it, expect } from 'vitest'
import { normalizeDataToColumns } from '../../../src/components/compound/DlTreeTable/utils/normalizeDataToColumns'
import { DlTableColumn } from '../../../src/components/compound/DlTable/types'

describe('normalizeDataToColumns', () => {
    it('should return the same row instance when nothing needs normalizing', () => {
        const columns: DlTableColumn[] = [
            { name: 'name', field: 'name', label: 'Name' },
            { name: 'calc', field: () => 1, label: 'Calc' }
        ]
        const rows = [{ id: '1', name: 'Test' }]

        const normalized = normalizeDataToColumns(rows, columns)

        expect(normalized[0]).toBe(rows[0])
    })

    it('should normalize row data to match column field names with different casing', () => {
        const columns: DlTableColumn[] = [
            { name: 'name', field: 'name', label: 'Name' },
            { name: 'Thumbnail', field: 'Thumbnail', label: 'Thumbnail' },
            { name: 'Tools', field: 'Tools', label: 'Tools' },
            { name: 'Attributes', field: 'Attributes', label: 'Attributes' }
        ]

        const rows = [
            {
                id: '1',
                name: 'Test',
                thumbnail: '📷',
                tools: '*',
                attributes: 'attr'
            }
        ]

        const normalized = normalizeDataToColumns(rows, columns)

        expect(normalized[0].Thumbnail).toBe('📷')
        expect(normalized[0].Tools).toBe('*')
        expect(normalized[0].Attributes).toBe('attr')
        expect(normalized[0].name).toBe('Test')
    })

    it('should not modify rows that already have matching field names', () => {
        const columns: DlTableColumn[] = [
            { name: 'name', field: 'name', label: 'Name' },
            { name: 'Thumbnail', field: 'Thumbnail', label: 'Thumbnail' }
        ]

        const rows = [
            {
                id: '1',
                name: 'Test',
                Thumbnail: '📷'
            }
        ]

        const normalized = normalizeDataToColumns(rows, columns)

        expect(normalized[0].name).toBe('Test')
        expect(normalized[0].Thumbnail).toBe('📷')
    })

    it('should handle empty columns array', () => {
        const rows = [{ id: '1', name: 'Test', thumbnail: '📷' }]

        const normalized = normalizeDataToColumns(rows, [])

        expect(normalized).toEqual(rows)
    })

    it('should handle empty rows array', () => {
        const columns: DlTableColumn[] = [
            { name: 'name', field: 'name', label: 'Name' }
        ]

        const normalized = normalizeDataToColumns([], columns)

        expect(normalized).toEqual([])
    })

    it('should preserve all original row properties', () => {
        const columns: DlTableColumn[] = [
            { name: 'name', field: 'name', label: 'Name' },
            { name: 'Thumbnail', field: 'Thumbnail', label: 'Thumbnail' }
        ]

        const rows = [
            {
                id: '1',
                name: 'Test',
                thumbnail: '📷',
                extraProp: 'should be preserved'
            }
        ]

        const normalized = normalizeDataToColumns(rows, columns)

        expect(normalized[0].id).toBe('1')
        expect(normalized[0].extraProp).toBe('should be preserved')
        expect(normalized[0].Thumbnail).toBe('📷')
    })
})
