// @flow
import React from 'react';
import invariant from 'tiny-invariant';
import { render, fireEvent, act } from '@testing-library/react';
import * as attributes from '../../../../src/view/data-attributes';
import type { DroppableId } from '../../../../src/types';
import { isOver } from '../util/helpers';
import expandedMouse from '../util/expanded-mouse';
import Board, { withPoorBoardDimensions } from '../util/board';
import { toDroppableList } from '../../../../src/state/dimension-structures';
import { getTransitionEnd } from '../util/controls';

function findPlaceholder(
  droppableId: DroppableId,
  container: HTMLElement,
): ?HTMLElement {
  return container.querySelector(
    `[${attributes.droppable.id}="${droppableId}"] [${attributes.placeholder.contextId}]`,
  );
}

function getPlaceholder(
  droppableId: DroppableId,
  container: HTMLElement,
): HTMLElement {
  const droppable: ?HTMLElement = findPlaceholder(droppableId, container);
  invariant(droppable, 'Unable to find placeholder');
  return droppable;
}

function hasPlaceholder(
  droppableId: DroppableId,
  container: HTMLElement,
): boolean {
  return Boolean(findPlaceholder(droppableId, container));
}

it('should not render a placeholder at rest', () => {
  withPoorBoardDimensions(preset => {
    const { container } = render(<Board />);

    toDroppableList(preset.droppables).forEach(droppable => {
      expect(hasPlaceholder(droppable.descriptor.id, container)).toBe(false);
    });
  });
});

it('should render a placeholder when dragging over', () => {
  withPoorBoardDimensions(preset => {
    toDroppableList(preset.droppables).forEach(droppable => {
      const { container, getByTestId, unmount } = render(<Board />);
      const handle: HTMLElement = getByTestId(preset.inHome1.descriptor.id);
      const box0 = preset.inHome1.client.borderBox;

      expandedMouse.powerLift(handle, box0.center);
      expandedMouse.move(handle, droppable.client.borderBox.center);

      expect(isOver(handle)).toBe(droppable.descriptor.id);
      expect(hasPlaceholder(droppable.descriptor.id, container)).toBe(true);

      unmount();
    });
  });
});

it('should always render a placeholder in the home list while dragging', () => {
  withPoorBoardDimensions(preset => {
    toDroppableList(preset.droppables).forEach(droppable => {
      const { container, getByTestId, unmount } = render(<Board />);
      const handle: HTMLElement = getByTestId(preset.inHome1.descriptor.id);
      const box0 = preset.inHome1.client.borderBox;

      expandedMouse.powerLift(handle, box0.center);
      expandedMouse.move(handle, droppable.client.borderBox.center);

      // doesn't matter what we are over
      expect(isOver(handle)).toBe(droppable.descriptor.id);
      // there is always a placeholder in home
      expect(hasPlaceholder(preset.home.descriptor.id, container)).toBe(true);

      unmount();
    });
  });
});

it('should not render a placeholder in a foreign list if not dragging over', () => {
  withPoorBoardDimensions(preset => {
    const { container, getByTestId } = render(<Board />);
    const handle: HTMLElement = getByTestId(preset.inHome1.descriptor.id);
    const box0 = preset.inHome1.client.borderBox;

    expandedMouse.powerLift(handle, box0.center);

    expect(isOver(handle)).toBe(preset.home.descriptor.id);
    expect(hasPlaceholder(preset.foreign.descriptor.id, container)).toBe(false);
  });
});

it('should immediately remove the home placeholder after dropping into any list', () => {
  withPoorBoardDimensions(preset => {
    toDroppableList(preset.droppables).forEach(droppable => {
      const { container, getByTestId, unmount } = render(<Board />);
      const handle: HTMLElement = getByTestId(preset.inHome1.descriptor.id);

      expandedMouse.powerLift(handle, preset.inHome1.client.borderBox.center);
      expandedMouse.move(handle, droppable.client.borderBox.center);
      expect(isOver(handle)).toBe(droppable.descriptor.id);

      expandedMouse.startDrop(handle);
      expect(hasPlaceholder(droppable.descriptor.id, container)).toBe(true);

      // placeholder removed straight after drop
      expandedMouse.finishDrop(handle);
      expect(hasPlaceholder(droppable.descriptor.id, container)).toBe(false);

      unmount();
    });
  });
});

