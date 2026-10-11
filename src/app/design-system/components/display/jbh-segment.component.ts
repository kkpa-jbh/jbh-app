import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { IonLabel, IonSegment, IonSegmentButton, SegmentChangeEventDetail } from '@ionic/angular/standalone';
import { JbhIconComponent } from '../icon/jbh-icon.component';

export interface JbhSegmentOption {
  value: string;
  label: string;
  /** Icon name from the icon registry. */
  icon?: string;
}

/** Tab-like switch between a few values. Buttons are direct children of the segment, as Ionic expects. */
@Component({
  selector: 'jbh-segment',
  standalone: true,
  imports: [IonSegment, IonSegmentButton, IonLabel, JbhIconComponent],
  templateUrl: './jbh-segment.component.html',
  styleUrls: ['./jbh-segment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JbhSegmentComponent {
  readonly options = input.required<readonly JbhSegmentOption[]>();
  /** Selected option value. Two-way: `[(value)]`. */
  readonly value = model<string>('');
  /** Accessible name of the group. */
  readonly label = input<string>();

  // The standalone Ionic proxies do not declare `ionChange` as an output, so the template event is a plain `Event`.
  protected onChange(event: Event): void {
    const next = (event as CustomEvent<SegmentChangeEventDetail>).detail?.value;
    if (next === undefined || next === null) return;
    this.value.set(String(next));
  }
}
