import { Component, OnInit } from '@angular/core';
import { GridSettings } from '@remult/angular';
import { Context } from '@remult/core';
import { FILTER_IGNORE } from '../../../shared/types';
import { ContainerItem } from '../containerItem';

@Component({
  selector: 'app-container-items',
  templateUrl: './container-items.component.html',
  styleUrls: ['./container-items.component.scss']
})
export class ContainerItemsComponent implements OnInit {

  args: {
    in: { conId: string, conName: string },
    out?: { changed: boolean }
  } = { in: { conId: '', conName: '' }, out: { changed: false } };
  containerItems = new GridSettings<ContainerItem>(this.context.for(ContainerItem),
    {
      where: row => {
        let result = FILTER_IGNORE;
        result = result.and(row.conid.isEqualTo(this.args.in.conId))
        return result;
      },
      allowCRUD: false,
      numOfColumnsInGrid: 20,
      columnSettings: row => {
        let result = [];
        result.push(row.pid,
          row.quantity,
          row.createdBy,
          row.created);
        return result;
      },
      gridButtons: [
        {
          textInMenu: () => 'רענן',
          icon: 'refresh',
          click: async () => await this.refresh()
        }
      ]
    })
  constructor(private context: Context) { }

  ngOnInit() {
  }

  async refresh() {
    await this.containerItems.reloadData();
  }

}
