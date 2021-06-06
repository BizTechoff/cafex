import { Component, OnInit } from '@angular/core';
import { GridSettings, openDialog } from '@remult/angular';
import { Context } from '@remult/core';
import { GridDialogComponent } from '../../../common/grid-dialog/grid-dialog.component';
import { Product } from '../../product/product';
import { Store } from '../store';

@Component({
  selector: 'app-stores-list',
  templateUrl: './stores-list.component.html',
  styleUrls: ['./stores-list.component.scss']
})
export class StoresListComponent implements OnInit {

  stores = new GridSettings(this.context.for(Store),
    {
      allowCRUD: this.context.isSignedIn(),
      numOfColumnsInGrid: 10,
      columnSettings: cur => [
        cur.name,
      ],
      rowButtons: [
        {
          textInMenu: 'Show Products',
          click: async (cur) => await this.showProducts(cur)
        }
      ],
    });

  constructor(private context: Context) { }

  ngOnInit() {
  }

  async showProducts(s: Store) {
    await openDialog(GridDialogComponent, gd => gd.args = {
      title: `Products For ${s.name.value}`,
      settings: new GridSettings(this.context.for(Product), {
        allowCRUD: this.context.isSignedIn(),
        where: cur => cur.sid.isEqualTo(s.id),
        newRow: cur => cur.sid.value = s.id.value,
        numOfColumnsInGrid: 10,
        columnSettings: cur => [
          cur.name,
          cur.quntity,
          cur.price
        ],
      }),
      ok: () => { }
    })
  }

}
