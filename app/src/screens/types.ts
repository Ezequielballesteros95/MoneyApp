import type { Derived } from '../calc';
import type { State } from '../state';
import type { ToastData } from '../components/ui';

export type SetState = (patch: Partial<State> | ((s: State) => Partial<State>)) => void;

export interface ScreenProps {
  s: State;
  d: Derived;
  set: SetState;
  go: (step: number) => void;
  /** true a beat after the screen mounts — drives the grow-in animations */
  grow: boolean;
  notify: (msg: string, action?: ToastData['action']) => void;
  onKey: (k: string) => void;
}
