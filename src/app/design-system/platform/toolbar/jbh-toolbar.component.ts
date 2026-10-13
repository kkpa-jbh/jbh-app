import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonHeader,
  IonMenuButton,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { JbhIconComponent } from '../../components/icon/jbh-icon.component';
import { registerJbhIcons } from '../../components/icon/icon-registry';

/** One button at the end of the toolbar. Same shape as the app header action. */
export interface JbhToolbarAction {
  id: string;
  /** Icon name from the icon registry. */
  icon: string;
  /** Accessible name. The `id` is used when there is no label. */
  label?: string;
  handler: () => void;
}

/** Page toolbar: menu or back button, title and action buttons. The title is already translated text. */
@Component({
  selector: 'jbh-toolbar',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonButtons, IonBackButton, IonMenuButton, IonTitle, IonButton, JbhIconComponent],
  templateUrl: './jbh-toolbar.component.html',
  styleUrls: ['./jbh-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // `title` is also a global HTML attribute: without this a static title="..." shows a browser tooltip.
  host: { '[attr.title]': 'null' }
})
export class JbhToolbarComponent {
  readonly title = input<string>('');
  /** Shows a back button instead of the menu button. */
  readonly back = input<boolean>(false);
  /** Where the back button goes when there is no history to go back to. */
  readonly backHref = input<string | undefined>(undefined);
  readonly actions = input<readonly JbhToolbarAction[]>([]);

  constructor() {
    registerJbhIcons();
  }
}
