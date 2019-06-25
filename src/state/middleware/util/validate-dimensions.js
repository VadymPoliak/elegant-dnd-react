// @flow
import type {
  Critical,
  DimensionMap,
  DroppableId,
  DraggableDimensionMap,
  DraggableDimension,
} from '../../../types';
import getDraggablesInsideDroppable from '../../get-draggables-inside-droppable';
import { warning } from '../../../dev-warning';

function checkIndexesAreConsecutive(
  droppableId: DroppableId,
  draggables: DraggableDimensionMap,
) {
  const insideDestination = getDraggablesInsideDroppable(
    droppableId,
    draggables,
  );

  // no point running if there are 1 or less items
  if (insideDestination.length <= 1) {
    return;
  }

  const indexes: number[] = insideDestination.map(
    (d: DraggableDimension): number => d.descriptor.index,
  );

  type ErrorMap = {
    [index: number]: true,
  };
  const errors: ErrorMap = {};

  for (let i = 1; i < indexes.length; i++) {
    const current: number = indexes[i];
    const previous: number = indexes[i - 1];

    if (current !== previous + 1) {
      errors[current] = true;
    }
  }

  // all good!
  if (!Object.keys(errors).length) {
    return;
  }

  const formatted: string = indexes
    .map((index: number): string => {
      const hasError: boolean = Boolean(errors[index]);

      return hasError ? `[🔥${index}]` : `${index}`;
    })
    .join(', ');

  warning(`
    Detected non-consecutive Draggable indexes

    (This can cause unexpected bugs)

    ${formatted}
  `);
}

export default function validateDimensions(
  critical: Critical,
  dimensions: DimensionMap,
): void {
  // wrapping entire block for better minification
  if (process.env.NODE_ENV !== 'production') {
    checkIndexesAreConsecutive(critical.droppable.id, dimensions.draggables);
  }
}
