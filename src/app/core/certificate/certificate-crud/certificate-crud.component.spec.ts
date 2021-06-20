import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificateCrudComponent } from './certificate-crud.component';

describe('CertificateCrudComponent', () => {
  let component: CertificateCrudComponent;
  let fixture: ComponentFixture<CertificateCrudComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CertificateCrudComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CertificateCrudComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
