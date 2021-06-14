import { Component, OnInit } from '@angular/core';
import { GridSettings, openDialog } from '@remult/angular';
import { Context } from '@remult/core';
import { DialogService } from '../../../common/dialog';
import { InputAreaComponent } from '../../../common/input-area/input-area.component';
import { OrderItem } from '../../order/orderItem';
import { Product } from '../product';

@Component({
  selector: 'app-products-list',
  templateUrl: './products-list.component.html',
  styleUrls: ['./products-list.component.scss']
})
export class ProductsListComponent implements OnInit {

  products = new GridSettings(this.context.for(Product),
    {
      orderBy: cur => cur.sid,
      allowCRUD: false,
      allowDelete: false,
      numOfColumnsInGrid: 10,
      columnSettings: cur => [
        cur.firstCategory,
        cur.secondCategory,
        cur.sku,
        cur.name,
        cur.price,
        cur.quntity
      ],
      rowButtons: [
        {
          textInMenu: 'Edit Product',
          icon: 'edit',
          click: async (cur) => await this.editProduct(cur.id.value),
          visible: cur => !cur.isNew()
        },
        {
          textInMenu: 'Delete Product',
          icon: 'delete',
          click: async (cur) => await this.deleteProduct(cur.id.value),
          visible: cur => !cur.isNew()
        }
      ],
    });
  constructor(private context: Context, private dialog: DialogService) { }

  ngOnInit() {
  }

  async refresh() {
    await this.products.reloadData();
  }

  async editProduct(pid: string) {
    let p = await this.context.for(Product).findId(pid);
    if (p) {
      await openDialog(InputAreaComponent, thus => thus.args = {
        title: `Edit Product ${p.name.value}`,
        columnSettings: () => [
          p.firstCategory,
          p.secondCategory,
          p.sku,
          p.name,
          p.price,
          p.quntity
        ],
        ok: async () => {
          await p.save();
          await this.refresh();
          //await order.reload();
        }
      });
    }
  }

  async deleteProduct(pid: string) {
    let count = await this.context.for(OrderItem).count(cur => cur.pid.isEqualTo(pid));
    if (count > 0) {
      await this.dialog.error(` Found ${count} OrderItems, Can NOT delete product`);
    }
    else {
      let p = await this.context.for(Product).findId(pid);
      if (p) {
        let yes = await this.dialog.confirmDelete(` product ${p.name.value}`);
        if (yes) {
          await p.delete();
        }
      }
    }
  }

}
