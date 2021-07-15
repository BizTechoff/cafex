import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { GridSettings, openDialog } from '@remult/angular';
import { Context } from '@remult/core';
import { DialogService } from '../../../common/dialog';
import { InputAreaComponent } from '../../../common/input-area/input-area.component';
import { Category } from '../category';
import { CategoryItem } from '../categoryItem';

@Component({
  selector: 'app-category-items',
  templateUrl: './category-items.component.html',
  styleUrls: ['./category-items.component.scss']
})
export class CategoryItemsComponent implements OnInit {

  args: { in: { cid: string, name: string }, out?: { changed: boolean } } = { in: { cid: '', name: '' } };
  readonly = false;

  items = new GridSettings(this.context.for(CategoryItem), {
    where: cur => cur.cid.isEqualTo(this.args.in.cid),
    orderBy: cur => [cur.name],
    newRow: cur => cur.cid.value = this.args.in.cid,
    allowCRUD: false,
    numOfColumnsInGrid: 10,
    columnSettings: cur => [
      cur.name
    ],
    rowButtons: [
      {
        textInMenu: 'מחק שורה',
        visible: () => !this.readonly,
        click: async (cur) => await this.deleteCategoryItem(cur)
      }
    ]
  });

  constructor(private context: Context, private dialog: DialogService, private dialogRef: MatDialogRef<any>) { }

  async ngOnInit() {
    if (!this.args) {
      throw 'לא צויינה קבוצה ראשית';
    }
    let c = await this.context.for(Category).findId(this.args.in.cid);
    if (!c) {
      throw 'לא נמצאה קבוצה ראשית';
    }
    this.args.out = { changed: false };
  }

  close() {
    this.dialogRef.close();
  }

  async refresh() {
    await this.items.reloadData();
  }

  async addCategoryItem() {
    let add = this.context.for(CategoryItem).create();
    add.cid.value = this.args.in.cid;
    let changed = await openDialog(InputAreaComponent,
      it => it.args = {
        title: 'הוספת קטגוריה משנית',
        columnSettings: () => [add.name],
        ok: async () => {
          await add.save();
          this.args.out.changed = true;
        }
      },
      it => it ? it.ok : false);
    if (changed) {
      await this.refresh();
    }
  }

  async deleteCategoryItem(ci: CategoryItem) {
    let yes = await this.dialog.yesNoQuestion(`למחוק קבוצה משנית מ- ${this.args.in.name}`);
    if (yes) {
      await ci.delete();
      await this.refresh();
      await this.dialog.info(`מחיקה בוצעה בהצלחה`);
    }
  }

}
