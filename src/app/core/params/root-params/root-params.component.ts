import { Component, OnInit } from '@angular/core';
import { sharedParams, TODAY } from '../../../shared/types';
import { addDays } from '../../../shared/utils';
import { rootParams } from './rootParams';

@Component({
  selector: 'app-root-params',
  templateUrl: './root-params.component.html',
  styleUrls: ['./root-params.component.scss']
})
export class RootParamsComponent implements OnInit {

  params = new rootParams();
  refreshed: Date;

  constructor() { }

  ngOnInit(onCahnge?: () => Promise<void>) {
    if (onCahnge) {
      this.params.onChanged = onCahnge;
    }
    this.params.date.value = addDays(TODAY);
  } 

  prevDay() {
    console.log('prevDay');
    console.log(this.params.date.value);
    this.params.date.value = addDays(-1, this.params.date.value);
    console.log(this.params.date.value);
  }
  nextDay() {
    console.log('nextDay');
    console.log(this.params.date.value);
    this.params.date.value = addDays(+1, this.params.date.value);
    console.log(this.params.date.value);
  }
  async refresh() {
    await this.params.onChanged();
    this.refreshed = addDays(TODAY, undefined, false);
  }

}
