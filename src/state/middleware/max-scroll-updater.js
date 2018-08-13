// @flow
import invariant from 'tiny-invariant';
import type { Position } from 'css-box-model';
import type { State, Viewport, DragImpact } from '../../types';
import type { Action, MiddlewareStore, Dispatch } from '../store-types';
import getMaxScroll from '../get-max-scroll';
import { isEqual } from '../position';
import { updateViewportMaxScroll } from '../action-creators';
import isMovementAllowed from '../is-movement-allowed';

const shouldCheckOnAction = (action: Action): boolean =>
  action.type === 'MOVE' ||
  action.type === 'MOVE_UP' ||
  action.type === 'MOVE_RIGHT' ||
  action.type === 'MOVE_DOWN' ||
  action.type === 'MOVE_LEFT' ||
  action.type === 'MOVE_BY_WINDOW_SCROLL';

// optimisation: body size can only change when the destination has changed
const hasDroppableOverChanged = (
  previous: ?DragImpact,
  current: ?DragImpact,
): boolean => {
  // no previous - if there is a next return true
  if (!previous) {
    return Boolean(current && current.destination);
  }

  // no current - if there is a previous return true
  if (!current) {
    return Boolean(previous && previous.destination);
  }

  return previous.destination.droppableId !== current.destination.droppableId;
};

const getNewMaxScroll = (
  previous: State,
  current: State,
  action: Action,
): ?Position => {
  if (!shouldCheckOnAction(action)) {
    return null;
  }

  if (!isMovementAllowed(previous) || !isMovementAllowed(current)) {
    return null;
  }

  if (!hasDroppableOverChanged(previous.impact, current.impact)) {
    return null;
  }

  // check to see if the viewport max scroll has changed
  const viewport: Viewport = current.viewport;

  const doc: ?HTMLElement = document.documentElement;
  invariant(doc, 'Could not find document.documentElement');

  const maxScroll: Position = getMaxScroll({
    scrollHeight: doc.scrollHeight,
    scrollWidth: doc.scrollWidth,
    // these cannot change during a drag
    // a resize event will cancel a drag
    width: viewport.frame.width,
    height: viewport.frame.height,
  });

  // No change from current max scroll
  if (isEqual(maxScroll, viewport.scroll.max)) {
    return null;
  }

  return maxScroll;
};

export default (store: MiddlewareStore) => (next: Dispatch) => (
  action: Action,
): any => {
  const previous: State = store.getState();
  next(action);
  const current: State = store.getState();
  const maxScroll: ?Position = getNewMaxScroll(previous, current, action);

  // max scroll has changed - updating before action
  if (maxScroll) {
    next(updateViewportMaxScroll(maxScroll));
  }
};
