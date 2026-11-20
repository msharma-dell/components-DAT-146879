import { useTableRowExpandEmits } from '../hooks/tableRowExpand'
import { useTableRowSelectionEmits } from '../hooks/tableRowSelection'

export const emits = [
    'request',
    'virtual-scroll',
    'row-reorder',
    'col-reorder',
    'row-click',
    'tree-toggle-expand',
    'row-hover-start',
    'row-hover-end',
    'th-click',
    'row-dblclick',
    'row-contextmenu',
    'update:pagination',
    'scroll-to-bottom',
    'scroll-to-top',
    ...useTableRowExpandEmits,
    ...useTableRowSelectionEmits
]
