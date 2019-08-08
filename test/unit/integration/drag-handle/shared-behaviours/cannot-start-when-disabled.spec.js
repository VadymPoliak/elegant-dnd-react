// @flow
import React from 'react';
import { render } from '@testing-library/react';
import { isDragging } from '../../utils/helpers';
import App, { type Item } from '../../utils/app';
import { forEachSensor, type Control, simpleLift } from '../../utils/controls';

forEachSensor((control: Control) => {
  it('should not start a drag if disabled', () => {
    const items: Item[] = [{ id: '0', isEnabled: false }];

    const { getByText } = render(<App items={items} />);
    const handle: HTMLElement = getByText('item: 0');

    simpleLift(control, handle);

    expect(isDragging(handle)).toBe(false);
  });
});
