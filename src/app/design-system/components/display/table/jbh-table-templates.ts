import { Directive, TemplateRef, inject } from '@angular/core';

/** Context of the row and card templates. `$implicit` is typed `any`, as in the Angular CDK table. */
export interface JbhTableRowContext {
  $implicit: any;
  index: number;
}

/** Marks the `ng-template` that renders the header row. */
@Directive({ selector: 'ng-template[jbhTableHead]', standalone: true })
export class JbhTableHeadDirective {
  readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef);
}

/** Marks the `ng-template` that renders one row. Use `let-item` for the row object. */
@Directive({ selector: 'ng-template[jbhTableRow]', standalone: true })
export class JbhTableRowDirective {
  readonly templateRef = inject<TemplateRef<JbhTableRowContext>>(TemplateRef);
}

/** Marks the optional `ng-template` that renders one row as a card on small screens. */
@Directive({ selector: 'ng-template[jbhTableCard]', standalone: true })
export class JbhTableCardDirective {
  readonly templateRef = inject<TemplateRef<JbhTableRowContext>>(TemplateRef);
}
