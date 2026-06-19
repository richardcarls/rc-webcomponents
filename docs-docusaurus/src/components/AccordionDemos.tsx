import { DemoFrame } from './DemoFrame';

export function SingleAccordionDemo() {
  return (
    <DemoFrame>
      <rc-accordion name="docusaurus-single-open-example">
        <details open>
          <summary>Heading 1</summary>
          <div>
            <p>Lorem ipsum dolor sit amet consectetur adipisicing elit.</p>
            <p>Harum, nobis.</p>
          </div>
        </details>
        <details>
          <summary>Heading 2</summary>
          <div>
            <p>Sit a beatae, similique perspiciatis error esse voluptatem.</p>
            <p>Panel content remains native light DOM.</p>
          </div>
        </details>
        <details>
          <summary>Heading 3</summary>
          <div>
            <p>Arrow keys move between summaries after upgrade.</p>
            <p>The browser still owns details semantics.</p>
          </div>
        </details>
      </rc-accordion>
    </DemoFrame>
  );
}

export function MultipleAccordionDemo() {
  return (
    <DemoFrame>
      <rc-accordion multiple>
        <details open>
          <summary>Heading 1</summary>
          <div><p>This panel can stay open while other panels expand.</p></div>
        </details>
        <details open>
          <summary>Heading 2</summary>
          <div><p>The <code>multiple</code> attribute disables exclusive-open coordination.</p></div>
        </details>
      </rc-accordion>
    </DemoFrame>
  );
}

export function DisclosureAccordionDemo() {
  return (
    <DemoFrame material>
      <rc-accordion name="docusaurus-disclosure-example">
        <rc-disclosure>
          <details open>
            <summary>Heading 1</summary>
            <div><p>Wrapped disclosures still participate in accordion coordination.</p></div>
          </details>
        </rc-disclosure>
        <rc-disclosure>
          <details id="docusaurus-fragment-example">
            <summary>Fragment Example</summary>
            <div>
              <p>
                This panel opens automatically when the URL hash matches{' '}
                <a href="#docusaurus-fragment-example">#docusaurus-fragment-example</a>.
              </p>
            </div>
          </details>
        </rc-disclosure>
        <rc-disclosure>
          <details>
            <summary>Heading 3</summary>
            <div><p>The Material theme is scoped to this demo frame.</p></div>
          </details>
        </rc-disclosure>
      </rc-accordion>
    </DemoFrame>
  );
}
