import { Component, OnInit } from '@angular/core';
import { extend, GridSettings, openDialog } from '@remult/angular';
import { BoolColumn, Context, NumberColumn, StringColumn } from '@remult/core';
import { DialogService } from '../../../common/dialog';
import { DynamicServerSideSearchDialogComponent } from '../../../common/dynamic-server-side-search-dialog/dynamic-server-side-search-dialog.component';
import { FILTER_IGNORE } from '../../../shared/types';
import { Roles } from '../../../users/roles';
import { UserId, Users } from '../../../users/users';
import { Container } from '../container';
import { ContainerItemsComponent } from '../container-items/container-items.component';
import { ContainerItem } from '../containerItem';

@Component({
  selector: 'app-containers-list',
  templateUrl: './containers-list.component.html',
  styleUrls: ['./containers-list.component.scss']
})
export class ContainersListComponent implements OnInit {
  storage = { store: '', status: '', type: '' };
  readonly = false;
  // showMyContainer =new BoolColumn({caption:'הצג את המחסן שלי', valueChange: async() => await this.refresh()});
  store = extend(new UserId(this.context, {
    caption: 'בחירת בית קפה',
    valueChange: async () => {
      if (!this.loading) {
        await this.saveUserDefaults();
      }
      await this.refresh();
      if (this.store.value && this.containers && this.containers.items && this.containers.items.length == 1) {
        await this.showContainerItems(this.containers.items[0]);
      }
    }
  }))
    .dataControl(it => {
      it.cssClass = 'cfx-font-bold',
        it.hideDataOnInput = true;
      it.clickIcon = 'search';
      it.getValue = () => this.store.item.name;
      it.readOnly = () => this.isStore();
      it.click = async () => {
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

  count = new NumberColumn({ caption: 'מס.פריטים' });
  hasMinus = new StringColumn({ caption: 'במינוס' });
  containers: GridSettings<Container>;

  constructor(private context: Context, private dialog: DialogService) { }

  async ngOnInit() {
    await this.loadUserDefaults();
    await this.initGrid();
  }

  async initGrid() {
    this.containers = new GridSettings<Container>(this.context.for(Container),
      {
        where: row => {
          let result = FILTER_IGNORE;
          if (this.store.value) {
            result = result.and(row.uid.isEqualTo(this.store));
            // .or(row.uid.isEqualTo(this.context.user.id));
          }
          else {
            // result= result.and(row.id.isEqualTo('-1'));
          }

          // let userFilter = row.uid.item.store.isEqualTo(true);//or store
          // if (this.isTechnician()) {
          //   // userFilter = userFilter.or(row.uid.isEqualTo(this.context.user.id));//or current technical user
          // }
          // result = result.and(userFilter);
          return result;
        },
        orderBy: row => [row.name],
        // newRow: cur => cur.cid.value = this.args.in.cid,
        allowCRUD: false,
        numOfColumnsInGrid: 10,
        columnSettings: cur => [
          { column: cur.uid, caption: this.isTechnician() ? 'בית קפה\\טכנאי' : 'בית קפה\\טכנאי' },
          cur.name,
          { column: this.count, readOnly: o => true, width: '100', getValue: c => c.getCount(), hideDataOnInput: true, allowClick: (o) => false },//, width: '100
          // { column: this.hasMinus, readOnly: o => true, width: '100', getValue: c => c.getMinus(), hideDataOnInput: true, allowClick: (o) => false },//, width: '100
          cur.createdBy,
          cur.created
        ],
        gridButtons: [
          {
            textInMenu: () => 'רענן',
            icon: 'refresh',
            click: async () => await this.refresh()
          }
        ],
        rowButtons: [
          {
            icon: 'inventory',
            showInLine: true,
            textInMenu: 'הצג פריטים',
            visible: (row) => !this.readonly,// && (!row.uid.isTechnical() || row.uid.isAdmin()),// || cur.uid.value === this.context.user.id),
            click: async (row) => await this.showContainerItems(row)
          },
          {
            textInMenu: 'מחק שורה',
            icon: 'delete',
            visible: () => !this.readonly && this.isAdmin(),
            click: async (cur) => await this.deleteContainer(cur)
          }
        ]
      });
  }

  loading = false;
  async loadUserDefaults() {
    let defs = localStorage.getItem('user-defaults');
    if (defs) {
      this.storage = JSON.parse(defs);
      if (this.storage) {
        this.loading = true;
        this.store.value = this.storage.store;
        this.loading = false;
      }
    }
  }
  async saveUserDefaults() {
    this.storage.store = this.store.value;
    localStorage.setItem('user-defaults', JSON.stringify(this.storage));
  }

  isStore() {
    return this.context.isAllowed(Roles.store);
  }
  isAdmin() {
    return this.context.isAllowed(Roles.admin);
  }
  isAgent() {
    return this.context.isAllowed(Roles.agent);
  }
  isTechnician() {
    return this.context.isAllowed(Roles.technician) as boolean;
  }

  async refresh() {
    if (this.containers) {
      await this.containers.reloadData();
    }
  }

  async showMyContainer() {
    let con = await this.context.for(Container).findFirst({
      where: row => row.uid.isEqualTo(this.context.user.id)
    });
    if (!con) {
      this.dialog.error('לא הוקם לך מחסן עדיין');
    } else {
      await this.showContainerItems(con);
    }
  }

  async showContainerItems(c: Container) {
    let hide = false;// this.isStore() && !o.type.isNormal();
    if (!hide) {
      let changed = await openDialog(ContainerItemsComponent,
        it => it.args = { in: { conId: c.id.value, conName: c.name.value } },
        it => it && it.args.out ? it.args.out.changed : false);
      if (changed) {
        await this.refresh();
      }
    }
  }

  async deleteContainer(c: Container) {
    let count = await this.context.for(ContainerItem).count(row => row.id.isEqualTo(c.id))
    if (count > 0) {
      this.dialog.info('קיימים פריטים למחסן, לא ניתן למחוק')
    }
    else {
      let yes = await this.dialog.yesNoQuestion('למחוק ' + c.name.value + '?')
      if (yes) {
        await c.delete()
      }
    }
  }

}