it('should immediately remove the home placeholder after dropping nowhere', () => {
  withPoorBoardDimensions(preset => {
    const { container, getByTestId } = render(<Board />);
    const handle: HTMLElement = getByTestId(preset.inHome1.descriptor.id);

    expandedMouse.powerLift(handle, preset.inHome1.client.borderBox.center);
    expandedMouse.move(handle, { x: 10000, y: 10000 });
    expect(isOver(handle)).toBe(null);

    // placeholder present when over nothing
    expect(hasPlaceholder(preset.home.descriptor.id, container)).toBe(true);

    // placeholder present when drop started
    expandedMouse.startDrop(handle);
    expect(hasPlaceholder(preset.home.descriptor.id, container)).toBe(true);

    // placeholder gone after drop finished
    expandedMouse.finishDrop(handle);
    expect(hasPlaceholder(preset.home.descriptor.id, container)).toBe(false);
  });
});

it('should animate the home placeholder closed after dropping into a foreign list', () => {
  withPoorBoardDimensions(preset => {
    const { container, getByTestId } = render(<Board />);
    const handle: HTMLElement = getByTestId(preset.inHome1.descriptor.id);

    expandedMouse.powerLift(handle, preset.inHome1.client.borderBox.center);
    expandedMouse.move(handle, preset.inForeign1.client.borderBox.center);
    expect(isOver(handle)).toBe(preset.foreign.descriptor.id);

    expandedMouse.startDrop(handle);
    // foreign placeholder remaining in place
    expect(hasPlaceholder(preset.foreign.descriptor.id, container)).toBe(true);
    // home placeholder remaining in place
    expect(hasPlaceholder(preset.home.descriptor.id, container)).toBe(true);

    // gone after drop finished
    expandedMouse.finishDrop(handle);

    // foreign placeholder is now gone
    expect(hasPlaceholder(preset.foreign.descriptor.id, container)).toBe(false);
    // home placeholder is still around and will now animate closed
    expect(hasPlaceholder(preset.home.descriptor.id, container)).toBe(true);

    // placeholder is now collapsing
    const placeholder: HTMLElement = getPlaceholder(
      preset.home.descriptor.id,
      container,
    );
    expect(placeholder.style.height).toBe('0px');

    // faking a transition end
    fireEvent(placeholder, getTransitionEnd('height'));

    // placeholder is gone
    expect(hasPlaceholder(preset.home.descriptor.id, container)).toBe(false);
  });
});

it('should flush a home placeholder collapse animation if starting a new drag', () => {
  withPoorBoardDimensions(preset => {
    const { container, getByTestId } = render(<Board />);
    {
      const handle: HTMLElement = getByTestId(preset.inHome1.descriptor.id);

      expandedMouse.powerLift(handle, preset.inHome1.client.borderBox.center);
      expandedMouse.move(handle, preset.inForeign1.client.borderBox.center);
      expect(isOver(handle)).toBe(preset.foreign.descriptor.id);

      expandedMouse.powerDrop(handle);
      // placeholder still here + animating closed
      expect(hasPlaceholder(preset.home.descriptor.id, container)).toBe(true);
      const placeholder: HTMLElement = getPlaceholder(
        preset.home.descriptor.id,
        container,
      );
      // animating height closed
      expect(placeholder.style.height).toBe('0px');
    }
    {
      const handle: HTMLElement = getByTestId(preset.inForeign1.descriptor.id);

      // using raw power lift as we don't want to combine renders
      // (we need a render to flush the placeholder out)
      expandedMouse.rawPowerLift(
        handle,
        preset.inForeign1.client.borderBox.center,
      );

      // placeholder is gone from home (it got flushed)
      expect(hasPlaceholder(preset.home.descriptor.id, container)).toBe(false);
    }
  });
});
