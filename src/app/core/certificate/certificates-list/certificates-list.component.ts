import { Component, OnInit } from '@angular/core';
import { GridSettings, openDialog } from '@remult/angular';
import { Context, NumberColumn } from '@remult/core';
import { DialogService } from '../../../common/dialog';
import { GridDialogComponent } from '../../../common/grid-dialog/grid-dialog.component';
import { addDays } from '../../../shared/utils';
import { Roles } from '../../../users/roles';
import { CeritificateItem } from '../ceritificateItem';
import { Ceritificate } from '../certificate';
// import { Order } from '../order';
// import { OrderItem } from '../orderItem';

@Component({
  selector: 'app-certificates-list',
  templateUrl: './certificates-list.component.html',
  styleUrls: ['./certificates-list.component.scss']
})
export class CertificatesListComponent implements OnInit {
 
  count = new NumberColumn();
  certificates = new GridSettings(this.context.for(Ceritificate),
    {
      orderBy: cur => [cur.uid, { column: cur.docNum, descending: true }],
      newRow: cur => {
        cur.date.value = addDays();
      },
      allowCRUD: this.context.isAllowed(Roles.admin) || this.context.isAllowed(Roles.agent),
      allowDelete: false,
      numOfColumnsInGrid: 10,
      columnSettings: cur => [
        cur.uid,
        cur.type,
        cur.docNum,
        cur.date,
        cur.neto,
        cur.discountPcnt,
        cur.discount,
        cur.priceAfterDiscount,
        cur.vat,
        cur.priceInvoice,
        cur.payed,
        cur.transfered,
        cur.closeSent,
        cur.canceled
      ],
      rowButtons: [
        {
          textInMenu: 'הצג שורות',
          icon: 'shopping_bag',
          click: async (cur) => await this.showOrderItems(cur),
          visible: cur => !cur.isNew(),
          showInLine: true,
        },
        {
          textInMenu: 'מחק תעודה',
          icon: 'delete',
          click: async (cur) => await this.deleteOrder(cur),
          visible: cur => !cur.isNew()
        }
      ],
    });

  constructor(private context: Context, private dialog: DialogService) { }

  ngOnInit() {
  }

  async deleteOrder(o: Ceritificate) {
    // let count = await this.context.for(OrderItem).count(cur => cur..isEqualTo(o.id));
    // if (count > 0) {
    //   await this.dialog.error(` נמצאו ${count} שורות, לא ניתן למחוק הזמנה זו`);
    // }
    // else {
    //   let yes = await this.dialog.confirmDelete(`הזמנה ${o.orderNum.value}`);
    //   if (yes) {
    //     await o.delete();
    //   }
    // }
  }

  async showOrderItems(c: Ceritificate) {
    await openDialog(GridDialogComponent, gd => gd.args = {
      title: `שורות תעודה ${c.docNum.value}`,
      settings: new GridSettings(this.context.for(CeritificateItem), {
        where: cur => cur.cid.isEqualTo(c.id),
        newRow: cur => cur.cid.value = c.id.value,
        allowCRUD: this.context.isSignedIn(),
        numOfColumnsInGrid: 10,
        columnSettings: cur => [
          { column: cur.pid, width: '400' },
          cur.quantity,
          cur.quantitySent,
          cur.quantityLeft,
          cur.priceSale,
          cur.priceBeforeDiscount,
          cur.discountPcnt,
          cur.discount,
          cur.priceAfterDiscount
        ],
      }),
      ok: () => { }
    })
  }

}
