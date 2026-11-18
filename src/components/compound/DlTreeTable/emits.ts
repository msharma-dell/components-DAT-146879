import { useTableRowExpandEmits } from '../DlTable/hooks/tableRowExpand'
import { useTreeTableRowSelectionEmits } from './utils/treeTableRowSelection'

export const emits = [
    'request',
    'virtual-scroll',
    'scroll-to-bottom',
    'scroll-to-top',
    'row-reorder',
    'col-update',
    'row-click',
    'th-click',
    'row-double-click',
    'row-contextmenu',
    'update:visible-columns',
    'row-hover-start',
    'row-hover-end',
    'row-expand',
    'row-collapse',
    'infinite-scroll-load',
    ...useTableRowExpandEmits,
    ...useTreeTableRowSelectionEmits
]
