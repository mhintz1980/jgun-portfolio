// Runtime failure boundary for the mounted scene: a render error in the scene tree unmounts it
// and hands the failure to the page, which selects the static poster layer and seals the store.
// It catches render errors; async/WebGL failures inside the scene must call the same page
// callback directly when those stages land.
import { Component, type ErrorInfo, type ReactNode } from 'react'

export interface SceneBoundaryProps {
  children: ReactNode
  onFailure: (error: unknown) => void
}

interface SceneBoundaryState {
  failed: boolean
}

export class SceneBoundary extends Component<SceneBoundaryProps, SceneBoundaryState> {
  override state: SceneBoundaryState = { failed: false }

  static getDerivedStateFromError(): SceneBoundaryState {
    return { failed: true }
  }

  override componentDidCatch(error: Error, _info: ErrorInfo): void {
    this.props.onFailure(error)
  }

  override render(): ReactNode {
    return this.state.failed ? null : this.props.children
  }
}
