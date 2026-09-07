import { useEffect, useRef } from 'react';

type BackAction = () => boolean | Promise<boolean>;

interface BackRegistration {
  id: number;
  priority: number;
  order: number;
  action: BackAction;
}

const backStack: BackRegistration[] = [];
let nextBackId = 1;

function removeRegistration(id: number): void {
  const index = backStack.findIndex((entry) => entry.id === id);
  if (index >= 0) {
    backStack.splice(index, 1);
  }
}

export function registerBackAction(action: BackAction, priority = 0): () => void {
  const entry: BackRegistration = {
    id: nextBackId,
    priority,
    order: nextBackId,
    action,
  };

  backStack.push(entry);
  nextBackId += 1;
  return () => removeRegistration(entry.id);
}

export function useBackAction(active: boolean, action: BackAction, priority = 0): void {
  const actionRef = useRef(action);

  useEffect(() => {
    actionRef.current = action;
  }, [action]);

  useEffect(() => {
    if (!active) return undefined;
    return registerBackAction(() => actionRef.current(), priority);
  }, [active, priority]);
}

export async function dispatchBackAction(): Promise<boolean> {
  const ordered = [...backStack].sort((left, right) => {
    if (left.priority !== right.priority) {
      return right.priority - left.priority;
    }

    return right.order - left.order;
  });

  for (let index = 0; index < ordered.length; index += 1) {
    try {
      const handled = await ordered[index].action();
      if (handled) return true;
    } catch {
      // A failing dismiss handler should not block the rest of the stack.
    }
  }

  return false;
}

export function clearBackActionsForTests(): void {
  backStack.splice(0, backStack.length);
  nextBackId = 1;
}
