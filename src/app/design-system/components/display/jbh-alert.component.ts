import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { JbhIconComponent } from '../icon/jbh-icon.component';

export type JbhAlertTone = 'error' | 'warning' | 'info' | 'success';

const ALERT_ICONS: Readonly<Record<JbhAlertTone, string>> = {
  error: 'alert-circle',
  warning: 'warning-outline',
  info: 'information-circle-outline',
  success: 'checkmark-circle'
};

/** Inline message box. Errors use `role="alert"`; the other tones use `role="status"`. */
@Component({
  selector: 'jbh-alert',
  standalone: true,
  imports: [JbhIconComponent],
  templateUrl: './jbh-alert.component.html',
  styleUrls: ['./jbh-alert.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
    '[attr.role]': 'tone() === "error" ? "alert" : "status"'
  }
})
export class JbhAlertComponent {
  readonly tone = input<JbhAlertTone>('info');

  protected readonly iconName = computed(() => ALERT_ICONS[this.tone()]);
  protected readonly hostClasses = computed(() => `jbh-alert jbh-alert--${this.tone()}`);
}
