/**
 * What the HCSC bench's reconciliation pass shows, in the details panel. The scene is a fixed illustration on
 * made-up records; the note says so.
 */
export function HcscReconcileNote() {
  return (
    <section className="taskforge-sim" aria-labelledby="hcsc-reconcile-title">
      <h4 id="hcsc-reconcile-title">The reconciliation pass on this bench</h4>
      <p>
        A shuttle takes each check record from the records cabinet to the payment-status service and back. Records
        that match are filed green; mismatches are flagged amber for a person to check. When the service is slow, its
        lamp turns amber and a timeout runs down before the call is retried; when it is down, the record is set aside
        with a clear fallback message instead of failing silently. The records are made up: this illustrates the
        service&apos;s behaviour, not HCSC data or code.
      </p>
      <ul className="taskforge-sim__legend" aria-label="Colours in the diorama">
        <li><span style={{ background: '#2f8f63' }} /> matched</li>
        <li><span style={{ background: '#e8b04a' }} /> mismatch flagged, or service slow</li>
        <li><span style={{ background: '#8d918c' }} /> service down: fallback message</li>
      </ul>
    </section>
  );
}
