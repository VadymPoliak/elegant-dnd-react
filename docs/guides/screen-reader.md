# Screen reader guide

> Because great features should be accessible for everyone

`react-beautiful-dnd` ships with great screen reader support out of the box with basic English text. If you just want to get started, then there's nothing you have to do. But if it's tailored messaging you're after, you have total control of that too.

This guide is here to help you create messaging that supports and delights your users. The screen reader experience is focused on keyboard interactions, but it's possible for a screen reader user to use any input type (for example mouse and keyboard).

## Tone

In the default messages we went for a friendly tone, choosing phrases such as "You have dropped the item" over "Item dropped". We know it's wordier, but we think the pronoun makes it personal and sound less like a computer.

Choose a tone that best supports what your audience is trying to do. If you need some inspiration and best practice guides, head to [https://atlassian.design](https://atlassian.design) and see how we communicate with our customers here at Atlassian.

## How to control announcements

The `announce` function is provided to each of the `<DragDropContext /> > Responder` functions and can be used to deliver your own screen reader messages. Messages will be immediately read out. It's important to deliver messages immediately, so your users have a fast and responsive experience.

If you attempt to hold onto the `announce` function and call it later, it won't work and will just print a warning to the console. If you try to call announce twice for the same event, only the first will be read by the screen reader with subsequent calls to announce being ignored and a warning printed.

## Use position, not index

> `position = index + 1`

When making a screen reader announcement we recommend announcing the position of an item in a list, rather than an index. index based listed start at `0`, where as position based lists start a `1`.

It reads more natural to hear "You have moved an item to position 2" than "You have moved an item to index 1"

```js
const position = index => index + 1;

const startPosition = position(source.index);
const endPosition = destination ? position(destination.index) : null;
```

## Use names where possible

All of our built in screen reader messages use `id`'s to identify `<Draggable />` and `<Droppable />`s. You might want to consider replacing these with more readable names.

> Potentially this could be a prop for `<Draggable />` and `<Droppable />` 🤔. Please raise an issue if you would like to see this happen!

## Instructions to cover

### Step 1: Introduce draggable item

Each element has a number of accessibility properties associated with it:

- name: a way of identifying the element
- role: type of element (eg "button")
- role description: a more specific description of the role
- description: additional information including [instructions](https://www.w3.org/TR/WCAG20-TECHS/ARIA1.html) for the element

A combination of these properties will control what a screen reader reads out when element is focused on.

Here is how we populate the accessibility properties for _drag handles_ to impact what is read out

- **name**: (We do not control this). By default the content of the element will be used. Otherwise you can use `aria-label` or `aria-labelledby`.
- **role**: (Default: we add `role="button"` to a drag handle). This is done so that the element is marked as *interactive* and will have information read out. `role="button"` might not be the right role for your element, or it might already be an interactive element. In which case you are welcome to remove or override the `role`.
- **role description**: (We do not control this). Role description controlled by adding `aria-roledescription`. Ideally we would add `aria-roledescription="Draggable item"` by default. However, [Google lighthouse](https://developers.google.com/web/tools/lighthouse) marks this as a problem even though it is fine according to [axe and the spec](https://twitter.com/alexandereardon/status/1220563555797229568). So you are welcome to add a `aria-roledescription` but keep in mind that [Google lighthouse](https://developers.google.com/web/tools/lighthouse) will mark it as a accessibility problem
- **description**: (Default: `"Press space bar to lift"`). We control this by using `aria-describedby="${elementId}"`. We create a hidden element for each `<DragDropContext>` and populate the element with the `liftInstruction` text.

When a user `tabs` to a _drag handle_, we need to tell them how to start a drag. We do this by using the `liftInstruction` prop on a `<DragDropContext />`. All _drag handles_ share the same lift announcement message.

**Default message**: "Draggable item. Ensure your screen reader is not in browse mode and then press spacebar to lift."

We tell the user the following:

- The item is draggable
- To disable _browse mode_
- How to start a drag

You don't need to give all the drag movement instructions at this point, let's wait until the user decides to start a drag.

Think about substituting the word "item" for a noun that matches your problem domain, for example, "task" or "issue". You might also want to drop the word "item" altogether.

#### Disabling browse mode

Screen readers can run in [various modes](https://www.accessibility-developer-guide.com/knowledge/desktop-screen-readers/browse-focus-modes/). In order for the keyboard shortcuts to work correctly the user needs to leave the _browse mode_ as it remaps a lot of keyboard shortcuts. Alternatively you could use `aria-role="application"` on the `<body>` element, but this can wreck the standard screen reader usage of your page.

### Step 2: Start drag

When a user lifts a `<Draggable />` by using the `spacebar` we want to tell them a number of things.

**Default message**: "You have lifted an item in position `${startPosition}`. Use the arrow keys to move, space bar to drop, and escape to cancel."

We tell the user the following:

- They have lifted the item
- What position the item is in
- How to move the item around

Notice that we don't tell them that they are in position `1 of x`. This is because we don't have access to the size of the list in the current api. This is especially true for [virtual lists](/docs/patterns/virtual-lists.md) where only a portion of the list is rendered at any one time. Feel free to add the the `1 of x` in your own messaging, and what list the item is in.

**Message with more info**: "You have lifted an item in position `${startPosition}` of `${listLength}` in the `${listName}` list. Use the arrow keys to move, space bar to drop, and escape to cancel."

You control the message printed to the user through the `<DragDropContext />` > `onDragStart` responder

```js
onDragStart = (start: DragStart, provided: ResponderProvided) => {
  provided.announce('My super cool message');
};
```

### Step 3: Drag movement

When a user has started a drag, there are different scenarios that can spring from that, so we'll create different messaging for each scenario.

We can control the announcement through the `<DragDropContext />` > `onDragUpdate` responder.

```js
onDragUpdate = (update: DragUpdate, provided: ResponderProvided) => {
  provided.announce('Update message');
};
```

#### Scenario 1. Moved in the same list

The user has moved backwards or forwards within the same list, so we want to tell the user what position they are now in.

**Default message**: "You have moved the item from position `${startPosition}` to position `${endPosition}`"

Think about including of `${listLength}` in your messaging.

#### Scenario 2. Moved into a different list

The user has moved on the cross axis into a different list, so we want to tell them a number of things.

**Default message** "You have moved the item from position `${startPosition}` in list `${source.droppableId}` to list `${destination.droppableId}` in position `${endPosition}`"

We tell the user the following:

- They have moved to a new list
- Some information about the new list
- What position they have moved from
- What position they are now in

Think about using friendlier text for the name of the droppable, and including the length of the lists in the messaging.

**Message with more info**: "You have moved the item from list `${sourceName}` in position `${sourcePosition}` of `${sourceLength}` to list `${destinationName}` in position `${newPosition}` of `${destinationLength}`".

#### Scenario 4. Combining in same list

The user has moved over another `<Draggable />` in [combine mode](/docs/guides/combining.md) in the same list

**Default message** "The item `${source.draggableId}` has been combined with `${combine.draggableId}`"

#### Scenario 5: Combining in different list

The user has moved over another `<Draggable />` in [combine mode](/docs/guides/combining.md) in a list that is not the list the dragging item started in

**Default message** "The item `${source.draggableId}` in list `${source.droppableId}` has been combined with `${combine.draggableId}` in list `${combine.droppableId}`"

#### Scenario 6. Over no drop target

You can't do this with a keyboard, but it's worthwhile having a message for this scenario, in case the user has a pointer for dragging.

**Default message**: "You are currently not dragging over a droppable area".

Think about how you could make this messaging friendlier and clearer.

### Step 4: On drop

There are two ways a drop can happen. Either the drag is cancelled or the user drops the dragging item. You can control the messaging for these events using the `<DragDropContext /> > onDragEnd` responder.

#### Scenario 1. Drag cancelled

A `DropResult` object has a `reason` property which can either be `DROP` or `CANCEL`. You can use this to announce your cancel message.

```js
onDragEnd = (result: DropResult, provided: ResponderProvided) => {
  if (result.reason === 'CANCEL') {
    provided.announce('Your cancel message');
    return;
  }
};
```

**Default message**: "Movement cancelled. The item has returned to its starting position of `${startPosition}`"

We tell the user the following:

- The drag has been cancelled
- Where the item has returned to

Think about adding information about the length of the list, and the name of the list you have dropped into.

**Message with more info**: "Movement cancelled. The item has returned to its starting position `${startPosition}` of `${listLength}`"

#### Scenario 2. Dropped in the home list

**Default message**: "You have dropped the item. It has moved from position `${startPosition}` to `${endPosition}`"

We tell the user the following:

- They have completed the drag
- What position the item is in now

#### Scenario 3. Dropped on a foreign list

The messaging for this scenario should be similar to 'dropped in a home list', but we also add what list the item started in and where it finished.

**Default message**: "You have dropped the item. It has moved from position `${startPosition}` in list `${result.source.droppableId}` to position `${endPosition}` in list `${result.destination.droppableId}`"

#### Scenario 4. Dropped on another `<Draggable />` in the home list

The user has dropped onto another `<Draggable />` in [combine mode](/docs/guides/combining.md) in the same list that the drag started in

**Default message**: "You have dropped the item. The item `${source.draggableId}` has been combined with `${combine.draggableId}`"

#### Scenario 5. Dropped on another `<Draggable />` in a foreign list

The user has dropped onto another `<Draggable />` in [combine mode](/docs/guides/combining.md) in a list that is not the list the dragging item started in

**Default message**: "The item `${source.draggableId}` in list `${source.droppableId}` has been combined with `${combine.draggableId}` in list `${combine.droppableId}`"

#### Scenario 6. Dropped on no destination

You can't do this with a keyboard, but it's worthwhile having a message for this scenario, in case the user has a pointer for dragging.

**Default message**: "The item has been dropped while not over a droppable location. The item has returned to its starting position of \${startPosition}"

We tell the user the following:

- They dropped over a location that is not droppable
- Where the item has returned to

## `VoiceOver` on Mac

If you are using Mac, then you are welcome to test against the inbuilt `VoiceOver` screen reader. Here is a [quick start guide](https://www.imore.com/how-enable-voiceover-mac)

> To start `VoiceOver`: <kbd>`cmd`</kbd> + <kbd>`f5`</kbd>

## That's all folks

We hope you find this guide useful. Feel free to send in suggestions for scenarios you'd like to see included, or you might want to share your own default messages and grow the knowledge even further 🙂.

[← Back to documentation](/README.md#documentation-)
