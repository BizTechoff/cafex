import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { BusyService } from '@remult/angular';
import { Context, Entity, EntityWhereItem, SpecificEntityHelper, StringColumn } from '@remult/core';
import { FILTER_IGNORE } from '../../shared/types';

@Component({
  selector: 'app-dynamic-server-side-search-dialog',
  template: `

<div style="display: flex; flex-direction: row; justify-content: flex-start;">
  <!-- <button mat-icon-button mat-dialog-close title="סגור" (click)="this.dialogRef.close()">
      <mat-icon>close</mat-icon>
  </button> -->
  <h1 mat-dialog-title>בחירת {{title}}</h1>
</div>

<!-- <mat-label *ngIf="items.length === 0">לא נמצאו רשומות לבחירה</mat-label> -->
<!-- <div *ngIf="items.length > 0"> -->
  <div mat-dialog-content>
      <form (submit)="selectFirst()">
          <mat-form-field>
              <input matInput [(ngModel)]="searchString.value" [ngModelOptions]="{standalone: true}"> 
          </mat-form-field>
      </form>
      <mat-nav-list role="list" *ngIf="items">
          <ng-container *ngFor="let o of items">
              <mat-list-item role="listitem" style="height:36px"
                  (click)="select(o)">
                  {{_args.searchColumn(o).value}}
              </mat-list-item>
              <mat-divider ></mat-divider>
          </ng-container> 
          <ng-container *ngIf="items.length === 0 && this.loaded">
              <mat-list-item role="listitem" style="height:36px">
                 <i> {{ '(לא נמצאו רשומות תואמות)' }} </i>
              </mat-list-item>
              <mat-divider ></mat-divider>
          </ng-container>
      </mat-nav-list>
  </div>
  <div mat-dialog-actions>
    <div style="display: flex; flex-direction: row; justify-content: space-between; flex-grow: 1;">
        <button mat-flat-button title="נקה בחירה"  (click)="clear()">
            <mat-icon>backspace</mat-icon>
            <mat-label style="padding: 7px;">נקה בחירה</mat-label>
        </button>
    </div>
  <!-- </div>   -->
<div>  `,
  styles: []
})
export class DynamicServerSideSearchDialogComponent implements OnInit {

  loaded = false;
  constructor(private context: Context, private busy: BusyService, public dialogRef: MatDialogRef<any>) { }
  items: Entity[] = [];
  async ngOnInit() {
    await this.loadProducts();
    this.loaded = true;
  }
  async loadProducts() {
    // console.log(this._args.where);
    this.items = await this.entityContext.find({

      where: [this._args.where, p =>
        this.searchString.value ? this._args.searchColumn(p).contains(this.searchString)
          : FILTER_IGNORE,
      ],
      orderBy: p => [{ column: this._args.searchColumn(p) }],
    });
  }

  searchString = new StringColumn({
    caption: 'חיפוש',
    valueChange: async () => {
      // the call to `this.busy.donotWait` causes the load products method to run without the "Busy" circle in the ui
      await this.busy.donotWait(async () => await this.loadProducts());
    }
  })

  entityContext: SpecificEntityHelper<any, Entity>;
  _args: dynamicSearchDialog<any>;
  title: string;

  args<entity extends Entity>(entityType: {
    new(...args: any[]): entity
  }, args: dynamicSearchDialog<entity>) {
    this._args = args;
    this.entityContext = this.context.for(entityType);
    this.title = this.entityContext.create().defs.caption;

  }
  clear() {
    this._args.onClear();
    this.dialogRef.close();
  }
  select(p: Entity) {
    this._args.onSelect(p);
    this.dialogRef.close();
  }
  selectFirst() {
    if (this.items.length > 0)
      this.select(this.items[0]);
  }

}
export interface dynamicSearchDialog<T extends Entity> {
  onClear?: () => void;
  onSelect: (item: T) => void;
  searchColumn: (item: T) => StringColumn;
  where?: EntityWhereItem<T>;

}