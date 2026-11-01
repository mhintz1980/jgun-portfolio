import type { ProjectId } from './content'

export interface VaultProps {
  /** The project whose drawings come forward (hover preview), or null for the resting state. */
  focus: ProjectId | null
}

// W2 stub: ghost drawing layers + loupe. Fixed, behind content, aria-hidden.
export default function Vault(_props: VaultProps) {
  return <div className="home-vault" aria-hidden="true" />
}
