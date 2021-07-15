import { Component, OnInit } from '@angular/core';
import { GridSettings, openDialog } from '@remult/angular';
import { Context, NumberColumn } from '@remult/core';
import { DialogService } from '../../../common/dialog';
import { Roles } from '../../../users/roles';
import { Category } from '../category';
import { CategoryItemsComponent } from '../category-items/category-items.component';
import { CategoryItem } from '../categoryItem';

@Component({
  selector: 'app-categories-list',
  templateUrl: './categories-list.component.html',
  styleUrls: ['./categories-list.component.scss']
})
export class CategoriesListComponent implements OnInit {

  count = new NumberColumn({ caption: 'משניות' });
  categories = new GridSettings<Category>(this.context.for(Category),
    {
      orderBy: cur => cur.name,
      allowCRUD: this.context.isAllowed(Roles.admin),
      allowDelete: false,
      numOfColumnsInGrid: 10,
      columnSettings: cur => [
        cur.name,
        { column: this.count, readOnly: o => true, getValue: c => c.getCount(), hideDataOnInput: true, width: '85', allowClick: (c) => false }
      ],
      rowButtons: [
        {
          textInMenu: 'הצג קבוצות משניות',
          icon: 'shopping_bag',
          click: async (cur) => await this.showCategoryItems(cur),
          visible: cur => !cur.isNew(),
          showInLine: true,
        },
        {
          textInMenu: 'מחק קבוצה ראשית',
          icon: 'delete',
          click: async (cur) => await this.deleteCategory(cur),
          visible: cur => !cur.isNew()
        }
      ],
    });

  constructor(private context: Context, private dialog: DialogService) { }

  ngOnInit() {
  }

  async refresh() {
    await this.categories.reloadData();
  }

  async deleteCategory(c: Category) {
    let count = await this.context.for(CategoryItem).count(cur => cur.cid.isEqualTo(c.id));
    if (count > 0) {
      await this.dialog.error(` נמצאו ${count} קבוצות משניות, לא ניתן למחוק קבוצה ראשית זו`);
    }
    else {
      let yes = await this.dialog.confirmDelete(`קבוצה ראשית ${c.name.value}`);
      if (yes) {
        await c.delete();
      }
    }
  }

  async showCategoryItems(c: Category) {
    let changed = await openDialog(CategoryItemsComponent,
      it => it.args = { in: { cid: c.id.value, name: c.name.value } },
      it => it ? it.args.out.changed : false);
    if (changed) {
      await this.refresh();
    }
  }

}
