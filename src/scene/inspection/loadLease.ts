import { inspection, inspectionFailed } from '../../state/inspectionStore'

/** A late success/rejection belongs only to the session that initiated that load. */
export function inspectionLoadLease(epoch: number) {
  let cancelled = false
  const current = () => !cancelled && inspection.active && inspection.epoch === epoch
  return { current, cancel() { cancelled = true }, fail(error: unknown) { if (current()) inspectionFailed(error, epoch) } }
}
