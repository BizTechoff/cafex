import { Component, OnInit } from '@angular/core';
import { GridSettings } from '@remult/angular';
import { Context } from '@remult/core';
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
    ]
  }); 

  constructor(private context:Context) { }

  ngOnInit() {
  }

}
