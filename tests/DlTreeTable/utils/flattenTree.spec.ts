import { describe, it, expect } from 'vitest'
import {
    flattenTree,
    updateFlattenedTree
} from '../../../src/components/compound/DlTreeTable/utils/flattenTree'
import { DlTableRow } from '../../../src/components/compound/DlTable/types'

describe('flattenTree', () => {
    it('should keep a hidden reference to the original row', () => {
        const child = { id: '1-1', name: 'Child', isExpanded: false }
        const parent: DlTableRow = {
            id: '1',
            name: 'Parent',
            isExpanded: true,
            children: [child]
        }

        const [flatParent, flatChild] = flattenTree([parent])

        expect((flatParent as any).__source).toBe(parent)
        expect((flatChild as any).__source).toBe(child)
        expect(Object.keys(flatParent)).not.toContain('__source')
    })

    it('should flatten a simple tree structure', () => {
        const rows: DlTableRow[] = [
            {
                id: '1',
                name: 'Parent 1',
                isExpanded: true,
                children: [
                    { id: '1-1', name: 'Child 1', isExpanded: false },
                    { id: '1-2', name: 'Child 2', isExpanded: false }
                ]
            },
            {
                id: '2',
                name: 'Parent 2',
                isExpanded: false,
                children: [{ id: '2-1', name: 'Child 3', isExpanded: false }]
            }
        ]

        const flattened = flattenTree(rows)

        expect(flattened).toHaveLength(4) // Parent 1 + 2 children + Parent 2 (collapsed parent included, but not its children)
        expect(flattened[0].id).toBe('1')
        expect(flattened[0].level).toBe(1)
        expect(flattened[1].id).toBe('1-1')
        expect(flattened[1].level).toBe(2)
        expect(flattened[2].id).toBe('1-2')
        expect(flattened[2].level).toBe(2)
        expect(flattened[3].id).toBe('2')
        expect(flattened[3].level).toBe(1)
    })

    it('should not include children of collapsed rows', () => {
        const rows: DlTableRow[] = [
            {
                id: '1',
                name: 'Parent 1',
                isExpanded: false,
                children: [{ id: '1-1', name: 'Child 1', isExpanded: false }]
            }
        ]

        const flattened = flattenTree(rows)

        expect(flattened).toHaveLength(1)
        expect(flattened[0].id).toBe('1')
    })

    it('should handle nested children', () => {
        const rows: DlTableRow[] = [
            {
                id: '1',
                name: 'Parent 1',
                isExpanded: true,
                children: [
                    {
                        id: '1-1',
                        name: 'Child 1',
                        isExpanded: true,
                        children: [
                            {
                                id: '1-1-1',
                                name: 'Grandchild 1',
                                isExpanded: false
                            }
                        ]
                    }
                ]
            }
        ]

        const flattened = flattenTree(rows)

        expect(flattened).toHaveLength(3)
        expect(flattened[0].level).toBe(1)
        expect(flattened[1].level).toBe(2)
        expect(flattened[2].level).toBe(3)
    })

    it('should handle empty tree', () => {
        const rows: DlTableRow[] = []
        const flattened = flattenTree(rows)

        expect(flattened).toHaveLength(0)
    })

    it('should handle rows without children', () => {
        const rows: DlTableRow[] = [
            { id: '1', name: 'Row 1', isExpanded: false },
            { id: '2', name: 'Row 2', isExpanded: false }
        ]

        const flattened = flattenTree(rows)

        expect(flattened).toHaveLength(2)
        expect(flattened[0].id).toBe('1')
        expect(flattened[1].id).toBe('2')
    })
})

describe('updateFlattenedTree', () => {
    it('should update expansion state of a row', () => {
        const rows: DlTableRow[] = [
            {
                id: '1',
                name: 'Parent 1',
                isExpanded: false,
                children: [{ id: '1-1', name: 'Child 1', isExpanded: false }]
            }
        ]

        const updated = updateFlattenedTree(rows, '1', true)

        expect(updated[0].isExpanded).toBe(true)
    })

    it('should update nested row expansion state', () => {
        const rows: DlTableRow[] = [
            {
                id: '1',
                name: 'Parent 1',
                isExpanded: true,
                children: [
                    {
                        id: '1-1',
                        name: 'Child 1',
                        isExpanded: false,
                        children: [
                            {
                                id: '1-1-1',
                                name: 'Grandchild 1',
                                isExpanded: false
                            }
                        ]
                    }
                ]
            }
        ]

        const updated = updateFlattenedTree(rows, '1-1', true)

        expect(updated[0]?.children?.[0]?.isExpanded).toBe(true)
    })
})
