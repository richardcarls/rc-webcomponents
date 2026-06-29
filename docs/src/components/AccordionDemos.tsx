import { DemoFrame } from './DemoFrame';

export function SingleAccordionDemo() {
  return (
    <DemoFrame>
      <rc-accordion name="docusaurus-single-open-example">
        <details open>
          <summary>Shipping options</summary>
          <div>
            <p>Standard delivery leaves the warehouse in two business days.</p>
            <p>Expedited orders move first when inventory is already reserved.</p>
          </div>
        </details>
        <details>
          <summary>Billing contacts</summary>
          <div>
            <p>Add a finance contact when invoices should go somewhere other than the account owner.</p>
            <p>Receipts and renewal reminders use the same contact list.</p>
          </div>
        </details>
        <details>
          <summary>Notification preferences</summary>
          <div>
            <p>Weekly summaries are useful for quiet teams; incident alerts should stay immediate.</p>
            <p>Arrow keys move between summaries after upgrade.</p>
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
          <summary>Product filters</summary>
          <div>
            <p>Keep category, availability, and rating groups open while comparing inventory.</p>
          </div>
        </details>
        <details open>
          <summary>Saved views</summary>
          <div>
            <p>
              Teams often review several saved views at once. The <code>multiple</code> attribute
              disables exclusive-open coordination.
            </p>
          </div>
        </details>
      </rc-accordion>
    </DemoFrame>
  );
}

export function DisclosureAccordionDemo() {
  return (
    <DemoFrame>
      <rc-accordion name="docusaurus-disclosure-example">
        <rc-disclosure>
          <details open>
            <summary>Release checklist</summary>
            <div>
              <p>Wrapped disclosures still participate in accordion coordination.</p>
              <p>Use this pattern when a disclosure component owns extra styling or behavior.</p>
            </div>
          </details>
        </rc-disclosure>
        <rc-disclosure>
          <details id="docusaurus-fragment-example">
            <summary>Deep-linked section</summary>
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
            <summary>Audit notes</summary>
            <div>
              <p>Use the preview controls to compare the same native markup across themes.</p>
            </div>
          </details>
        </rc-disclosure>
      </rc-accordion>
    </DemoFrame>
  );
}
