import { Component, OnInit } from '@angular/core';
import { extend, GridSettings, openDialog } from '@remult/angular';
import { Context, ValueListTypeInfo } from '@remult/core';
import { DialogService } from '../../../common/dialog';
import { DynamicServerSideSearchDialogComponent } from '../../../common/dynamic-server-side-search-dialog/dynamic-server-side-search-dialog.component';
import { GridDialogComponent } from '../../../common/grid-dialog/grid-dialog.component';
import { InputAreaComponent } from '../../../common/input-area/input-area.component';
import { addDays } from '../../../shared/utils';
import { Roles } from '../../../users/roles';
import { UserId, Users } from '../../../users/users';
import { CeritificateItem } from '../../certificate/ceritificateItem';
import { Ceritificate } from '../../certificate/certificate';
import { Order } from '../../order/order';
import { OrderItem } from '../../order/orderItem';
import { Product } from '../../product/product';

@Component({
  selector: 'app-agent-store-certificates',
  templateUrl: './agent-store-certificates.component.html',
  styleUrls: ['./agent-store-certificates.component.scss']
})
export class AgentStoreCertificatesComponent implements OnInit {

  store = extend(new UserId(this.context, Roles.store, { caption: 'בחר בית קפה', valueChange: async () => { await this.refresh(true); } }))
    .dataControl(dcs => {
      dcs.hideDataOnInput = true;
      dcs.clickIcon = 'search';
      dcs.getValue = () => this.store.item.name;
      dcs.click = async () => {
        await openDialog(DynamicServerSideSearchDialogComponent,
          dlg => dlg.args(Users, {
            onClear: () => this.store.value = '',
            onSelect: cur => this.store.value = cur.id.value,
            searchColumn: cur => cur.name,
            where: (cur) => cur.store.isEqualTo(true)
          })
        );
      };
    });
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
            click: async (cur) => await this.showCertificateItems(cur),
            visible: cur => !cur.isNew(),
            showInLine: true,
          },
          {
            textInMenu: 'מחק תעודה',
            icon: 'delete',
            click: async (cur) => await this.deleteCertificate(cur.id.value),
            visible: cur => !cur.isNew()
          }
        ],
      });
  constructor(private context: Context, private dialog: DialogService) { }

  async ngOnInit() {
    let u = await this.context.for(Users).findId(this.context.user.id);
    if (u.defaultStore.value) {
      this.store.value = u.defaultStore.value;
    }
  }

  async refresh(changed = false) {
    if (changed) {
      let u = await this.context.for(Users).findId(this.context.user.id);
      u.defaultStore.value = this.store.value;
      await u.save();
    }
    await this.certificates.reloadData();
  }

  async deleteCertificate(cid?: string) {
    let cer = await this.context.for(Ceritificate).findId(cid);
    if (cer) {
      let num = cer.docNum.value;
      let sure = await this.dialog.confirmDelete(`תעודה ${num} ל: ${this.store.item.name.value}`);
      if (sure) {
        await cer.delete();
        await this.refresh();
        await this.dialog.info(`תעודה ${num} נמחקה`);
      }
    }
    else {
      await this.dialog.error("תעודה לא קיימת");
      console.log(`ERROR: AgentStoreOrdersComponent.deleteOrder(oid='${cid}') - Order Not Exists`);
    }
  }

  async addCertificate(){
    if (this.store.item.id.value) {
      let cert = this.context.for(Ceritificate).create();
      cert.uid.value = this.store.item.id.value;
      cert.date.value = addDays();
      // if (sid) {
      //   order = await this.context.for(Ceritificate).findId(oid);
      //   if (!(order)) {
      //     this.dialog.error(`הזמנה ${oid} לא נמצאה`);
      //     return;
      //   }
      // }
      // if (order.isNew()) {
      // }
      await openDialog(InputAreaComponent, thus => thus.args = {
        title: `הוספת תעודה ל: ${this.store.item.name.value}`,
        columnSettings: () => [
          { column: cert.docNum, visible: () => { return cert.docNum.value > 0; } },
          cert.uid,
          cert.type,
          cert.docNum,
          cert.date,
          cert.neto,
          cert.discountPcnt,
          cert.discount,
          cert.priceAfterDiscount,
          cert.vat,
          cert.priceInvoice,
          cert.payed,
          cert.transfered,
          cert.closeSent,
          cert.canceled
        ],
        ok: async () => {
          await cert.save();
          await this.refresh();
          //await order.reload();
        }
      });
    }
    else {
      this.dialog.error('יש לבחור בית קפה');
    }
  }

  async showCertificateItems(c: Ceritificate) {
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
