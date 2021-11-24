import { Component, OnInit } from '@angular/core';
import { extend, GridSettings, openDialog } from '@remult/angular';
import { Context } from '@remult/core';
import { DialogService } from '../../../common/dialog';
import { DynamicServerSideSearchDialogComponent } from '../../../common/dynamic-server-side-search-dialog/dynamic-server-side-search-dialog.component';
import { FILTER_IGNORE } from '../../../shared/types';
import { Roles } from '../../../users/roles';
import { UserId, Users } from '../../../users/users';
import { Container } from '../container';
import { ContainerItemsComponent } from '../container-items/container-items.component';

@Component({
  selector: 'app-containers-list',
  templateUrl: './containers-list.component.html',
  styleUrls: ['./containers-list.component.scss']
})
export class ContainersListComponent implements OnInit {
  readonly = false;
  // showMyContainer =new BoolColumn({caption:'הצג את המחסן שלי', valueChange: async() => await this.refresh()});
  store = extend(new UserId(this.context, Roles.store, {
    caption: 'בחירת בית קפה',
    valueChange: async () => {
      await this.saveUserDefaults();
      await this.refresh();
      if (this.containers.items.length == 1) {
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
  containers = new GridSettings<Container>(this.context.for(Container),
    {
      where: row => {
        let result = FILTER_IGNORE;
        if (this.store.value) {
          result = result.and(row.uid.isEqualTo(this.store));
            // .or(row.uid.isEqualTo(this.context.user.id));
        }
        else{
          result= result.and(row.id.isEqualTo('-1'));
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
        { column: cur.uid, caption: this.isTechnician() ? 'בית קפה' : 'בית קפה\\טכנאי' },
        cur.name,
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
          textInMenu: 'הצג פריטים',
          visible: () => !this.readonly,
          click: async (cur) => await this.showContainerItems(cur)
        }//,
        // {
        //   textInMenu: 'מחק שורה',
        //   visible: () => !this.readonly,
        //   click: async (cur) => await this.deleteContainer(cur)
        // }
      ]
    });
  constructor(private context: Context, private dialog: DialogService) { }

  ngOnInit() {
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
    return this.context.isAllowed(Roles.technician);
  }

  async saveUserDefaults() {
    if (!this.isStore()) {
      if (this.store.value) {
        let u = await this.context.for(Users).findId(this.context.user.id);
        u.defaultStore.value = this.store.value;
        await u.save();
      }
    }
  }

  async refresh() {
    await this.containers.reloadData();
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

}
