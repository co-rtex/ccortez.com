/**
 * What the Phoenix-Aid bench's extraction line shows, in the details panel. The scene is a fixed illustration on a
 * made-up protocol; the note says so.
 */
export function ExtractionNote() {
  return (
    <section className="taskforge-sim" aria-labelledby="phoenix-extraction-title">
      <h4 id="phoenix-extraction-title">The extraction line on this bench</h4>
      <p>
        Each field of a protocol rides a queue into the extractor and comes out as a draft. At the validation gate a
        valid draft goes onto the draft eCRF board; an invalid one turns amber and goes back through the queue to be
        retried, so nothing unchecked reaches the board. The board is a draft for people to review. The protocol is
        made up: this shows the pipeline&apos;s shape, with no study, patient or sponsor data.
      </p>
      <ul className="taskforge-sim__legend" aria-label="Colours in the diorama">
        <li><span style={{ background: '#f1ead8' }} /> protocol field</li>
        <li><span style={{ background: '#5aa3e8' }} /> drafted</li>
        <li><span style={{ background: '#e8b04a' }} /> failed validation, retried</li>
        <li><span style={{ background: '#2f8f63' }} /> on the draft board</li>
      </ul>
    </section>
  );
}
