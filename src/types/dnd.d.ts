declare module 'react-beautiful-dnd' {
  import { ComponentType, ReactElement } from 'react';

  export interface DraggableLocation {
    droppableId: string;
    index: number;
  }

  export interface DropResult {
    draggableId: string;
    type: string;
    source: DraggableLocation;
    destination: DraggableLocation | null;
    reason: 'DROP' | 'CANCEL';
    mode: 'FLUID' | 'SNAP';
    combine: any;
  }

  export interface DragDropContextProps {
    onDragEnd: (result: DropResult) => void;
    children: ReactElement;
  }

  export interface DroppableProvided {
    innerRef: (element: HTMLElement | null) => void;
    droppableProps: {
      'data-rbd-droppable-context-id': string;
      'data-rbd-droppable-id': string;
    };
    placeholder?: ReactElement | null;
  }

  export interface DroppableProps {
    droppableId: string;
    children: (provided: DroppableProvided) => ReactElement;
  }

  export interface DraggableProvided {
    innerRef: (element: HTMLElement | null) => void;
    draggableProps: {
      'data-rbd-draggable-context-id': string;
      'data-rbd-draggable-id': string;
    };
    dragHandleProps: {
      'data-rbd-drag-handle-draggable-id': string;
      'data-rbd-drag-handle-context-id': string;
      'aria-describedby': string;
      role: string;
      tabIndex: number;
      draggable: boolean;
      onDragStart: () => void;
    } | null;
  }

  export interface DraggableProps {
    draggableId: string;
    index: number;
    children: (provided: DraggableProvided) => ReactElement;
  }

  export const DragDropContext: ComponentType<DragDropContextProps>;
  export const Droppable: ComponentType<DroppableProps>;
  export const Draggable: ComponentType<DraggableProps>;
}