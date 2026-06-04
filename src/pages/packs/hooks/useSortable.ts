import { useCallback, useRef } from 'react'
import Sortable from 'sortablejs'
import { getOrderedIdsFromContainer } from '../../../shared/services/runtime/domService'

type UseSortableOptions = {
  /** CSS selector used to identify each sortable row within the container. */
  rowSelector: string
  /** The HTML attribute on each row element that holds its numeric ID. */
  idAttribute: string
  /** CSS selector for the drag handle element within each row. Defaults to '.drag-handle'. */
  handle?: string
  /** Drag animation duration in milliseconds. Defaults to 150. */
  animation?: number
}

/**
 * Attaches a SortableJS drag-and-drop list to a container element.
 *
 * Returns a callback ref (instead of a plain ref) so that Sortable is
 * initialised the moment the container actually mounts in the DOM — even if
 * the container is conditionally rendered.
 *
 * @param onReorder - Callback invoked after a drag ends. Receives the numeric IDs
 *                    of all rows in their new DOM order.
 * @param options   - Configuration for which elements to treat as rows/handles
 *                    and which attribute holds each row's ID.
 * @returns A callback ref to attach to the container `<div>`.
 *
 * @example
 * const containerRef = useSortable(
 *   orderedIds => setItems(prev => reorder(prev, orderedIds)),
 *   { rowSelector: '.list-item', idAttribute: 'data-item-id' }
 * )
 * return <div ref={containerRef}>...</div>
 */
export function useSortable(onReorder: (orderedIds: number[]) => void, options: UseSortableOptions) {
  const { rowSelector, idAttribute, handle = '.drag-handle', animation = 150 } = options
  const sortableRef = useRef<Sortable | null>(null)
  const onReorderRef = useRef(onReorder)
  onReorderRef.current = onReorder

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node || sortableRef.current) return
    sortableRef.current = Sortable.create(node, {
      animation,
      handle,
      onEnd: () => {
        const orderedIds = getOrderedIdsFromContainer(node, rowSelector, idAttribute)
        onReorderRef.current(orderedIds)
      }
    })
  }, [])

  return containerRef
}
