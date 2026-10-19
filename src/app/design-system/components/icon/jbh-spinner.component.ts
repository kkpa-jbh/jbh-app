import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IonSpinner } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'jbh-spinner',
  standalone: true,
  imports: [IonSpinner, TranslatePipe],
  templateUrl: './jbh-spinner.component.html',
  styleUrls: ['./jbh-spinner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JbhSpinnerComponent {}
