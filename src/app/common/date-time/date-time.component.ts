import { Component, Input, OnInit } from '@angular/core';
import { DateColumn } from '@remult/core';
import { TimeColumn } from '../../shared/types';

@Component({
  selector: 'app-date-time',
  templateUrl: './date-time.component.html',
  styleUrls: ['./date-time.component.scss']
})
export class DateTimeComponent implements OnInit {

  @Input()
  date = new DateColumn({caption: 'תאריך'})
  @Input()
  time = new TimeColumn({caption: 'שעה'})
  @Input()
  title = 'תאריך ושעה'

  constructor() { }

  ngOnInit() {
  }

}
