import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { JbhTableCellComponent } from './jbh-table-cell.component';
import { JbhTableRowComponent } from './jbh-table-row.component';
import { JbhTableComponent } from './jbh-table.component';
import { JbhTableCardDirective, JbhTableHeadDirective, JbhTableRowDirective } from './jbh-table-templates';

interface Item {
  id: number;
  name: string;
}

const PARTS = [
  JbhTableComponent,
  JbhTableRowComponent,
  JbhTableCellComponent,
  JbhTableHeadDirective,
  JbhTableRowDirective,
  JbhTableCardDirective
];

@Component({
  standalone: true,
  imports: PARTS,
  template: `
    <jbh-table [rows]="rows" label="Items">
      <ng-template jbhTableHead>
        <jbh-table-row>
          <jbh-table-cell header>Id</jbh-table-cell>
          <jbh-table-cell header>Name</jbh-table-cell>
        </jbh-table-row>
      </ng-template>
      <ng-template jbhTableRow let-item>
        <jbh-table-row>
          <jbh-table-cell class="id">{{ item.id }}</jbh-table-cell>
          <jbh-table-cell>{{ item.name }}</jbh-table-cell>
        </jbh-table-row>
      </ng-template>
    </jbh-table>
  `
})
class TableHostComponent {
  rows: Item[] = [
    { id: 1, name: 'one' },
    { id: 2, name: 'two' },
    { id: 3, name: 'three' }
  ];
}

@Component({
  standalone: true,
  imports: PARTS,
  template: `
    <jbh-table [rows]="rows" label="Items">
      <ng-template jbhTableHead>
        <jbh-table-row><jbh-table-cell header>Name</jbh-table-cell></jbh-table-row>
      </ng-template>
      <ng-template jbhTableRow let-item>
        <jbh-table-row><jbh-table-cell>{{ item.name }}</jbh-table-cell></jbh-table-row>
      </ng-template>
      <ng-template jbhTableCard let-item>
        <span class="card-name">{{ item.name }}</span>
      </ng-template>
    </jbh-table>
  `
})
class CardsHostComponent {
  rows: Item[] = [
    { id: 1, name: 'one' },
    { id: 2, name: 'two' },
    { id: 3, name: 'three' }
  ];
}

@Component({
  standalone: true,
  imports: PARTS,
  template: `
    <jbh-table [rows]="rows" [trackBy]="trackById">
      <ng-template jbhTableHead>
        <jbh-table-row><jbh-table-cell header>Name</jbh-table-cell></jbh-table-row>
      </ng-template>
      <ng-template jbhTableRow let-item>
        <jbh-table-row><jbh-table-cell>{{ item.name }}</jbh-table-cell></jbh-table-row>
      </ng-template>
    </jbh-table>
  `
})
class TrackByHostComponent {
  rows: Item[] = [
    { id: 1, name: 'one' },
    { id: 2, name: 'two' },
    { id: 3, name: 'three' }
  ];
  calls: string[] = [];
  trackById = (index: number, row: Item): number => {
    this.calls.push(`${index}:${row.id}`);
    return row.id;
  };
}

describe('JbhTableComponent', () => {
  function roles(root: HTMLElement, role: string): NodeListOf<HTMLElement> {
    return root.querySelectorAll<HTMLElement>(`[role="${role}"]`);
  }

  it('renders the table roles for 3 rows and 2 header cells', () => {
    const fixture = TestBed.createComponent(TableHostComponent);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;

    expect(roles(root, 'table').length).toBe(1);
    expect(roles(root, 'table')[0].getAttribute('aria-label')).toBe('Items');
    expect(roles(root, 'row').length).toBe(4);
    expect(roles(root, 'columnheader').length).toBe(2);
    expect(roles(root, 'cell').length).toBe(6);
    expect(roles(root, 'rowgroup').length).toBe(2);
    expect(roles(root, 'list').length).toBe(0);
  });

  it('gives each row object to the row template, in order', () => {
    const fixture = TestBed.createComponent(TableHostComponent);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    const ids = Array.from(root.querySelectorAll('jbh-table-cell.id')).map(cell => cell.textContent);

    expect(ids).toEqual(['1', '2', '3']);
  });

  it('renders only the header row when rows is empty', () => {
    const fixture = TestBed.createComponent(TableHostComponent);
    fixture.componentInstance.rows = [];
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;

    expect(roles(root, 'row').length).toBe(1);
  });

  it('renders a list of cards when a card template is present', () => {
    const fixture = TestBed.createComponent(CardsHostComponent);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    const names = Array.from(root.querySelectorAll('.card-name')).map(el => el.textContent);

    expect(roles(root, 'list').length).toBe(1);
    expect(roles(root, 'listitem').length).toBe(3);
    expect(names).toEqual(['one', 'two', 'three']);
    expect(root.querySelector('jbh-table')?.classList).toContain('jbh-table--has-cards');
  });

  it('calls the custom trackBy function with the index and the row', () => {
    const fixture = TestBed.createComponent(TrackByHostComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.calls).toContain('0:1');
    expect(fixture.componentInstance.calls).toContain('2:3');
  });
});
