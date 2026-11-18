<script lang="ts">
import {
    computed,
    ComputedRef,
    defineComponent,
    isVue2,
    set,
    ref,
    VNode,
    watch,
    PropType,
    toRefs,
    onMounted,
    onBeforeUnmount
} from 'vue-demi'
import { DlCheckbox } from '../../essential'
import { DlEmptyState } from '../../basic'
import DlTable from '../DlTable/DlTable.vue'
import DlTrTreeView from './views/DlTrTreeView.vue'
import { DlTableColumn, DlTableProps, DlTableRow } from '../DlTable/types'
import type { TablePagination } from '../DlTable/hooks/tablePagination'

import { useTreeTableRowSelection } from './utils/treeTableRowSelection'
import { useNestedTableFilter } from './hooks/nestedTableFilter'
import { getFromChildren } from './utils/getFromChildren'
import { emits } from './emits'
import Sortable from '../DlTable/components/SortableJS.vue'
import { renderComponent } from '../../../utils/render-fn'
import { isEmpty } from 'lodash'
import SortableJs from 'sortablejs'
import { v4 } from 'uuid'
import { moveNestedRow } from './utils/moveNestedRow'
import { getElementAbove } from '../../../utils'
import { SortingMovement } from '../DlTable/types'
import { getContainerClass } from '../DlTable/utils/tableClasses'
import { DlEmptyStateProps } from '../../types'
import { useTableActionsProps } from '../DlTable/hooks/tableActions'
import { commonVirtScrollProps } from '../../shared/DlVirtualScroll/useVirtualScroll'
import { useTableRowExpandProps } from '../DlTable/hooks/tableRowExpand'
import { useTablePaginationProps } from '../DlTable/hooks/tablePagination'
import { useTableFilterProps } from '../DlTable/hooks/tableFilter'
import { useTableSortProps } from '../DlTable/hooks/tableSort'
import { useTableColumnSelectionProps } from '../DlTable/hooks/tableColumnSelection'
import { useTableRowSelectionProps } from '../DlTable/hooks/tableRowSelection'
import { RowExpandEventData } from './types'

let prevMouseY = 0

