/**
 * What the LiDAR bench's scan pass shows, in the details panel. The diorama illustrates the pipeline's stages on a
 * seeded toy plot; it is not research data, and the note says so.
 */
export function LidarScanNote() {
  return (
    <section className="taskforge-sim" aria-labelledby="lidar-scan-title">
      <h4 id="lidar-scan-title">The scan pass on this bench</h4>
      <p>
        A scanner gantry sweeps a small crop plot. Plants it has passed show as point clouds, each finished plot gets a
        trait bar, and the plot holding an odd plant is flagged for a person to check, the way the automated quality
        checks flag anomalous scans. The plot is a seeded toy that changes every pass, not research data.
      </p>
      <ul className="taskforge-sim__legend" aria-label="Colours in the diorama">
        <li><span style={{ background: '#6aa84f' }} /> plants</li>
        <li><span style={{ background: '#7fe0ff' }} /> point cloud</li>
        <li><span style={{ background: '#3f6fc4' }} /> trait per plot</li>
        <li><span style={{ background: '#e8b04a' }} /> flagged by QC</li>
      </ul>
    </section>
  );
}
