import { Deck } from "./_components/deck";
import { DemoProvider } from "./_lib/store";

/**
 * /demo — the sales presentation.
 *
 * Everything it shows is local mock content held in React state, so it needs
 * no session, makes no database call, and survives a patchy connection at a
 * client's office once the page has loaded. Refreshing it changes nothing
 * anywhere: there is no production state to change.
 */
export default function DemoPage() {
  return (
    <DemoProvider>
      <Deck />
    </DemoProvider>
  );
}
