import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-growth-analysis',
  templateUrl: './growth-analysis.page.html',
  styleUrls: ['./growth-analysis.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GrowthAnalysisPage {}