export default defineComponent({
    name: 'DlTreeTable',
    components: {
        DlTable,
        DlTrTreeView,
        DlCheckbox,
        Sortable,
        DlEmptyState
    },
    props: {
        /**
         * Array of DlTableColumn objects
         */
        columns: { type: Array, default: () => [] as Record<string, any>[] },
        /**
         * Array of DlTableRow objects
         */
        rows: {
            type: Array,
            default: () => [] as Record<string, any>[]
        },
        /**
         * Specify which key will identify each row
         */
        rowKey: {
            type: [String, Function],
            default: 'id'
        },
        /**
         * Surrounded by a border
         */
        bordered: Boolean,
        /**
         * Borders inside the table: horizontal, vertical, cell or none
         */
        separator: {
            type: String,
            default: 'horizontal',
            validator: (v: string) =>
                ['horizontal', 'vertical', 'cell', 'none'].includes(v)
        },
        /**
         * Type of the draggable functionality: rows, columns or both
         */
        draggable: {
            type: String,
            default: 'none',
            validator: (v: string) =>
                ['rows', 'columns', 'none', 'both'].includes(v)
        },
        /**
         * Title to be displayed next to the table
         */
        title: { type: String, default: '' },
        /**
         * Text color
         */
        color: {
            type: String,
            default: 'dl-color-darker'
        },
        /**
         * Show a loading animation on the table
         */
        loading: {
            type: Boolean,
            default: false
        },
        /**
         *  Cells shrinks in size
         */
        dense: {
            type: Boolean,
            default: false
        },
        /**
         * Resizable columns
         */
        resizable: {
            type: Boolean,
            default: false
        },
        /**
         * Don't show the "No data" message
         */
        hideNoData: {
            type: Boolean,
            default: false
        },
        /**
         * Don't show the header
         */
        hideHeader: {
            type: Boolean,
            default: false
        },
        /**
         * Don't show the footer
         */
        hideBottom: {
            type: Boolean,
            default: false
        },
        /**
         * Enable virtual scroll
         */
        virtualScroll: {
            type: Boolean,
            default: false
        },
        /**
         * Enable infinite scroll for the table. When true, pagination is disabled and all rows are rendered with scroll-based loading.
         */
        infiniteScroll: {
            type: Boolean,
            default: false
        },
        /**
         * Pagination object to control table pagination
         */
        pagination: {
            type: Object as PropType<TablePagination>,
            default: null
        },
        /**
         * Hide table pagination
         */
        hidePagination: {
            type: Boolean,
            default: false
        },
        /**
         * Hide selected banner
         */
        hideSelectedBanner: {
            type: Boolean,
            default: false
        },
        /**
         * identifier As Tooltip form row object
         */
        identifierAsTooltip: {
            type: Boolean,
            default: false
        },
        /**
         * Function to generate the label visible when selecting rows
         */
        selectedRowsLabel: {
            type: Function,
            default: (val: number) => `${val} records selected`
        },
        /**
         * Label visible when loading is active
         */
        loadingLabel: {
            type: String,
            default: 'Loading...'
        },
        /**
         * Label visible when there are no results
         */
        noResultsLabel: {
            type: String,
            default: 'There are no results to display'
        },
        /**
         * Label visible when data is empty
         */
        noDataLabel: {
            type: String,
            default: 'No data available'
        },
        /**
         * Virtual scroll target %%%%
         */
        virtualScrollTarget: {
            type: Object as PropType<HTMLElement>,
            default: null as unknown as PropType<HTMLElement>
        },
        /**
         *  CSS class for the title
         */
        titleClass: {
            type: [String, Array, Object],
            default: null as unknown as PropType<any[]>
        },
        /**
         * Styles to be applied to the table container
         */
        tableStyle: {
            type: [String, Array, Object],
            default: null as unknown as PropType<any[]>
        },
        /**
         * Will add another column with a button opening a menu which lets the user choose the visible columns
         */
        visibleColumns: {
            type: Array as PropType<DlTableColumn[]>,
            default: (): [] => []
        },
        /**
         * CSS class for the table container
         */
        tableClass: {
            type: [String, Array, Object],
            default: null as unknown as PropType<any[]>
        },
        /**
         * Styles to be applies to the table header
         */
        tableHeaderStyle: {
            type: [String, Array, Object],
            default: null as unknown as PropType<any[]>
        },
        /**
         * CSS class for the table header
         */
        tableHeaderClass: {
            type: [String, Array, Object],
            default: null as unknown as PropType<any[]>
        },
        menuClass: {
            type: [String, Array, Object],
            default: null as unknown as PropType<any[]>
        },
        noHover: Boolean,
        /**
         * Indicates the data is empty
         */
        isEmpty: Boolean,
        /**
         * Props for the empty state component
         */
        emptyStateProps: {
            type: Object as PropType<DlEmptyStateProps>,
            default: () =>
                ({
                    title: '',
                    subtitle: 'No data to show yet',
                    icon: 'icon-dl-dataset-filled'
                } as unknown as PropType<DlEmptyStateProps>)
        },
        /**
         * Custom icon class to use for expanded rows.
         */
        customIconExpandedRow: {
            type: String,
            default: 'icon-dl-down-chevron'
        },
        /**
         * Custom icon class to use for compressed (collapsed) rows.
         */
        customIconCompressedRow: {
            type: String,
            default: 'icon-dl-right-chevron'
        },
        /**
         * color of the chevron icon
         */
        chevronIconColor: {
            type: String,
            default: ''
        },
        /**
         * identifier (rowKey) to highlight a row.
         */
        highlightedRow: {
            type: String,
            default: ''
        },
        /**
         * Disable child checkbox when parent is selected
         */
        disableChildCheckbox: {
            type: Boolean,
            default: false
        },
        /**
         * Tooltip text for disabled child checkbox
         */
        childDisabledCheckboxTooltip: {
            type: String,
            default: 'Cannot unselect child when parent is selected'
        },
        /**
         * Enforce restrictions that prevent parents from being dragged to child levels
         * and children from being dragged to parent levels
         */
        enforceParentChildRestrictions: {
            type: Boolean,
            default: true
        },
        /**
         * Enforce restrictions that prevent children from being dragged between different parents
         */
        enforceSameParentRestrictions: {
            type: Boolean,
            default: true
        },
        ...useTableActionsProps,
        ...commonVirtScrollProps,
        ...useTableRowExpandProps,
        ...useTablePaginationProps,
        ...useTableFilterProps,
        ...useTableSortProps,
        ...useTableColumnSelectionProps,
        ...useTableRowSelectionProps
    },
    emits,
    setup(props, { emit, slots }) {
        const dlTableRef = ref(null)
        const selectedData = ref<DlTableRow[]>([])
        const borderState = ref([])
        const denseState = ref([])
        const resizableState = ref([])
        const hasFlatTreeData = true
        const draggedRow = ref<DlTableRow | null>(null)
        const targetRow = ref<DlTableRow | null>(null)
        const storedValidTarget = ref<DlTableRow | null>(null)

        const vue2h = ref()
        const manish = 'Sharma1'
        console.log(manish)
        const sortingMovement = ref<SortingMovement>({
            lastId: null,
            direction: 'up'
        })

        // Debug log for infiniteScroll prop changes
        watch(
            () => props.infiniteScroll,
            (value) => {
                console.log('[DlTreeTable] infiniteScroll prop:', value)
            }
        )

        // Debug log when rows prop changes
        watch(
            () => props.rows,
            (value) => {
                console.log(
                    '[DlTreeTable] rows prop changed, count:',
                    value?.length,
                    'hasNested:',
                    hasFlatTreeData
                )
            }
        )

        const uuid = `dl-tree-table-${v4()}`

        const mainTbodyUuid = `dl-tree-table-tbody-${v4()}`

        const mainTableKey = ref(v4())

        const { rows: tableRows, columns: tableColumns } = toRefs(props)

        const isDataEmpty = computed(() => !props.rows.length)

        const hasEmptyStateProps = computed(() =>
            props.emptyStateProps
                ? Object.keys(props.emptyStateProps).length > 0
                : false
        )

        const computedRows = computed(() => {
            return dlTableRef.value?.computedRows || []
        })

        const tableRootRef = computed(() => {
            return dlTableRef.value || {}
        })

        const getRowKey = computed(() =>
            typeof props.rowKey === 'function'
                ? props.rowKey
                : (row: Record<string, any>) =>
                      row[props.rowKey as string] ?? ''
        )

        const hasDraggableRows = computed(() =>
            ['rows', 'both'].includes(props.draggable)
        )

        const {
            hasSelectionMode,
            singleSelection,
            multipleSelection,
            allRowsSelected,
            someRowsSelected,
            rowsSelectedNumber,

            isRowSelected,
            clearSelection,
            updateSelection,
            selectAllRows
        } = useTreeTableRowSelection(
            props as unknown as DlTableProps,
            emit,
            tableRows as ComputedRef<DlTableRow[]>,
            getRowKey as ComputedRef<(val: string | DlTableRow) => any>
        )

        const { filteredRows } = useNestedTableFilter(
            tableRows.value,
            (row) => {
                let filter = props.filter ?? ''
                if (typeof filter === 'string') {
                    filter = filter.toLowerCase()
                }

                // todo: row is not always defined. which will cause the filter not to work.
                return row.name?.toLowerCase?.().includes(filter)
            }
        )

        const computedFilter: any = computed<DlTableRow[]>(() => {
            const result =
                props.filter && filteredRows.value.length
                    ? filteredRows.value
                    : tableRows.value
            console.log(
                '[DlTreeTable] computedFilter (data passed to DlTable):',
                result
            )
            console.log('[DlTreeTable] props.pagination:', props.pagination)
            console.log(
                '[DlTreeTable] props.infiniteScroll:',
                props.infiniteScroll
            )
            console.log(
                '[DlTreeTable] props.rowsPerPageOptions:',
                props.rowsPerPageOptions
            )
            return result
        })

        // Track sliding window for infinite scroll with buffers
        const windowStartRow = ref(0)
        const windowSize = ref(0)
        const estimatedRowHeight = ref(40) // estimated row height in pixels

        // When infiniteScroll is enabled, apply sliding window to computedFilter
        // because DlTreeTable provides a custom tbody which disables DlTable's virtual scroll
        const paginatedFilter = computed<DlTableRow[]>(() => {
            if (!props.infiniteScroll || !props.pagination) {
                return computedFilter.value
            }
            const pagination = props.pagination as any
            const rowsPerPage = pagination?.rowsPerPage ?? 0
            if (rowsPerPage === 0) {
                return computedFilter.value
            }
            // Initialize window size to 3x rowsPerPage (visible + buffers)
            if (windowSize.value === 0) {
                windowSize.value = rowsPerPage * 3
            }
            console.log(
                '[DlTreeTable] Applying sliding window - startRow:',
                windowStartRow.value,
                'windowSize:',
                windowSize.value
            )
            const endRow = windowStartRow.value + windowSize.value
            return computedFilter.value.slice(windowStartRow.value, endRow)
        })

        // Calculate spacer heights for scroll position preservation
        const topSpacerHeight = computed(() => {
            if (!props.infiniteScroll || !props.pagination) return 0
            return windowStartRow.value * estimatedRowHeight.value
        })

        const bottomSpacerHeight = computed(() => {
            if (!props.infiniteScroll || !props.pagination) return 0
            const totalRows = computedFilter.value.length
            const renderedRows = windowStartRow.value + windowSize.value
            const remainingRows = Math.max(0, totalRows - renderedRows)
            return remainingRows * estimatedRowHeight.value
        })

        // Handle scroll event with buffer-based loading
        const handleScroll = (e: Event) => {
            if (!props.infiniteScroll || !props.pagination) return

            const target = e.target as HTMLElement
            const { scrollTop, scrollHeight, clientHeight } = target
            const pagination = props.pagination as any
            const rowsPerPage = pagination?.rowsPerPage ?? 30
            const bufferRows = rowsPerPage // buffer size

            // Calculate visible row range
            const firstVisibleRow = Math.floor(
                scrollTop / estimatedRowHeight.value
            )
            const lastVisibleRow =
                firstVisibleRow +
                Math.ceil(clientHeight / estimatedRowHeight.value)

            console.log(
                '[DlTreeTable] Scroll - scrollTop:',
                scrollTop,
                'firstVisible:',
                firstVisibleRow,
                'lastVisible:',
                lastVisibleRow,
                'windowStart:',
                windowStartRow.value,
                'windowEnd:',
                windowStartRow.value + windowSize.value
            )

            // Load more when approaching bottom of current window (buffer-based)
            const rowsUntilBottom =
                windowStartRow.value + windowSize.value - lastVisibleRow
            if (
                rowsUntilBottom < bufferRows &&
                windowStartRow.value + windowSize.value <
                    computedFilter.value.length
            ) {
                console.log(
                    '[DlTreeTable] Buffer prefetch triggered - rowsUntilBottom:',
                    rowsUntilBottom
                )
                // Shift window down by rowsPerPage to maintain buffer
                windowStartRow.value += rowsPerPage
                console.log(
                    '[DlTreeTable] Window shifted down by',
                    rowsPerPage,
                    'rows, new start:',
                    windowStartRow.value
                )
            }

            // Shift window up when scrolling near top
            const rowsFromTop = firstVisibleRow - windowStartRow.value
            if (rowsFromTop < bufferRows && windowStartRow.value > 0) {
                console.log(
                    '[DlTreeTable] Scroll near top - rowsFromTop:',
                    rowsFromTop
                )
                const shiftAmount = Math.min(rowsPerPage, windowStartRow.value)
                windowStartRow.value -= shiftAmount
                console.log(
                    '[DlTreeTable] Window shifted up by',
                    shiftAmount,
                    'rows, new start:',
                    windowStartRow.value
                )
            }
        }

        // Legacy handlers for compatibility
        const handleScrollToBottom = () => {
            // Scroll is now handled by handleScroll with buffer-based loading
        }

        const handleScrollToTop = () => {
            windowStartRow.value = 0
        }

        // Reset windowStartRow when data changes
        watch(
            () => props.rows,
            () => {
                console.log(
                    '[DlTreeTable] props.rows changed, resetting windowStartRow'
                )
                windowStartRow.value = 0
            }
        )

        // Debug: watch windowStartRow changes
        watch(windowStartRow, (newVal, oldVal) => {
            console.log(
                '[DlTreeTable] windowStartRow changed from',
                oldVal,
                'to',
                newVal
            )
        })

        const updateExpandedRow = (
            isExpanded: boolean,
            name: string,
            rowsArr: DlTableRow[] = tableRows.value
        ) => {
            for (const row of rowsArr) {
                if (getRowKey.value(row) === name) {
                    if (isVue2) {
                        set(row, 'isExpanded', isExpanded)
                    } else {
                        row.isExpanded = isExpanded
                    }
                    updateNestedRows(row, isExpanded)

                    const eventData: RowExpandEventData = {
                        row,
                        rowKey: getRowKey.value(row),
                        isExpanded,
                        level: row.level || 1,
                        hasChildren: (row.children || []).length > 0
                    }

                    if (isExpanded) {
                        emit('row-expand', eventData)
                    } else {
                        emit('row-collapse', eventData)
                    }

                    break
                } else {
                    if ((row.children || []).length > 0) {
                        updateExpandedRow(isExpanded, name, row.children)
                    }
                }
            }
        }
        const updateNestedRows = (
            row: (typeof computedRows.value)[number],
            isExpanded: boolean
        ) => {
            if (!row.children) {
                return
            }

            for (const r of row.children) {
                if (isVue2) {
                    set(r, 'isExpanded', isExpanded)
                } else {
                    r.isExpanded = isExpanded
                }

                if (!isExpanded) {
                    if (isVue2) {
                        set(r, 'isExpanded', isExpanded)
                    } else {
                        r.isExpanded = isExpanded
                    }
                    updateNestedRows(r, isExpanded)
                }
            }
        }

        const clearSelectionWithRerender = () => {
            clearSelection()
            mainTableKey.value = v4()
        }

        const updateSelectionHierarchy = (
            adding: boolean,
            event: any,
            row: any
        ) => {
            const { childrenKeys, childrenCollection } = getFromChildren(
                row,
                props.rowKey
            )

            selectedData.value = updateSelection(
                childrenKeys,
                childrenCollection,
                adding,
                event
            )
        }
        const headerSelectedValue = computed(() => {
            if (selectedData.value.length === tableRows.value.length)
                return true

            if (
                selectedData.value.length > 0 &&
                selectedData.value.length !== tableRows.value.length
            )
                return null

            return false
        })

        const onMultipleSelectionSet = (val: boolean) => {
            const value =
                selectedData.value.length > 0 &&
                selectedData.value.length === tableRows.value.length
                    ? false
                    : val

            updateSelected(value ? tableRows.value : [])
        }
        const updateSelected = (payload: DlTableRow[]) => {
            selectedData.value = selectAllRows(!allRowsSelected.value)
        }
        const emitSelectedItems = (payload: DlTableRow[]) => {
            emit('selected-items', payload)
        }
        const emitRowClick = (...payload: any) => {
            emit('row-click', ...payload)
        }
        const emitRowDblclick = (...payload: any) => {
            emit('row-dblclic', ...payload)
        }
        const emitThClick = (payload: any) => {
            emit('th-click', payload)
        }

        const emitRowExpand = (eventData: RowExpandEventData) => {
            emit('row-expand', eventData)
        }

        const emitRowCollapse = (eventData: RowExpandEventData) => {
            emit('row-collapse', eventData)
        }

        const hasSlotByName = (name: string) => !!slots[name]

        const getSlotByName = (name: string) => {
            if (hasSlotByName(`body-cell-${name}`)) {
                return `body-cell-${name}`
            }
        }

        const tbodySlotsData = computed(() =>
            (dlTableRef.value?.computedCols || []).filter(
                (item: DlTableColumn) => hasSlotByName(`body-cell-${item.name}`)
            )
        )

        const containerClass = computed(() => {
            const { separator, bordered, dense, loading } = props
            return getContainerClass(separator, bordered, dense, loading)
        })

        const computedCellSlots = computed(() => {
            const obj: any = {}
            tbodySlotsData.value.forEach((item: DlTableColumn) => {
                const slot = slots[`body-cell-${item.name}`]
                obj[`body-cell-${item.name}`] = slot
            })
            return obj
        })

        const renderDlTrTree = (
            row: DlTableRow,
            index: number,
            children: DlTableRow[] = [],
            level: number = 1,
            parentSelected: boolean = false
        ) => {
            const currentSlots = {
                default: () => children,
                ...computedCellSlots.value
            }

            return renderComponent(vue2h.value, DlTrTreeView, {
                row,
                rowIndex: index,
                rowKey: props.rowKey,
                isRowSelected:
                    isRowSelected(props.rowKey, getRowKey.value(row)) === true,
                isRowHighlighted:
                    props.highlightedRow &&
                    (typeof props.rowKey === 'string'
                        ? row[props.rowKey] === props.highlightedRow
                        : false),
                level,
                class: 'nested-element dl-tr',
                'data-level': level,
                'data-id': row.id,
                hasAnyAction: tableRootRef.value.hasAnyAction,
                noHover: tableRootRef.value.noHover,
                hasDraggableRows: hasDraggableRows.value,
                hasSelectionMode: tableRootRef.value.hasSelectionMode,
                bindBodySelection: tableRootRef.value.getBodySelectionScope({
                    key: getRowKey.value(row),
                    row,
                    pageIndex: index
                }),
                bindBodyCellScope: (col: DlTableColumn) =>
                    tableRootRef.value.getBodyCellScope({
                        key: getRowKey.value(row),
                        row,
                        pageIndex: index,
                        col
                    }),

                key: getRowKey.value(row),
                color: props.color,
                computedCols: tableRootRef.value.computedCols,
                modelValue: isRowSelected(props.rowKey, getRowKey.value(row)),
                scopedSlots: currentSlots,
                tooltip: props.identifierAsTooltip ? row.identifier : null,
                customIconExpandedRow: props.customIconExpandedRow,
                customIconCompressedRow: props.customIconCompressedRow,
                chevronIconColor: props.chevronIconColor,
                disableChildCheckbox: props.disableChildCheckbox,
                childDisabledCheckboxTooltip:
                    props.childDisabledCheckboxTooltip,
                parentSelected,
                'onUpdate:modelValue': (adding: boolean, evt: Event) => {
                    updateSelectionHierarchy(adding, evt, row)
                },
                onRowClick: (event: Event, row: any, index: number) => {
                    tableRootRef.value.onTrClick(event, row, index)
                },
                onRowDoubleClick: (event: Event, row: any, index: number) => {
                    tableRootRef.value.onTrDblClick(event, row, index)
                },
                onRowContextMenu: (event: Event, row: any, index: number) => {
                    tableRootRef.value.onTrContextMenu(event, row, index)
                },
                onUpdateExpandedRow: () =>
                    updateExpandedRow(!row.isExpanded, getRowKey.value(row)),
                on: {
                    'update:model-value': (adding: boolean, evt: Event) => {
                        updateSelectionHierarchy(adding, evt, row)
                    },
                    rowClick: (event: Event, row: any, index: number) => {
                        tableRootRef.value.onTrClick(event, row, index)
                    },
                    rowDoubleClick: (event: Event, row: any, index: number) => {
                        tableRootRef.value.onTrDblClick(event, row, index)
                    },
                    rowContextMenu: (event: Event, row: any, index: number) => {
                        tableRootRef.value.onTrContextMenu(event, row, index)
                    },
                    updateExpandedRow: () =>
                        updateExpandedRow(
                            !row.isExpanded,
                            getRowKey.value(row)
                        ),
                    rowHoverStart: (...args: any) =>
                        emit('row-hover-start', ...args),
                    rowHoverEnd: (...args: any) =>
                        emit('row-hover-end', ...args)
                }
            })
        }

        const renderTr = (
            row: DlTableRow,
            index: number,
            level: number = 1,
            parentSelected: boolean = false
        ) => {
            const children = []
            const isCurrentRowSelected =
                isRowSelected(props.rowKey, getRowKey.value(row)) === true

            children.push(renderDlTrTree(row, index, [], level, parentSelected))

            const tbodyEls: VNode[] = []

            if ((row.children || []).length > 0) {
                //TODO CHECK INDEX var
                level++

                row.children.forEach((childRow: DlTableRow, i: number) => {
                    tbodyEls.push(
                        renderComponent(
                            vue2h.value,
                            'tbody',
                            {
                                key: getRowKey.value(childRow),
                                'data-level': level,
                                class: 'nested-tbody'
                            },
                            renderTr(childRow, i, level, isCurrentRowSelected)
                        ) as VNode
                    )
                })

                const tdEl = renderComponent(
                    vue2h.value,
                    'td',
                    {
                        colspan: tableRootRef.value.computedColspan,
                        style: 'padding: 0'
                    },
                    renderComponent(
                        vue2h.value,
                        Sortable,
                        {
                            list: [],
                            itemKey: getRowKey.value,
                            tag: 'table',
                            class: 'nested-table',
                            isSortable: hasDraggableRows.value,
                            onEnd: handleEndEvent,
                            onChange: handleChangeEvent,
                            onStart: handleStartEvent,
                            on: {
                                end: handleEndEvent,
                                change: handleChangeEvent,
                                start: handleStartEvent
                            },
                            options: {
                                group: 'nested',
                                animation: 150,
                                fallbackOnBody: true,
                                forceFallback: true,
                                fallbackClass: 'dl-tree-table-fallback-row',
                                invertSwap: true,
                                swapThreshold: 0.85,
                                handle: '.draggable-icon',
                                ghostClass: 'dl-table-ghost-row',
                                onMove: handleMoveEvent
                            }
                        },
                        isVue2 ? tbodyEls : () => tbodyEls
                    )
                )

                const childrenTrWrapper = renderComponent(
                    vue2h.value,
                    'tr',
                    {
                        class:
                            (row.isExpanded ? '' : 'display-none') +
                            ' dl-tr--no-hover' +
                            ' nested-element'
                    },
                    tdEl
                )

                children.push(childrenTrWrapper)
            }

            return children
        }

        const handleEndEvent = (event: SortableJs.SortableEvent) => {
            let finalTarget = targetRow.value
            let shouldSkipValidation = false

            if (storedValidTarget.value) {
                if (!targetRow.value) {
                    finalTarget = storedValidTarget.value
                    shouldSkipValidation = true
                } else {
                    const isStoredTargetAncestor = isAncestor(
                        storedValidTarget.value.id,
                        targetRow.value.id,
                        tableRows.value
                    )
                    if (isStoredTargetAncestor) {
                        finalTarget = storedValidTarget.value
                        shouldSkipValidation = true
                    }
                }
            }

            emit('row-drag-end', {
                draggedRow: draggedRow.value,
                targetRow: finalTarget
            })

            const isDragValid =
                shouldSkipValidation ||
                checkParentCondition(draggedRow.value, finalTarget)
            if (isDragValid) {
                const smartSortingMovement = {
                    ...sortingMovement.value,
                    lastId: finalTarget?.id || sortingMovement.value.lastId
                }
                // Always operate on full tableRows for drag-and-drop, even with infinite scroll
                const reorderedRows = moveNestedRow(
                    tableRows.value,
                    event,
                    smartSortingMovement
                )
                emit('row-reorder', reorderedRows)

                // If infinite scroll is enabled, reset to reload with new order
                if (props.infiniteScroll) {
                    windowStartRow.value = 0
                }
            } else {
                mainTableKey.value = v4()
            }
            draggedRow.value = null
            targetRow.value = null
            storedValidTarget.value = null
        }

        const handleChangeEvent = (event: any) => {
            const originalEvent = event?.originalEvent
            if (!originalEvent) {
                return
            }

            const srcEl = (originalEvent.srcElement ||
                originalEvent.target ||
                null) as HTMLElement | null
            const passedElement = srcEl ? getElementAbove(srcEl, 'dl-tr') : null
            if (passedElement) {
                const targetRowId = passedElement.dataset.id
                const targetLevel = passedElement.getAttribute('data-level')

                if (!targetRowId) {
                    return
                }

                let foundRow = tableRows.value.find(
                    (row: DlTableRow) => row.id === targetRowId
                )
                if (!foundRow) {
                    foundRow = findRowInNestedStructure(targetRowId, props.rows)
                }
                if (!foundRow) {
                    console.warn(
                        `Row with ID ${targetRowId} not found in data structure`
                    )
                    return
                }

                targetRow.value = foundRow
                if (targetLevel) {
                    targetRow.value.level = parseInt(targetLevel)
                }

                emit('row-drag-over', {
                    draggedRow: draggedRow.value,
                    targetRow: targetRow.value
                })
            }

            const currentY = originalEvent.clientY
            if (typeof currentY === 'number') {
                if (currentY > prevMouseY) {
                    sortingMovement.value.direction = 'down'
                } else if (currentY < prevMouseY) {
                    sortingMovement.value.direction = 'up'
                }
                prevMouseY = currentY
            }

            const lastId = passedElement?.dataset?.id
            if (lastId) {
                sortingMovement.value.lastId = lastId
            }
        }

        const handleStartEvent = (event: any) => {
            prevMouseY = event.originalEvent.clientY
            const rowIndex = event.oldIndex
            const draggedElement = event.item
            if (!draggedElement) {
                return
            }

            const draggedLevel = draggedElement.getAttribute('data-level')
            let draggedId = draggedElement.getAttribute('data-id')

            if (!draggedId && draggedElement.tagName === 'TBODY') {
                const firstTr = draggedElement.querySelector('tr')
                if (firstTr) {
                    draggedId = firstTr.getAttribute('data-id')
                }
            }

            if (draggedId) {
                let foundRow = tableRows.value.find(
                    (row: DlTableRow) => row.id === draggedId
                )
                if (!foundRow) {
                    foundRow = findRowInNestedStructure(draggedId, props.rows)
                }
                if (!foundRow) {
                    console.warn(
                        `Dragged row with ID ${draggedId} not found in data structure`
                    )
                    return
                }

                draggedRow.value = foundRow
                if (draggedLevel) {
                    draggedRow.value.level = parseInt(draggedLevel)
                }
            } else if (rowIndex !== undefined && rowIndex >= 0) {
                draggedRow.value = tableRows.value[rowIndex] || null
            }
            emit('row-drag-start', {
                draggedRow: draggedRow.value,
                targetRow: targetRow.value
            })
        }

        const handleMoveEvent = (event: SortableJs.MoveEvent): boolean => {
            if (!draggedRow.value) {
                return false
            }

            const targetRow = getTargetRowFromMoveEvent(event)
            if (!targetRow) {
                return false
            }

            if (targetRow.disableDraggable) {
                return false
            }

            const isValid = checkParentCondition(draggedRow.value, targetRow)

            if (isValid) {
                storedValidTarget.value = targetRow
            }
            return isValid
        }

        const getTargetRowFromMoveEvent = (
            event: SortableJs.MoveEvent
        ): DlTableRow | null => {
            const { related: targetElement } = event

            if (!targetElement) {
                return null
            }

            let targetRowId = targetElement.getAttribute('data-id')
            if (!targetRowId && targetElement.tagName === 'TBODY') {
                const firstTr = targetElement.querySelector('tr')
                targetRowId = firstTr?.getAttribute('data-id') || null
            }

            if (!targetRowId) {
                return null
            }
            let foundTargetRow = tableRows.value.find(
                (row: DlTableRow) => row.id === targetRowId
            )
            if (!foundTargetRow) {
                foundTargetRow = findRowInNestedStructure(
                    targetRowId,
                    props.rows
                )
            }

            return foundTargetRow
        }

        const checkParentCondition = (
            draggedRow: DlTableRow,
            targetRow: DlTableRow
        ): boolean => {
            if (!draggedRow || !targetRow) {
                return false
            }

            const originalRows = props.rows
            const draggedIsTopLevel = originalRows.some(
                (row: DlTableRow) => row.id === draggedRow.id
            )
            const targetIsTopLevel = originalRows.some(
                (row: DlTableRow) => row.id === targetRow.id
            )
            if (
                props.enforceParentChildRestrictions &&
                draggedIsTopLevel !== targetIsTopLevel
            ) {
                return false
            }
            if (!draggedIsTopLevel && props.enforceSameParentRestrictions) {
                const draggedParent = findParentForChild(
                    draggedRow.id,
                    originalRows
                )
                const targetParent = findParentForChild(
                    targetRow.id,
                    originalRows
                )
                if (draggedParent !== targetParent) {
                    return false
                }
            }
            return true
        }

        const buildParentMap = (rows: DlTableRow[]): Map<string, string> => {
            const parentMap = new Map<string, string>()
            const traverse = (rowList: DlTableRow[]) => {
                for (const row of rowList) {
                    if (row.children) {
                        for (const child of row.children) {
                            parentMap.set(child.id, row.id)
                        }
                        traverse(row.children)
                    }
                }
            }
            traverse(rows)
            return parentMap
        }

        const findParentForChild = (
            childId: string,
            rows: DlTableRow[]
        ): string | null => {
            const parentMap = buildParentMap(rows)
            return parentMap.get(childId) || null
        }

        const isAncestor = (
            ancestorId: string,
            childId: string,
            rows: DlTableRow[]
        ): boolean => {
            const parentMap = buildParentMap(rows)
            while (parentMap.has(childId)) {
                const parentId = parentMap.get(childId)!
                if (parentId === ancestorId) {
                    return true
                }
                childId = parentId
            }
            return false
        }

        const calculateRowLevel = (row: DlTableRow): number => {
            const parentMap = buildParentMap(props.rows)
            let level = 1
            let currentId = row.id
            while (parentMap.has(currentId) && currentId) {
                level++
                currentId = parentMap.get(currentId)!
            }
            return level
        }

        const findRowInNestedStructure = (
            rowId: string,
            rows: DlTableRow[]
        ): DlTableRow | null => {
            const searchRecursively = (
                rowList: DlTableRow[]
            ): DlTableRow | null => {
                for (const row of rowList) {
                    if (row.id === rowId) {
                        return row
                    }
                    if (row.children && row.children.length > 0) {
                        const found = searchRecursively(row.children)
                        if (found) {
                            return found
                        }
                    }
                }
                return null
            }
            return searchRecursively(rows)
        }

        const updateColumns = (newColumns: DlTableColumn[]) => {
            emit('col-update', newColumns)
        }

        const renderEmptyState = () =>
            renderComponent(
                vue2h.value,
                'td',
                { colspan: '100%' },
                renderComponent(
                    vue2h.value,
                    'div',
                    {
                        class: 'flex justify-center full-width'
                    },
                    renderComponent(
                        vue2h.value,
                        DlEmptyState,
                        props.emptyStateProps,
                        (): [] => []
                    )
                )
            )

        // Watch for changes to rows to reset sliding window
        watch([tableRows, () => props.filter], () => {
            if (props.infiniteScroll) {
                console.log(
                    '[DlTreeTable] Rows or filter changed, resetting windowStartRow'
                )
                windowStartRow.value = 0
            }
        })

        const renderTBody = () => {
            console.log(
                '[DlTreeTable] renderTBody called, rows count:',
                paginatedFilter.value?.length
            )
            if (isEmpty(tableRootRef.value)) return null
            const children = paginatedFilter.value.map(
                (row: DlTableRow, i: number) => {
                    const rowBodySlot = slots['row-body']
                    const [renderRow] = rowBodySlot
                        ? rowBodySlot({ row })
                        : [renderTr(row, i)]
                    const actualLevel = calculateRowLevel(row)
                    return renderComponent(
                        vue2h.value,
                        'tbody',
                        {
                            'data-level': actualLevel,
                            key: getRowKey.value(row) + i,
                            class: 'nested-tbody'
                        },
                        isVue2 ? [renderRow] : renderRow
                    )
                }
            )

            const tableBody = renderComponent(
                vue2h.value,
                'tbody',
                {},
                renderComponent(
                    vue2h.value,
                    'tr',
                    {
                        class: 'dl-tr--no-hover'
                    },
                    renderComponent(
                        vue2h.value,
                        'td',
                        { colspan: tableRootRef.value.computedColspan },
                        renderComponent(
                            vue2h.value,
                            Sortable,
                            {
                                list: [],
                                itemKey: getRowKey.value,
                                tag: 'table',
                                id: mainTbodyUuid,
                                key: mainTableKey.value,
                                isSortable: hasDraggableRows.value,
                                onEnd: handleEndEvent,
                                onChange: handleChangeEvent,
                                onStart: handleStartEvent,
                                on: {
                                    end: handleEndEvent,
                                    change: handleChangeEvent,
                                    start: handleStartEvent
                                },
                                class: 'nested-table',
                                options: {
                                    group: 'nested',
                                    animation: 150,
                                    fallbackOnBody: true,
                                    forceFallback: true,
                                    fallbackClass: 'dl-tree-table-fallback-row',
                                    invertSwap: true,
                                    swapThreshold: 0.85,
                                    handle: '.draggable-icon',
                                    ghostClass: 'dl-table-ghost-row',
                                    onMove: handleMoveEvent
                                }
                            },
                            isVue2 ? children : () => children
                        )
                    )
                )
            )

            return tableBody
        }

        return {
            renderEmptyState,
            isDataEmpty,
            updateColumns,
            dlTableRef,
            isRowSelected,
            hasFlatTreeData,
            headerSelectedValue,
            selectedData,
            denseState,
            borderState,
            resizableState,
            tableRows,
            tableColumns,
            computedRows,
            getRowKey,
            updateSelection,
            hasEmptyStateProps,
            updateExpandedRow,
            updateSelectionHierarchy,
            onMultipleSelectionSet,
            updateSelected,
            emitSelectedItems,
            emitRowClick,
            emitRowDblclick,
            emitThClick,
            emitRowExpand,
            emitRowCollapse,
            hasSlotByName,
            getSlotByName,
            renderTBody,
            tableRootRef,
            uuid,
            mainTbodyUuid,
            vue2h,
            containerClass,
            computedFilter,
            paginatedFilter,
            handleScroll,
            handleScrollToBottom,
            handleScrollToTop,
            topSpacerHeight,
            bottomSpacerHeight,
            clearSelection,
            clearSelectionWithRerender
        }
    },
    // adding ignore here as overloading the render function like this is not a known type
    // @ts-ignore
    render(vue2h: any) {
        console.log('[DlTreeTable] RENDER FUNCTION CALLED')
        console.log(
            '[DlTreeTable]   this.paginatedFilter length:',
            (this.paginatedFilter as DlTableRow[])?.length
        )
        this.vue2h = vue2h
        const tableBodySlot = isVue2
            ? this.$slots['table-body'] &&
              (() => (this.$slots['table-body'] as any)?.pop())
            : this.$slots['table-body']
        const tbody =
            tableBodySlot ?? (this.isDataEmpty ? null : this.renderTBody)

        // Debug log before render
        console.log(
            '[DlTreeTable] Rendering DlTable with infiniteScroll:',
            this.infiniteScroll,
            'pagination:',
            this.pagination
        )
        console.log('[DlTreeTable] Render props being passed to DlTable:')
        console.log('[DlTreeTable]   - infiniteScroll:', this.infiniteScroll)
        console.log('[DlTreeTable]   - pagination:', this.pagination)
        console.log(
            '[DlTreeTable]   - rowsPerPageOptions:',
            this.rowsPerPageOptions
        )
        console.log(
            '[DlTreeTable]   - computedFilter length:',
            (this.computedFilter as DlTableRow[])?.length
        )
        console.log(
            '[DlTreeTable]   - paginatedFilter length:',
            (this.paginatedFilter as DlTableRow[])?.length
        )

        const tableComponent = renderComponent(vue2h, DlTable, {
            ref: 'dlTableRef',
            draggable: this.draggable,
            id: this.uuid,
            selected: this.selectedData,
            separator: this.separator,
            columns: this.tableColumns,
            bordered: this.bordered,
            dense: this.dense,
            filter: this.filter,
            isTreeTable: true,
            selection: this.selection,
            loading: this.loading,
            rows: this.paginatedFilter,
            resizable: this.resizable,
            rowKey: this.rowKey,
            color: this.color,
            title: this.title,
            virtualScroll: this.virtualScroll,
            infiniteScroll: this.infiniteScroll,
            rowsPerPageOptions: this.rowsPerPageOptions,
            hidePagination: this.hidePagination,
            isEmpty: this.isDataEmpty,
            emptyStateProps: this.emptyStateProps,
            noDataLabel: this.noDataLabel,
            visibleColumns: this.visibleColumns,
            onRowClick: this.emitRowClick,
            onRowDblclick: this.emitRowDblclick,
            'onUpdate:selected': this.updateSelected,
            onColUpdate: this.updateColumns,
            class: this.containerClass,
            menuClass: this.menuClass,
            hideBottom: this.hideBottom,
            hideNoData: this.hideNoData,
            hideHeader: this.hideHeader,
            on: {
                'row-click': this.emitRowClick,
                'row-dblclick': this.emitRowDblclick,
                'update:selected': this.updateSelected,
                'col-update': this.updateColumns
                // Note: scroll-to-bottom and scroll-to-top events from DlTable won't fire
                // because custom tbody disables virtual scroll. We handle scroll detection
                // directly in the wrapper div when infiniteScroll is enabled.
            },
            scopedSlots: {
                tbody,
                'no-data': this.$slots['no-data']
                    ? () => this.$slots['no-data']
                    : undefined
            }
        })

        // Wrap in scrollable div for infinite scroll detection
        // DlTable's scroll events don't fire when custom tbody disables virtual scroll
        if (this.infiniteScroll) {
            return vue2h(
                'div',
                {
                    on: {
                        scroll: (this as any).handleScroll
                    },
                    style: {
                        maxHeight: '500px',
                        overflowY: 'auto',
                        position: 'relative'
                    }
                },
                [
                    // Top spacer to maintain scroll position (preserves scroll anchor)
                    vue2h('div', {
                        style: {
                            height: (this as any).topSpacerHeight + 'px',
                            pointerEvents: 'none'
                        }
                    }),
                    // Table component
                    tableComponent,
                    // Bottom spacer to maintain scroll position
                    vue2h('div', {
                        style: {
                            height: (this as any).bottomSpacerHeight + 'px',
                            pointerEvents: 'none'
                        }
                    })
                ]
            )
        }

        return tableComponent
    }
})
</script>

<style scoped lang="scss">
.settings {
    display: flex;
    width: 100%;
    max-width: 600px;
    gap: 10px;
    justify-content: center;
    flex-wrap: wrap;

    & > * {
        flex-grow: 1;
    }
}

table {
    width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
    border-spacing: 0;
}

tbody {
    // display: table-row-group;
    vertical-align: middle;
    border-color: inherit;
}

td {
    padding: 0 !important;
}

tr {
    display: table-row;
    vertical-align: inherit;
    border-color: inherit;
}

.sticky-header {
    ::v-deep .dl-table__top,
    ::v-deep .dl-table__bottom,
    ::v-deep thead tr:first-child th {
        /* bg color is important for th; just specify one */
        background-color: var(--dl-color-panel-background);
    }

    ::v-deep thead tr th {
        position: sticky !important;
        z-index: 1;
    }

    ::v-deep thead tr:first-child th {
        top: 0;
    }

    /* this is when the loading indicator appears */
    &.dl-table--loading thead tr:last-child th {
        /* height of all previous header rows */
        top: 40px;
    }
}
</style>
