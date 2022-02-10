import { extend, openDialog } from "@remult/angular";
import { BoolColumn, ColumnSettings, Context, DateColumn, EntityClass, IdEntity, LookupColumn, NumberColumn, StringColumn, ValueListColumn, ValueListTypeInfo } from "@remult/core";
import { DynamicServerSideSearchDialogComponent } from "../../common/dynamic-server-side-search-dialog/dynamic-server-side-search-dialog.component";
import { validString } from "../../shared/utils";
import { Roles } from "../../users/roles";
import { UserId, Users } from "../../users/users";

@EntityClass
export class Ceritificate extends IdEntity {
    uid = extend(new UserId(this.context, {
        caption: 'בית קפה',
        validate: () => {
            validString(this.uid, { notNull: true, minLength: 3 });
        } 
    })).dataControl(dcs => {
        dcs.hideDataOnInput = true;
        dcs.clickIcon = 'search';
        dcs.getValue = () => this.uid.displayValue;
        dcs.click = async () => {
            await openDialog(DynamicServerSideSearchDialogComponent,
                dlg => dlg.args(Users, {
                    onClear: () => this.uid.value = '',
                    onSelect: cur => this.uid.value = cur.id.value,
                    searchColumn: cur => cur.name,
                    where: (cur) => cur.store.isEqualTo(true)
                })
            );
        };
    });
    type = new CeritificateTypeColumn({ caption: 'סוג תעודה' });
    docNum = new NumberColumn({ caption: 'מס.מסמך' });
    date = new DateColumn({ caption: 'תאריך' });
    neto = new NumberColumn({ caption: 'סה"כ נטו', decimalDigits: 2 });
    discountPcnt = new NumberColumn({ caption: 'אחוז הנחה', decimalDigits: 2 });
    discount = new NumberColumn({ caption: 'סכום הנחה', decimalDigits: 2 });
    priceAfterDiscount = new NumberColumn({ caption: 'סה"כ אחרי הנחות', decimalDigits: 2 });
    vat = new NumberColumn({ caption: 'מע"מ', decimalDigits: 2 });
    priceInvoice = new NumberColumn({ caption: 'סה"כ לחשבונית', decimalDigits: 2 });
    payed = new BoolColumn({ caption: 'שולם?' });
    transfered = new BoolColumn({ caption: 'הועבר?' });
    closeSent = new BoolColumn({ caption: 'סגור סופק?' });
    canceled = new BoolColumn({ caption: 'בוטל?' });

    constructor(private context: Context) {
        super({
            name: 'certificates',
            allowApiCRUD: [Roles.admin, Roles.technician],
            allowApiRead: c => c.isSignedIn()
        });
    }
}

export class CeritificateIdColumn extends LookupColumn<Ceritificate> {
    constructor(context: Context, settings?: ColumnSettings<string>) {
        super(context.for(Ceritificate), {
            caption: 'תעודה',
            displayValue: () => this.item.docNum.value.toString()
            , ...settings
        });
        extend(this).dataControl(dcs => {
            dcs.hideDataOnInput = true;
            dcs.clickIcon = 'search';
            dcs.getValue = () => this.displayValue;
            dcs.click = async () => {
                await openDialog(DynamicServerSideSearchDialogComponent,
                    dlg => dlg.args(Ceritificate, {
                        onClear: () => this.value = '',
                        onSelect: cur => this.value = cur.id.value,
                        searchColumn: cur => new StringColumn({ defaultValue: cur.docNum.value.toString() })
                    }));
            };
        });
    }
}

export class CeritificateType {
    static general = new CeritificateType('כללי');
    static bid = new CeritificateType('הצעת מחיר');
    static order = new CeritificateType('הזמנה');
    static shipping = new CeritificateType('תע.משלוח');
    static account = new CeritificateType('חשבון');
    static debit = new CeritificateType('תע.חיוב');
    static invoice = new CeritificateType('חשבונית');
    static invoiceReceipt = new CeritificateType('חשבונית קבלה');
    static receipt = new CeritificateType('קבלה');
    static refund = new CeritificateType('החזר');
    static returnedChecks = new CeritificateType('שיקים שחזרו');
    // static bill = new CeritificateType('כללי');
    constructor(public caption = '', color = 'blue') { }
    id: string;
}
export class CeritificateTypeColumn extends ValueListColumn<CeritificateType> {
    constructor(options?: ColumnSettings<CeritificateType>) {
        super(CeritificateType, {
            defaultValue: CeritificateType.general,
            ...options
        });
        extend(this).dataControl(x => {
            x.valueList = ValueListTypeInfo.get(CeritificateType).getOptions()
        });
    }
}

